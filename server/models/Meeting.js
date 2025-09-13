import { Schema, model } from 'mongoose';
import dateFormat from '../utils/dateFormat.js';

const meetingSchema = new Schema(
  {
    source: {
      type: String, 
      enum: ["google", "internal"],
      default: "google",
    },
    calendarId: String,
    gcalEventId: String,
    gcalRecurringEventId: String,
    iCalUID: String,
    etag: String,
    syncToken: String,

    // Time
    start: {dateTime: Date, timeZone: String},
    end: { dateTime: Date, timeZone: String},
    recurrence: [String],
    allDay: { type: Boolean, default: false },

    attendees: [{
      email: String,
      responseStatus: String,
      self: Boolean
    }],

    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coHost: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    firstAlternative: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    // App metadata
    title: String,
    description: String,
    labels: [String],
    extended: Schema.Types.Mixed,

    // Sub/assignment overlay (app-owned)
    substitutions: [{
      instanceStart: Date,
      role: { type: String, enum: ["host", "coHost" ], required: true },
      originalUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      substituteUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
      note: String,
      originalEmail: String,
      substituteEmail: String,
      updatedAt: {type: Date, default: Date.now }
    }],

    ownership: { type: String, enum: ["google", "app"], default: "google" },

    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: {
      getters: true,
      virtuals: true
    }
  }
);

const Meeting = model('Meeting', meetingSchema);

export default Meeting;
