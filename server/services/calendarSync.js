import { addMonths } from "date-fns";
import { getCalendarClient } from "./googleClient.js";
import CalendarSyncState from "../models/CalendarSyncState.js";
import Meeting from "../models/Meeting.js";

const FWD_MONTHS = 6; // How many months in the future to sync

function mapGoogleEvent(ev, calendarId) {
    const allDay = !!ev.start?.date;
    return {
        source: "google",
        ownership: "google",
        calendarId,
        gcalEventId: ev.id,
        iCalUID: ev.iCalUID,
        etag: ev.etag,
        title: ev.summary || "Untitled Event",
        description: ev.description || "",
        start: {
            dateTime: allDay ? new Date(ev.start.date + "T00:00:00Z") : new Date(ev.start.dateTime),
            timeZone: ev.start.timeZone || ev.originalStartTime?.timeZone || "UTC"
        },
        end: {
            dateTime: allDay ? new Date(ev.end.date + "T00:00:00Z") : new Date(ev.end.dateTime),
            timeZone: ev.end.timeZone || ev.originalEndTime?.timeZone || "UTC"
        },
        allDay,
        recurrence: ev.recurrence || [],
        extended: ev.extendedProperties || {},
        updatedAt: new Date()
    };
}

export async function syncCalendar(calendarId = "primary") {
  const calendar = await getCalendarClient();
  const state = await CalendarSyncState.findOne({ calendarId });

  const baseParams = state?.syncToken
    ? { syncToken: state.syncToken, showDeleted: true }
    : {
        timeMin: new Date().toISOString(),
        timeMax: addMonths(new Date(), FWD_MONTHS).toISOString(),
        singleEvents: true,
        showDeleted: true,
        maxResults: 2500
      };

  let pageToken = undefined;
  let nextSyncToken = undefined;

  do {
    const { data } = await calendar.events.list({
      calendarId,
      ...baseParams,
      pageToken
    });

    for (const ev of data.items || []) {
      if (ev.status === "cancelled") {
        // Soft-delete: remove if present
        await Meeting.deleteMany({ calendarId, gcalEventId: ev.id });
        continue;
      }

      const doc = mapGoogleEvent(ev, calendarId);
      await Meeting.updateOne(
        { calendarId, gcalEventId: ev.id },
        { $set: doc },
        { upsert: true }
      );
    }

    pageToken = data.nextPageToken;
    if (data.nextSyncToken) {
      nextSyncToken = data.nextSyncToken;
    }
  } while (pageToken);

  if (nextSyncToken) {
    await CalendarSyncState.updateOne(
      { calendarId },
      { $set: { syncToken: nextSyncToken, lastFullSync: new Date() } },
      { upsert: true }
    );
  }

  return { ok: true };
}
