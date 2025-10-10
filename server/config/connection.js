import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";

export async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/substituteFinder"
    );
    console.log("MongoDB connected");

    await Meeting.syncIndexes();
    console.log("Meeting indexes synced");
  }
  catch (err) {
    console.error("Error connecting to MongoDB or syncing indexes:", err);
    process.exit(1);
  }
}
// mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/substituteFinder", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;

// db.once("open", async () => {
//   console.log("MongoDB connected");

//   try {
//     await Meeting.syncIndexes();   // 👈 makes sure schema indexes match DB
//     console.log("Meeting indexes synced");
//   } catch (err) {
//     console.error("Error syncing Meeting indexes:", err);
//   }
// });

// export default db;