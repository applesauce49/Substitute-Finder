import { Schema, model } from 'mongoose';
import dateFormat from '../utils/dateFormat.js';

const jobSchema = new Schema(
  {
    active: {
      type: Boolean,
      required: true
    },
    description: {
      type: String,
      required: 'You need to leave a job!',
      maxlength: 280
    },
    dates: {
      type: String,
      required: true
    },
    meeting: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: timestamp => dateFormat(timestamp)
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        appliedAt: {type: Date, default: Date.now }
      }
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User"}
  },
  {
    toJSON: {
      getters: true,
      virtuals: true
    }
  }
);

jobSchema.virtual('applicationCount').get(function() {
  return this.applications?.length || 0;
});

const Job = model('Job', jobSchema);

export default Job;
