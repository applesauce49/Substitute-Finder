import { Schema, model } from "mongoose";

const meetingSnapshotSchema = new Schema({
    eventId: { type: String, required: true  },
    gcalEventId: { type: String },
    gcalRecurringEventId: { type: String },
    calendarId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    startDateTime: { 
        type: Date, 
        required: true,
    },
    endDateTime: { 
        type: Date, 
        required: true,
    },
}, { _id: false });

export default meetingSnapshotSchema;
