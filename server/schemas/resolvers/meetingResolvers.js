import Meeting from '../../models/Meeting.js';
import ConstraintGroup from '../../matchEngine/Schemas/ConstraintGroup.js';
import { updateMeetingSystemAttributes } from '../../services/userAttributeService.js';
import { Job, User } from '../../models/index.js';
import { getImpersonatedCalendarClient } from '../../services/googleClient.js';
import { GraphQLError } from 'graphql';
import {
    normalizeMeetingGoogleLinkFields,
    toRecurringBaseId,
} from '../../utils/googleEventIds.js';

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

export default {
    Query: {
        meetings: async () => {
            return Meeting.find({})
                .populate('owner')
                .populate('host')
                .populate('coHost')
                .populate('alternateHost')
                .sort({ createdAt: -1 });
        }
    },

    Mutation: {
        createMeeting: async (_, { input }) => {
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const linkedJobIds = Array.isArray(input.linkedJobIds)
                ? input.linkedJobIds
                : [];

            const meetingData = {
                ...input,
                constraintGroupIds,
                linkedJobIds,
            };
            const normalizedMeetingData = normalizeMeetingGoogleLinkFields(meetingData);

            // Map user IDs to the correct field names
            if (input.hostId) normalizedMeetingData.host = input.hostId;
            if (input.coHostId) normalizedMeetingData.coHost = input.coHostId;
            if (input.alternateHostId) normalizedMeetingData.alternateHost = input.alternateHostId;

            // Remove the input field names that don't match the schema
            delete normalizedMeetingData.hostId;
            delete normalizedMeetingData.coHostId;
            delete normalizedMeetingData.alternateHostId;

            const meeting = new Meeting(normalizedMeetingData);
            const saved = await meeting.save();

            // Update system attributes for affected users
            await updateMeetingSystemAttributes(normalizedMeetingData);

            // Populate user references before returning
            return Meeting.findById(saved._id)
                .populate('host')
                .populate('coHost')
                .populate('alternateHost');
        },

        updateMeeting: async (_, { id, input }) => {
            // Get the old meeting data first
            const oldMeeting = await Meeting.findById(id);
            
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const linkedJobIds = Array.isArray(input.linkedJobIds)
                ? input.linkedJobIds
                : [];

            const updateData = {
                ...input,
                constraintGroupIds,
                linkedJobIds,
            };
            const normalizedUpdateData = normalizeMeetingGoogleLinkFields(updateData);

            // Map user IDs to the correct field names
            if (input.hostId) normalizedUpdateData.host = input.hostId;
            if (input.coHostId) normalizedUpdateData.coHost = input.coHostId;
            if (input.alternateHostId) normalizedUpdateData.alternateHost = input.alternateHostId;

            // Remove the input field names that don't match the schema
            delete normalizedUpdateData.hostId;
            delete normalizedUpdateData.coHostId;
            delete normalizedUpdateData.alternateHostId;

            const updatedMeeting = await Meeting.findByIdAndUpdate(
                id,
                {
                    $set: normalizedUpdateData,
                },
                { new: true }
            )
            .populate('host')
            .populate('coHost')
            .populate('alternateHost');

            // Update system attributes for affected users
            await updateMeetingSystemAttributes(normalizedUpdateData, oldMeeting);

            return updatedMeeting;
        },

        syncMeetingAssignmentsFromCalendar: async (_, { meetingId, dryRun = false }, context) => {
            if (!context.user?.admin) {
                throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            const meeting = await Meeting.findById(meetingId).lean();
            if (!meeting) {
                throw new GraphQLError('Meeting not found', { extensions: { code: 'MEETING_NOT_FOUND' } });
            }

            const calendarId = (meeting.calendarId || '').trim();
            const storedEventId = (meeting.gcalEventId || '').trim();
            const storedRecurringEventId = (meeting.gcalRecurringEventId || '').trim();
            const preferredParentEventId = (storedRecurringEventId || toRecurringBaseId(storedEventId) || storedEventId).trim();
            if (!calendarId || !preferredParentEventId) {
                throw new GraphQLError('Meeting must be linked to a Google Calendar event before syncing assignments.', {
                    extensions: { code: 'MEETING_NOT_LINKED' },
                });
            }

            const calendar = await getImpersonatedCalendarClient(calendarId);
            let event;
            let resolvedParentEventId = preferredParentEventId;
            try {
                ({ data: event } = await calendar.events.get({
                    calendarId,
                    // Always prefer recurring parent/master event as sync source of truth.
                    eventId: preferredParentEventId,
                }));
            } catch (error) {
                const notFound = error?.code === 404 || error?.message?.includes('Not Found');
                if (notFound && storedEventId && storedEventId !== preferredParentEventId) {
                    // Legacy fallback: load instance and then hop to parent when possible.
                    let legacyEvent;
                    try {
                        ({ data: legacyEvent } = await calendar.events.get({
                            calendarId,
                            eventId: storedEventId,
                        }));
                    } catch (legacyError) {
                        const legacyNotFound = legacyError?.code === 404 || legacyError?.message?.includes('Not Found');
                        if (legacyNotFound) {
                            throw new GraphQLError('Linked Google event was not found.', {
                                extensions: { code: 'CALENDAR_EVENT_NOT_FOUND' },
                            });
                        }
                        throw legacyError;
                    }

                    const parentFromLegacy = (legacyEvent?.recurringEventId || toRecurringBaseId(legacyEvent?.id) || '').trim();
                    if (parentFromLegacy && parentFromLegacy !== legacyEvent?.id) {
                        resolvedParentEventId = parentFromLegacy;
                        ({ data: event } = await calendar.events.get({
                            calendarId,
                            eventId: resolvedParentEventId,
                        }));
                    } else {
                        // Single event or missing parent metadata.
                        resolvedParentEventId = (legacyEvent?.id || preferredParentEventId).trim();
                        event = legacyEvent;
                    }
                } else if (notFound) {
                    throw new GraphQLError('Linked Google event was not found.', {
                        extensions: { code: 'CALENDAR_EVENT_NOT_FOUND' },
                    });
                }
                else {
                    throw error;
                }
            }

            // If an instance slipped through, force parent fetch before using attendees.
            if (event?.recurringEventId && event.recurringEventId !== event.id) {
                resolvedParentEventId = event.recurringEventId;
                ({ data: event } = await calendar.events.get({
                    calendarId,
                    eventId: resolvedParentEventId,
                }));
            }

            if (event?.status === 'cancelled') {
                throw new GraphQLError('Linked Google event is cancelled.', {
                    extensions: { code: 'CALENDAR_EVENT_CANCELLED' },
                });
            }

            const attendeeEmails = Array.from(
                new Set(
                    (event?.attendees || [])
                        .filter((attendee) => attendee?.email && !attendee?.organizer && !attendee?.resource)
                        .map((attendee) => normalizeEmail(attendee.email))
                )
            );

            const warnings = [];
            if (!attendeeEmails.length) {
                warnings.push('Linked Google event has no non-organizer attendees to map to users.');
            }
            warnings.push(`Synced against Google parent event: ${resolvedParentEventId}`);

            const matchingUsers = attendeeEmails.length
                ? await User.find({ email: { $in: attendeeEmails } }).select('_id email username').lean()
                : [];
            const userByEmail = new Map(matchingUsers.map((u) => [normalizeEmail(u.email), u]));

            const linkIds = Array.from(new Set([
                resolvedParentEventId,
                meeting.gcalEventId,
                meeting.gcalRecurringEventId,
                toRecurringBaseId(meeting.gcalEventId),
                toRecurringBaseId(meeting.gcalRecurringEventId),
            ].filter(Boolean)));

            const idRegexes = linkIds.map((id) => new RegExp(`^${escapeRegex(id)}(?:_R.*)?$`));
            const relatedJobQuery = {
                $or: [
                    { _id: { $in: meeting.linkedJobIds || [] } },
                    { 'meetingSnapshot.eventId': { $in: linkIds } },
                    { 'meetingSnapshot.gcalEventId': { $in: linkIds } },
                    { 'meetingSnapshot.gcalRecurringEventId': { $in: linkIds } },
                    ...idRegexes.map((regex) => ({ 'meetingSnapshot.eventId': regex })),
                    ...idRegexes.map((regex) => ({ 'meetingSnapshot.gcalEventId': regex })),
                    ...idRegexes.map((regex) => ({ 'meetingSnapshot.gcalRecurringEventId': regex })),
                ],
            };

            const jobs = await Job.find(relatedJobQuery)
                .populate('assignedTo', '_id email')
                .lean();

            let updatedJobs = 0;
            let assignedJobs = 0;
            let unassignedJobs = 0;
            let skippedAmbiguousJobs = 0;

            for (const job of jobs) {
                const currentAssignedId = job?.assignedTo?._id ? String(job.assignedTo._id) : (job.assignedTo ? String(job.assignedTo) : null);
                const currentAssignedEmail = normalizeEmail(job?.assignedTo?.email);

                if (currentAssignedEmail && attendeeEmails.includes(currentAssignedEmail)) {
                    continue;
                }

                const attendeeUsers = attendeeEmails
                    .map((email) => userByEmail.get(email))
                    .filter(Boolean);

                if (attendeeUsers.length > 1) {
                    skippedAmbiguousJobs += 1;
                    warnings.push(`Job ${job._id}: multiple attendee users match this event (${attendeeUsers.map((u) => u.email).join(', ')}).`);
                    continue;
                }

                const nextUser = attendeeUsers[0] || null;
                const nextAssignedId = nextUser ? String(nextUser._id) : null;

                if (currentAssignedId === nextAssignedId) {
                    continue;
                }

                updatedJobs += 1;

                if (!dryRun) {
                    if (currentAssignedId) {
                        await User.findByIdAndUpdate(currentAssignedId, {
                            $pull: {
                                assignedJobs: { job: job._id },
                                acceptedJobs: job._id,
                            },
                        });
                    }

                    if (nextAssignedId) {
                        await User.findByIdAndUpdate(nextAssignedId, {
                            $addToSet: {
                                acceptedJobs: job._id,
                                assignedJobs: { job: job._id, assignedAt: new Date() },
                            },
                        });
                    }

                    const nextActive = nextAssignedId
                        ? false
                        : (job?.meetingSnapshot?.startDateTime && new Date(job.meetingSnapshot.startDateTime) > new Date());

                    await Job.findByIdAndUpdate(job._id, {
                        $set: {
                            assignedTo: nextAssignedId,
                            assignedAt: nextAssignedId ? new Date() : null,
                            active: Boolean(nextActive),
                        },
                    });
                }

                if (nextAssignedId) assignedJobs += 1;
                else unassignedJobs += 1;
            }

            if (!jobs.length) {
                warnings.push('No local jobs were found for this linked meeting.');
            }

            return {
                meetingId,
                reviewedJobs: jobs.length,
                updatedJobs,
                assignedJobs,
                unassignedJobs,
                skippedAmbiguousJobs,
                warnings,
            };
        },
    },

    Meeting: {
        constraintGroupIds: (meeting) => {
            console.log("[Meeting.constraintGroupIds] value:", meeting.constraintGroupIds);
            return Array.isArray(meeting.constraintGroupIds)
                ? meeting.constraintGroupIds
                : [];
        },

        linkedJobIds: (meeting) => {
            return Array.isArray(meeting.linkedJobIds)
                ? meeting.linkedJobIds
                : [];
        },

        constraintGroups: async (meeting) => {
            console.log("[Meeting.constraintGroups] called with ids:", meeting.constraintGroupIds);
            const ids = Array.isArray(meeting.constraintGroupIds)
                ? meeting.constraintGroupIds
                : [];

            if (!ids.length) return [];

            return ConstraintGroup.find({ _id: { $in: ids } }).sort({ name: 1 });
        },
    },
};