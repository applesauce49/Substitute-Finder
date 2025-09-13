import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/substituteFinder", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

export default db;