import mongoose from "mongoose";

const OAuthTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    accessToken: String,
    refreshToken: {
      type: String,
      required: true,
    },
    expiryDate: Date,
  },
  { timestamps: true }
);

// Prevent duplicate provider tokens for the same user
OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.model("OAuthToken", OAuthTokenSchema);