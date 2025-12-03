import { Schema, model } from "mongoose";

const userAttributeDefinitionSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
  userEditable: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // only applies to enum type
    default: [],
  },
  defaultValue: {
    type: Schema.Types.Mixed,
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export default model("UserAttributeDefinition", userAttributeDefinitionSchema);