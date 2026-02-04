import { Schema, model } from 'mongoose';

const systemSettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed, // Can store any type (string, number, boolean, object)
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'object'],
    },
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      default: 'general',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: 'defaultWorkloadBalanceWindowDays',
    value: 7,
    type: 'number',
    label: 'Default Workload Balance Window',
    description: 'Default number of days for workload balance analysis when not specified at meeting level',
    category: 'matching',
  },
];

const SystemSettings = model('SystemSettings', systemSettingsSchema);

export default SystemSettings;