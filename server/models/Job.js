import { Schema, model } from 'mongoose';
import meetingSnapshotSchema from './meetingSnapshot.js';

const jobSchema = new Schema(
  {
    active: {
      type: Boolean,
      required: true
    },
    meetingSnapshot: {
      type: meetingSnapshotSchema,
      required: true,
    },
    description: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        appliedAt: {
          type: Date, 
          default: Date.now ,
        }
      }
    ],
    assignedTo: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      default: null
    },
    firstNotificationSent: {
      type: Boolean,
      default: false
    },
    secondNotificationSent: {
      type: Boolean,
      default: false
    }
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
