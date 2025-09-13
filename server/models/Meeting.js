import { Schema, model } from 'mongoose';
import dateFormat from '../utils/dateFormat.js';

const meetingSchema = new Schema(
  {
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    startDateTime: {
        type: Date,
        required: true
    },
    repeat: {
        type: String,
        enum: ['None', 'Daily', 'Weekly', 'Monthly'],
        default: 'None'
    },
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
    }
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
