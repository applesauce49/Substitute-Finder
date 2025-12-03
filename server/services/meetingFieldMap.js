export const GOOGLE_TO_MEETING_FIELD_MAP = {
  source: () => "google",
  calendarId: "organizer.email",
  gcalEventId: "id",
  gcalRecurringEventId: "recurringEventId",
  owner: "creator.email",
  createdAt: "created",
  summary: "summary",
  description: "description",
  start: "start.dateTime",
  end: "end.dateTime",
  timezone: "start.timeZone",
  updatedAt: () => new Date(),
}


