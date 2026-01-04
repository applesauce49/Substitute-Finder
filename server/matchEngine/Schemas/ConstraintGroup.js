import { Schema, model } from "mongoose";

const constraintGroupSchema = new Schema({
  name: { type: String, required: true },

  constraintIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Constraint",
    },
  ],
});

export default model("ConstraintGroup", constraintGroupSchema);