import { GraphQLError } from 'graphql';
import { getUserCalendarClient } from "../../services/googleClient.js";
import { inviteUserToEvent } from '../../services/calendarServices.js';

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
        googleEvents: async (_, { calendarId }, { user }) => {
            if (!user?._id) throw new Error("Not Authenticated.");

            const calendar = await getUserCalendarClient(user._id);

            const { data } = await calendar.events.list({
                calendarId,
                timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                singleEvents: true,
                orderBy: "startTime",
                maxResults: 2500,
            });

            return (data.items || []).map(ev => ({
                id: ev.id,
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
            }))
        }
    },

    Mutation: {
        inviteUserToEvent: (_, args, context) => inviteUserToEvent(args, context),
    },
    Meeting: {
        startDateTime: (meeting) => meeting.start?.dateTime || null,
        endDateTime: (meeting) => meeting.end?.dateTime || null,
    }
};