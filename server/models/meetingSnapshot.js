import { Schema, model } from "mongoose";
import dateFormat from "../utils/dateFormat.js";

const meetingSnapshotSchema = new Schema({
    eventId: { type: String, required: true  },
    calendarId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    startDateTime: { 
        type: Date, 
        required: true,
        get: timestamp => dateFormat(timestamp)
    },
    endDateTime: { 
        type: Date, 
        required: true,
        get: timestamp => dateFormat(timestamp)
    },
}, { _id: false });

export default meetingSnapshotSchema;
