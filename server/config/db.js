import mongoose from "mongoose";
import Jobs from "../models/Job.js"

export async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/substituteFinder"
    );
    console.log("MongoDB connected");

    await Jobs.syncIndexes();
    console.log("Jobs indexes synced");
  }
  catch (err) {
    console.error("Error connecting to MongoDB or syncing indexes:", err);
    process.exit(1);
  }
}
