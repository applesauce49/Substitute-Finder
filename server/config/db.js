import mongoose from "mongoose";
import Jobs from "../models/Job.js"

export async function connectDB() {
  try {
    const conn_string = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB at ${conn_string}`);
    
    await mongoose.connect(
      conn_string
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
