import { getImpersonatedCalendarClient } from "./googleClient.js";
import { GraphQLError } from 'graphql';

export async function inviteUserToEvent({ calendarId, eventId, email }) {
    let calendar = await getImpersonatedCalendarClient(email);
    console.log("Got Impersonated Calendar Client:", calendar);

    console.log("Fetching event to invite user:", email, eventId);

    let event;
    try {
        ({ data: event } = await calendar.events.get({
            calendarId,
            eventId,
        }));
    } catch (error) {
        console.error("Error fetching event:", error);
        throw new GraphQLError("Failed to fetch event for invitation");
    }

    // check if the organizer matches, and get a new calendar client if needed
    if (event.organizer?.email !== email) {
        console.log("Organizer email does not match. Getting new calendar client for organizer:", event.organizer?.email);
        const organizerCalendar = await getImpersonatedCalendarClient(event.organizer?.email);
        console.log("Got new Calendar Client for organizer:", organizerCalendar);
        calendar = organizerCalendar;
    }

    const existingAttendees = event.attendees || [];
    const alreadyInvited = existingAttendees.some(a => a.email === email);

    if (!alreadyInvited) {
        existingAttendees.push({ email });
    }

    console.log("Inviting user to event:", email, eventId);
    console.log("Existing attendees:", existingAttendees);
    console.log("Event before update:", event);
    console.log("Calendar ID:", calendarId);

    const result = await calendar.events.patch({
        calendarId,
        eventId,
        sendUpdates: 'all',
        requestBody: {
            attendees: existingAttendees,
        }
    });

    console.log("Event updated successfully:", result);
    const updatedEvent = result?.data || {};
    return {
        id: updatedEvent.id,
        summary: updatedEvent.summary || "(Untitled}",
        description: updatedEvent.description || "",
        start: updatedEvent.start?.dateTime || updatedEvent.start.date,
        end: updatedEvent.end?.dateTime || updatedEvent.end.date,
        calendarId,
        attendees: updatedEvent.attendees?.map(a => ({
            id: a.id,
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
            self: a.self || false,
            organizer: a.organizer || false,
        })) || []
    };
}
