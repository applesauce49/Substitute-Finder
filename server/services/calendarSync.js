import { addMonths } from "date-fns";
import { getUserCalendarClient } from "./googleClient.js";
import Meeting from "../models/Meeting.js";
// import CalendarSyncState from "../models/calendarSyncState.js"; // assuming you have this

const FWD_MONTHS = 6;

function mapGoogleEvent(ev, calendarId, userId) {
  const allDay = !!ev.start?.date;
  return {
    source: "google",
    ownership: "google",
    userId,
    calendarId,
    gcalEventId: ev.id,
    iCalUID: ev.iCalUID,
    etag: ev.etag,
    title: ev.summary || "Untitled Event",
    description: ev.description || "",
    start: {
      dateTime: allDay
        ? new Date(ev.start.date + "T00:00:00Z")
        : new Date(ev.start.dateTime),
      timeZone: ev.start.timeZone || ev.originalStartTime?.timeZone || "UTC",
    },
    end: {
      dateTime: allDay
        ? new Date(ev.end.date + "T00:00:00Z")
        : new Date(ev.end.dateTime),
      timeZone: ev.end.timeZone || ev.originalEndTime?.timeZone || "UTC",
    },
    allDay,
    recurrence: ev.recurrence || [],
    extended: ev.extendedProperties || {},
    updatedAt: new Date(),
  };
}

// export async function syncCalendar(userId, calendarId = "primary") {
//   const calendar = await getUserCalendarClient(userId);

//   const { data } = await calendar.calendarList.list();
//   for (const c of data.items) {
//     console.log(`[Calendar] ${c.summary} (${c.accessRole}) → ID: ${c.id}`);
//   }

//   const state = await CalendarSyncState.findOne({ calendarId, userId });

//   const baseParams = state?.syncToken
//     ? { syncToken: state.syncToken, showDeleted: true }
//     : {
//         timeMin: new Date().toISOString(),
//         timeMax: addMonths(new Date(), FWD_MONTHS).toISOString(),
//         singleEvents: true,
//         showDeleted: true,
//         maxResults: 2500,
//       };

//   let pageToken;
//   let nextSyncToken;

//   do {
//     const { data } = await calendar.events.list({
//       calendarId,
//       ...baseParams,
//       pageToken,
//     });

//     for (const ev of data.items || []) {
//       if (ev.status === "cancelled") continue;

//       console.log(`[Sync] Upserting event: ${ev.summary} (ID: ${ev.id})`);
//       const doc = mapGoogleEvent(ev, calendarId, userId);
//       console.log("[Sync] Document to insert:", doc);

//       await Meeting.updateOne(
//         { calendarId, gcalEventId: ev.id },
//         { $set: doc },
//         { upsert: true }
//       );
//     }

//     pageToken = data.nextPageToken;
//     if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
//   } while (pageToken);

//   if (nextSyncToken) {
//     await CalendarSyncState.updateOne(
//       { calendarId, userId },
//       { $set: { syncToken: nextSyncToken, lastFullSync: new Date() } },
//       { upsert: true }
//     );
//   }

//   return { ok: true };
// }