import { getImpersonatedCalendarClient } from "./googleClient.js";
import { GraphQLError } from 'graphql';
import { google } from "googleapis";
import RRuleLib from "rrule";
const { RRule } = RRuleLib;
import Meeting  from "../models/Meeting.js";
import { GOOGLE_TO_MEETING_FIELD_MAP } from "./meetingFieldMap.js";
import { RECURRENCE_SCHEMA } from "../models/helpers/recurrenceSchema.js";

// Utility to resolve paths like "organizer.email"
function getValueByPath(obj, path) {
  return path
    .split(".")
    .reduce((acc, part) => (acc !== undefined ? acc[part] : undefined), obj);
}

function mapGoogleEventToMeeting(event, ctx = {}) {
  const result = {};

  for (const [field, rule] of Object.entries(GOOGLE_TO_MEETING_FIELD_MAP)) {
    // Rule is a string path like "organizer.email"
    if (typeof rule === "string") {
      result[field] = getValueByPath(event, rule);
      continue;
    }

    // Rule is a function → dynamic value generation
    if (typeof rule === "function") {
      result[field] = rule(ctx, event);
      continue;
    }

    // Ignore anything else silently
  }

  return result;
}

function convertRRuleToRecurrence(rule, event) {
  const rec = { ...RECURRENCE_SCHEMA };

  rec.frequency = RRule.FREQUENCIES[rule.options.freq] || null;

  // Byweekday → ["MO", "WE", ...]
  rec.daysOfWeek =
    rule.options.byweekday?.map((d) => d.toString()) ?? [];

  // Extract template start/end time from event
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  rec.startTime = start.toISOString().substring(11, 16); // HH:mm
  rec.endTime = end.toISOString().substring(11, 16);

  // Recurrence end date
  rec.until = rule.options.until || null;

  rec.timezone = event.start.timeZone || null;

  return rec;
}

export async function inviteUserToEvent({ calendarId, eventId, organizer, attendee }) {
  let calendar = await getImpersonatedCalendarClient(organizer);
  console.log("Got Impersonated Calendar Client:", calendar);

  console.log("Fetching event to invite user:", attendee, eventId);

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
  if (event.organizer?.email !== organizer) {
    console.log("Organizer email does not match. Getting new calendar client for organizer:", event.organizer?.email);
    const organizerCalendar = await getImpersonatedCalendarClient(event.organizer?.email);
    console.log("Got new Calendar Client for organizer:", organizerCalendar);
    calendar = organizerCalendar;
  }

  const existingAttendees = event.attendees || [];
  const alreadyInvited = existingAttendees.some(a => a.email === attendee);

  if (!alreadyInvited) {
    existingAttendees.push({
      email: attendee,
    });
  }

  console.log("Inviting user to event:", attendee, eventId);
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


export async function importGoogleMeetingParents(user) {

  console.log("Importing Google Meeting Parents for user:", user.username);
  const calendar = await getImpersonatedCalendarClient("meetings@oplm.com");


  // Pull parent events ONLY
  const response = await calendar.events.list({
    calendarId: "primary",
    singleEvents: false,     // IMPORTANT: don't expand instances
    maxResults: 500,
    timeMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const events = response.data.items || [];
  const now = new Date();

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let expired = 0;

  for (const e of events) {
    // Skip events with no ID (rare, but safe)
    if (!e.id) {
      skipped++;
      continue;
    }

    // Handle recurring events
    const recurrence = e.recurrence || null;

    // If the event is recurring, enforce weekly frequency
    if (recurrence && Array.isArray(recurrence)) {
      const rruleLine = recurrence.find(r => r.startsWith("RRULE:"));

      if (!rruleLine) {
        // Has recurrence[] but no RRULE — weird, skip
        console.log("Recurring event with no RRULE, skipping:", e.id);
        skipped++;
        continue;
      }

      // Parse the RRULE into a rule object
      const ruleText = rruleLine.replace("RRULE:", "");
      const rule = RRule.fromString(ruleText);
      
      // Keep ONLY weekly
      if (rule.options.freq !== RRule.WEEKLY) {
        console.log("Skipping non-weekly recurring event:", e.id);
        skipped++;
        continue;
      }
      
      // If there's an UNTIL and it's in the past → skip
      if (rule.options.until && rule.options.until < now) {

        expired++;
        continue;
      }
      
      console.log("Parsed RRULE:", rule);
    }
    else {
      // Not a recurring event, skip
      console.log("Skipping non-recurring event:", e.id);
      skipped++;
      continue;
    }

    const exists = await Meeting.findOne({ gcalEventId: e.id });

    // Produce the fields to update (from Google + context)
    const mapped = mapGoogleEventToMeeting(e, { user });

    // Add recurrence attributes
    if (recurrence && Array.isArray(recurrence)) {
      const rruleLine = recurrence.find(r => r.startsWith("RRULE:"));
      if (rruleLine) {
        const ruleText = rruleLine.replace("RRULE:", "");
        const rule = RRule.fromString(ruleText);
        mapped.recurrence = convertRRuleToRecurrence(rule, e);
      }
    }

    // Update or insert atomically
    await Meeting.findOneAndUpdate(
      { gcalEventId: e.id },
      { $set: mapped },
      { upsert: true }
    );

    if (exists) updated++;
    else imported++;
  }

  return { imported, skipped, updated, expired };
}
