import { Schema, model } from "mongoose";

const constraintSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },

  // user | meeting (v1: user only)
  fieldSource: {
    type: String,
    enum: ["user", "meeting"],
    default: "user",
  },

  // reference into UserAttributeDefinition.key
  fieldKey: {
    type: String,
    required: true,
  },

  operator: {
    type: String,
    enum: [
      "equals",
      "notEquals",
      "gt",
      "lt",
      "gte",
      "lte",
      "contains",
      "notContains",
      "in",
      "notIn",
      "between",
    ],
    required: true,
  },

  // the comparison value
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },

  // whether an applicant must satisfy this rule to remain eligible
  required: {
    type: Boolean,
    default: false,
  },

  active: {
    type: Boolean,
    default: true,
  },
});

export default model("Constraint", constraintSchema);
