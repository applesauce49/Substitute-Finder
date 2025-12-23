import { Schema, model } from 'mongoose';
import ConstraintGroup from '../matchEngine/Schemas/ConstraintGroup.js'

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
    summary: String,
    description: String,
    start: Date,
    end: Date,
    timezone: String,

    owner: String,

    recurrence: {
      frequency: { type: String },        // e.g. "WEEKLY"
      daysOfWeek: [{ type: String }],     // ["MO", "WE"]
      startTime: { type: String },        // "19:00"
      endTime: { type: String },          // "20:00"
      until: { type: Date },              // recurrence end date (optional)
      timezone: { type: String },         // "America/New_York"
    },

    constraintGroupIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ConstraintGroup',
        default: [],
      }
    ],

    roles: {
      primary: { type: Schema.Types.ObjectId, ref: 'User' },
      secondary: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },

    createdAt: Date,
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

meetingSchema.index(
  { gcalEventId: 1, calendarId: 1 },
  { unique: true, sparse: true }
)

const Meeting = model('Meeting', meetingSchema);

export default Meeting;