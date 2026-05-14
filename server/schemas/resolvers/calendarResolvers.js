import { GraphQLError } from 'graphql';
import { getUserCalendarClient } from "../../services/googleClient.js";
import { inviteUserToEvent, importGoogleMeetingParents } from '../../services/calendarServices.js';

function mapCalendarEvent(calendarId, ev) {
    return {
        id: ev.id,
        recurringEventId: ev.recurringEventId || null,
        summary: ev.summary || "(Untitled)",
        description: ev.description || "",
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        calendarId,
        attendees: ev.attendees?.map(a => ({
            id: a.id,
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
            self: a.self || false,
            organizer: a.organizer || false,
        })) || []
    };
}

export default {
    Query: {
        googleCalendars: async (_, __, { user }) => {
            if (!user) throw new GraphQLError("Not logged in");

            const calendar = await getUserCalendarClient(user._id);
            const { data } = await calendar.calendarList.list();

            // Map only fields we care about
            return (data.items || []).map((c) => ({
                id: c.id,
                summary: c.summary,
                primary: Boolean(c.primary),
                accessRole: c.accessRole,
                backgroundColor: c.backgroundColor,
                foregroundColor: c.foregroundColor,
            }));
        },
        googleEvents: async (_, { calendarId, parentOnly = false }, { user }) => {
            if (!user?._id) throw new Error("Not Authenticated.");

            try {
                const calendar = await getUserCalendarClient(user._id);

                const listArgs = {
                    calendarId,
                    singleEvents: !parentOnly,
                    maxResults: 2500,
                };

                if (!parentOnly) {
                    listArgs.timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    listArgs.timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
                    listArgs.orderBy = "startTime";
                }

                const { data } = await calendar.events.list(listArgs);

                let items = data.items || [];
                if (parentOnly) {
                    // Keep only base events (single events + recurring masters), not expanded instances.
                    items = items.filter((ev) => !ev.recurringEventId && !(ev.id || "").includes("_R"));
                }

                return items.map((ev) => mapCalendarEvent(calendarId, ev));
            } catch (error) {
                console.error(`[googleEvents] Failed to load calendar ${calendarId}:`, error?.message || error);
                // Re-throw auth errors with clear message
                if (error?.message?.includes("authentication") || error?.message?.includes("credential") || error?.message?.includes("OAuth")) {
                    throw new GraphQLError(
                        `Google Calendar authentication failed. Please re-authenticate your Google Calendar access.`,
                        { originalError: error }
                    );
                }
                // Re-throw other errors as-is
                throw error;
            }
        },
        googleEventsForCalendars: async (_, { calendarIds }, { user }) => {
            if (!user?._id) throw new Error("Not Authenticated.");

            const sanitizedCalendarIds = Array.from(new Set((calendarIds || []).filter(Boolean)));
            if (!sanitizedCalendarIds.length) return [];

            const calendar = await getUserCalendarClient(user._id);

            const results = await Promise.all(
                sanitizedCalendarIds.map(async (calendarId) => {
                    try {
                        const { data } = await calendar.events.list({
                            calendarId,
                            singleEvents: false,
                            maxResults: 2500,
                        });

                        const items = (data.items || []).filter((ev) => !ev.recurringEventId && !(ev.id || "").includes("_R"));

                        return items.map((ev) => mapCalendarEvent(calendarId, ev));
                    } catch (error) {
                        console.error(`[googleEventsForCalendars] Failed to load calendar ${calendarId}:`, error?.message || error);
                        // Log auth errors but don't throw - return empty array to continue with other calendars
                        if (error?.message?.includes("authentication") || error?.message?.includes("credential") || error?.message?.includes("OAuth")) {
                            console.error(`[googleEventsForCalendars] Auth issue for calendar ${calendarId} - returning empty list for this calendar`);
                        }
                        return [];
                    }
                })
            );

            return results.flat();
        }
    },

    Mutation: {
        inviteUserToEvent: (_, args, context) => inviteUserToEvent(args, context),
        importGoogleMeetings: (_, args, context) => importGoogleMeetingParents(context.user),
    },
}; 