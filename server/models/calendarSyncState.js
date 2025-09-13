const CalendarSyncState = new Schema ({
    calendarId: { type: String, unique: true },
    syncToken: String,
    lastFullSync: Date
});
