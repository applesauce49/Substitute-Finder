import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Must match an email address!']
    },
    phone: {
      type: String,
    },
    about: {
      type: String
    },
    meetings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Meeting'
      }
    ],
    admin: {
      type: Boolean,
      default: false
    },
    attributes: [
      {
        key: String,
        value: Schema.Types.Mixed,
      }
    ],
    profileURL: {
      type: String
    },
    assignedJobs: [
      {
        job: {
          type: Schema.Types.ObjectId,
          ref: 'Job'
        },
        assignedAt: {
          type: Date
        }
      }
    ],
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    google: {
      refreshToken: String,
      accessToken: String,
      expiryDate: Date
    },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

userSchema.virtual('jobCount').get(function () {
  return this.jobs.length;
});

userSchema.virtual('meetingCount').get(function () {
  return this.meetings.length;
});

const User = model('User', userSchema);

export default User;
