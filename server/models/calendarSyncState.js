// /server/models/CalendarSyncState.js
import { Schema, model } from "mongoose";

const calendarSyncStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  calendarId: { type: String, required: true },
  syncToken: { type: String },
  lastFullSync: { type: Date }
});

calendarSyncStateSchema.index({ userId: 1, calendarId: 1 }, { unique: true });

const CalendarSyncState = model("CalendarSyncState", calendarSyncStateSchema);

export default CalendarSyncState;