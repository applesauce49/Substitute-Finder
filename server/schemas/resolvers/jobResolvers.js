import { GraphQLError } from 'graphql';
import { Job, User, Meeting } from "../../models/index.js";
import { pubsub } from '../../graphql/pubsub.js';
import { getImpersonatedCalendarClient, getUserCalendarClient } from '../../services/googleClient.js';
import { inviteUserToEvent } from '../../services/calendarServices.js';
import { runMatchEngine, previewMatchEngineForMeeting } from '../../matchEngine/matchEngine.js';
import { postJobToGoogleChat, postJobCancelledToGoogleChat, postJobAssignedToGoogleChat } from "../../utils/chatJobNotifier.js";
import { getDefaultWorkloadBalanceWindowDays } from "../../services/systemSettingsService.js";

export default {
    Query: {
        jobs: async (_, { showAll }, context) => {
            const now = new Date();
            let filter = {};
            if (!showAll)
                filter = { "meetingSnapshot.startDateTime": { $gte: now } };

            return Job.find(filter)
                .populate("createdBy", "_id username email")
                .populate("assignedTo", "_id username email")
                .populate("meetingSnapshot", "_id title startDateTime")
                .populate("applications")
                .sort({ createdAt: -1 });
        },
        job: async (_, { _id }) => {
            const job = await Job.findById(_id)
                .populate({ path: "createdBy", select: "_id username email" })
                .populate({ path: "assignedTo", select: "_id username email " })
                .populate({ path: "meetingSnapshot", select: "eventId title startDateTime endDateTime" })
                .populate({ path: "applications.user", select: "_id username email" });

            if (!job) throw new Error("Job not found");
            return job;
        },
        matchEngineDryRun: async (_, { meetingId }) => {
            try {
                if (!meetingId) {
                    throw new GraphQLError("Meeting ID is required", {
                        extensions: { code: 'MISSING_MEETING_ID' }
                    });
                }

                const meeting = await Meeting.findById(meetingId);
                if (!meeting) {
                    throw new GraphQLError("Meeting not found", {
                        extensions: { code: 'MEETING_NOT_FOUND' }
                    });
                }

                return previewMatchEngineForMeeting(meetingId, null, "meeting");
            } catch (error) {
                console.error('matchEngineDryRun error:', error);
                throw new GraphQLError(error.message || 'Failed to run meeting dry run analysis', {
                    extensions: { 
                        code: error.extensions?.code || 'INTERNAL_ERROR',
                        originalError: error.message
                    }
                });
            }
        },
        matchEngineJobDryRun: async (_, { jobId }) => {
            try {
                console.log(`\n=== DEBUG: matchEngineJobDryRun for jobId: ${jobId} ===`);
                
                const job = await Job.findById(jobId);
                if (!job) {
                    throw new GraphQLError("Job not found", {
                        extensions: { code: 'JOB_NOT_FOUND' }
                    });
                }

                console.log('Job meetingSnapshot:', JSON.stringify(job.meetingSnapshot, null, 2));

                // Find the original Meeting document using event IDs from meetingSnapshot
                const eventIds = [
                    job.meetingSnapshot?.eventId,
                    job.meetingSnapshot?.gcalEventId,
                    job.meetingSnapshot?.gcalRecurringEventId
                ].filter(Boolean);

                console.log('Extracted eventIds:', eventIds);

                if (eventIds.length === 0) {
                    throw new GraphQLError("Job has no valid event IDs to match against meetings", {
                        extensions: { code: 'INVALID_EVENT_DATA' }
                    });
                }
                
                // Let's see what meetings exist in the system
                const allMeetings = await Meeting.find({}).select('_id eventId gcalEventId gcalRecurringEventId summary').lean();
                console.log(`\nTotal meetings in database: ${allMeetings.length}`);
                console.log('First 5 meetings:', allMeetings.slice(0, 5).map(m => ({
                    _id: m._id,
                    eventId: m.eventId,
                    gcalEventId: m.gcalEventId,
                    gcalRecurringEventId: m.gcalRecurringEventId,
                    summary: m.summary
                })));
                
                const meeting = await Meeting.findOne({
                    $or: [
                        { eventId: { $in: eventIds } },
                        { gcalEventId: { $in: eventIds } },
                        { gcalRecurringEventId: { $in: eventIds } }
                    ]
                });

                console.log('Found meeting:', meeting ? {
                    _id: meeting._id,
                    eventId: meeting.eventId,
                    gcalEventId: meeting.gcalEventId,
                    gcalRecurringEventId: meeting.gcalRecurringEventId,
                    summary: meeting.summary
                } : null);

                if (!meeting) {
                    // Additional debugging: try to find partial matches
                    console.log('\n=== DEBUGGING: Attempting partial matches ===');
                    for (const eventId of eventIds) {
                        const partialMatches = await Meeting.find({
                            $or: [
                                { eventId: eventId },
                                { gcalEventId: eventId },
                                { gcalRecurringEventId: eventId }
                            ]
                        }).select('_id eventId gcalEventId gcalRecurringEventId summary').lean();
                        console.log(`Matches for eventId '${eventId}':`, partialMatches);
                    }
                    
                    console.log('\n=== FALLBACK: Job has no corresponding Meeting document ===');
                    console.log('This is normal for jobs created directly from Google Calendar events.');
                    console.log('Creating virtual meeting from job meetingSnapshot data...');
                    
                    // Create a virtual meeting object from the job's meetingSnapshot
                    // This handles cases where jobs are created from calendar events
                    // but no corresponding Meeting document exists in the system
                    const defaultWorkloadBalance = await getDefaultWorkloadBalanceWindowDays();
                    const virtualMeeting = {
                        _id: job._id, // Use job ID as meeting ID for this case
                        summary: job.meetingSnapshot.title,
                        description: job.meetingSnapshot.description || '',
                        start: job.meetingSnapshot.startDateTime,
                        end: job.meetingSnapshot.endDateTime,
                        eventId: job.meetingSnapshot.eventId,
                        gcalEventId: job.meetingSnapshot.gcalEventId,
                        gcalRecurringEventId: job.meetingSnapshot.gcalRecurringEventId,
                        constraintGroupIds: [], // No constraints for jobs without Meeting documents
                        workloadBalanceWindowDays: defaultWorkloadBalance // Use system default
                    };
                    
                    console.log('Virtual meeting created:', {
                        _id: virtualMeeting._id,
                        summary: virtualMeeting.summary,
                        eventId: virtualMeeting.eventId,
                        constraintCount: 0,
                        workloadBalance: null
                    });
                    
                    // Call the match engine with the virtual meeting data
                    // We'll modify previewMatchEngineForMeeting to accept a virtual meeting parameter
                    return await previewMatchEngineForMeeting(virtualMeeting._id, null, "job", jobId, virtualMeeting);
                }

                console.log(`=== SUCCESS: Found meeting ${meeting._id}, proceeding with dry run ===\n`);
                return previewMatchEngineForMeeting(meeting._id, null, "job", jobId);
            } catch (error) {
                console.error('matchEngineJobDryRun error:', error);
                throw new GraphQLError(error.message || 'Failed to run job dry run analysis', {
                    extensions: { 
                        code: error.extensions?.code || 'INTERNAL_ERROR',
                        originalError: error.message
                    }
                });
            }
        },
        jobMetricsOverTime: async (_, { days = 30 }) => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const metrics = await Job.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $addFields: {
                        dateOnly: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        assignedDateOnly: {
                            $cond: {
                                if: { $ne: ["$assignedAt", null] },
                                then: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$assignedAt"
                                    }
                                },
                                else: null
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$dateOnly",
                        jobsPosted: { $sum: 1 },
                        jobsAssigned: {
                            $sum: {
                                $cond: [{ $ne: ["$assignedTo", null] }, 1, 0]
                            }
                        },
                        totalApplications: {
                            $sum: { $size: { $ifNull: ["$applications", []] } }
                        }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ]);
            
            return metrics.map(m => ({
                date: m._id,
                jobsPosted: m.jobsPosted,
                jobsAssigned: m.jobsAssigned,
                totalApplications: m.totalApplications
            }));
        },
    },
    Mutation: {
        addJob: async (_, { description, createdBy, meeting, calendarId }, context) => {
            // if (!context.user) {
            //     throw new AuthenticationError('You need to be logged in!');
            // }
            const user = await User.findById(createdBy);
            if (!user) {
                return {
                    conflict: true,
                    message: "Unable to find createdBy user",
                    job: null,
                }
            }

            const existingJob = await Job.findOne({
                "meetingSnapshot.eventId": meeting,
                createdBy: createdBy,
                active: true,
            });
            if (existingJob) {
                return {
                    conflict: true,
                    message: "You have already created a job for this meeting on this date.",
                    job: existingJob,
                }
            };

            // const calendar = await getUserCalendarClient(context.user);
            const calendar = await getImpersonatedCalendarClient(user.email);

            const eventResponse = await calendar.events.get({
                calendarId: calendarId,
                eventId: meeting,
            })

            const ev = eventResponse.data;

            const meetingSnapshot = {
                eventId: ev.id,
                gcalEventId: ev.id,
                gcalRecurringEventId: ev.recurringEventId,
                calendarId: calendarId || ev.organizer?.email,
                title: ev.summary || "No Title",
                description: ev.description || "",
                startDateTime: ev.start?.dateTime || ev.start?.date,
                endDateTime: ev.end?.dateTime || ev.end?.date,
            };

            const newJob = await Job.create({
                active: true,
                description,
                meetingSnapshot,
                createdBy: user._id,
            });

            // Package the info and publish to subscribers
            console.log("Publishing JOB_CREATED event");

            await pubsub.publish("JOB_CREATED", { jobCreated: newJob });

            // Gather info and post to Google Chat
            const jobInfo = { ...newJob._doc, createdBy: user, meetingSnapshot: meetingSnapshot };

            await postJobToGoogleChat(jobInfo);
            newJob.firstNotificationSent = true;
            await newJob.save();

            return {
                conflict: false,
                message: "Job created successfully",
                job: await newJob.populate("createdBy"),
            }
        },

        applyForJob: async (_, { jobId, applicantId }, context) => {
            if (!context.user) {
                throw new AuthenticationError("You must be logged in");
            }

            const job = await Job.findById(jobId);
            if (!job) throw new Error("Job not found");

            // prevent duplicate applications
            if (job.applications.includes(applicantId)) {
                throw new Error("Already applied");
            }

            // push properly shaped subdoc
            job.applications.push({
                user: applicantId,
                appliedAt: new Date()
            });

            await job.save();

            await job.populate("createdBy");
            await job.populate("applications");

            console.log("Publishing JOB_UPDATED event");
            pubsub.publish("JOB_UPDATED", { jobUpdated: job });
            return job;
        },

        cancelJob: async (_, { jobId }, context) => {
            console.log("context.user:", context.user);

            if (!context.user) throw new GraphQLError("Not logged in");

            const job = await Job.findById(jobId).lean();
            if (!job) throw new Error("Job not found");

            try {
                // Optional: only allow creator or admin
                if (job.createdBy.toString() !== context.user._id.toString() && !context.user.admin) {
                    throw new GraphQLError("Not authorized");
                }
            } catch (err) {
                console.error("Authorization error:", err);
                throw new GraphQLError(err.message);
            }

            const user = await User.findById(job.createdBy);

            // Delete the job

            await Job.findByIdAndDelete(jobId);

            await pubsub.publish("JOB_CANCELED", { jobCanceled: jobId });

            // Gather info and post to Google Chat
            const jobInfo = { job, createdBy: user.username, meetingSnapshot: job.meetingSnapshot };

            await postJobCancelledToGoogleChat(jobInfo);

            return true;   // ✅ GraphQL expects something back
        },

        acceptApplication: async (_, { jobId, applicationId }, context) => {
            // if (!context.user) {
            //   throw new AuthenticationError("Not logged in");
            // }
            console.log(`Accepting application ${applicationId} for jobId ${jobId}`)
            const job = await Job.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            console.log("Job found:", job);

            const acceptedApp = (job.applications || []).find(
                (a) => String(a?._id) === String(applicationId)
            );

            if (!acceptedApp) {
                throw new Error("Application not found.");
            }

            // Get the user who applied
            const assignedTo = await User.findById(acceptedApp.user);
            if (!assignedTo) {
                throw new Error("Applicant user not found.");
            }

            // get the user who created the job
            const jobCreator = await User.findById(job.createdBy);
            if (!jobCreator) {
                throw new Error("Job creator user not found.");
            }

            // mark job as inactive and assign user
            job.active = false;
            job.assignedTo = acceptedApp.user._id;
            job.assignedAt = new Date();

            // Invite the accepted user to the meeting
            await inviteUserToEvent(
                {
                    calendarId: job.meetingSnapshot.calendarId,
                    eventId: job.meetingSnapshot.eventId,
                    attendee: assignedTo.email,
                    organizer: jobCreator.email,
                },
                context // this contains context.user
            );
            await job.save();

            await pubsub.publish("JOB_ASSIGNED", { jobAssigned: job });

            await postJobAssignedToGoogleChat(
                job.meetingSnapshot.title,
                jobCreator.username,
                assignedTo.username,
                job.meetingSnapshot.startDateTime
            )

            // add job to the accepted user's profile
            await User.findByIdAndUpdate(
                acceptedApp.user._id,
                { $addToSet: { acceptedJobs: job._id } },
                { new: true }
            );

            return {
                success: true,
                jobId: job._id,
                assignedAt: job.assignedAt
            };
        },

        declineApplication: async (_, { jobId, applicationId }, context) => {
            if (!context.user) {
                throw new GraphQLError("Not logged in");
            }

            // Try to update the job and remove the application entry
            const job = await Job.findByIdAndUpdate(
                jobId,
                { $pull: { applications: { _id: applicationId } } },
                { new: true }
            );

            if (!job) {
                throw new Error("Job not found");
            }

            return true; // simple success indicator
        },

        runMatchEngine: async (_, __, context) => {
            // if (!context.user || context.user.role !== "admin") {
            //   throw new Error("Unauthorized");
            // }
            await runMatchEngine();
            return true;
        },
    },
    Subscription: {
        jobUpdated: {
            subscribe: () => {
                console.log("Subscription to jobUpdated initiated");
                return pubsub.asyncIterableIterator(['JOB_UPDATED']);
            },
        },
        jobCreated: {
            subscribe: () => {
                console.log("Subscription to jobCreated initiated");
                return pubsub.asyncIterableIterator(['JOB_CREATED']);
            },
        },
        jobCanceled: {
            subscribe: () => {
                console.log("Subscription to jobCanceled initiated");
                return pubsub.asyncIterableIterator(['JOB_CANCELED']);
            },
        },
        jobAssigned: {
            subscribe: () => {
                console.log("Subscription to jobAssigned initiated");
                return pubsub.asyncIterableIterator(['JOB_ASSIGNED']);
            },
        },

    },
    Job: {
        applicationCount: (job) => job.applications?.length || 0,
    }
};
