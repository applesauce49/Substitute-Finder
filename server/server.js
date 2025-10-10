// Load env from server/.env explicitly so local vars are available
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
import express from "express";
import { ApolloServer } from "apollo-server-express";
import session from "express-session";
import passport from "passport";
import cors from "cors";

import { signToken } from "./utils/auth.js";
import { syncCalendar } from "./services/calendarSync.js"

import { typeDefs, resolvers } from "./schemas/index.js";
// import db from "./config/connection.js";
import { connectDB } from "./config/connection.js";
// Load passport strategy after env has been configured
await import("./auth.js");
import authMiddleware, { getUserFromReq } from "./authMiddleware.js";

const db = await connectDB();
const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS so CRA dev can talk to backend
app.use(
  cors({
    origin: "http://127.0.1:3000",
    credentials: true,
  })
);


// Session + Passport
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(authMiddleware);

// Auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    accessType: "offline",
    prompt: "consent"
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const refreshToken = req.authInfo?.refreshToken;

      if (refreshToken) {
        await OAuthToken.findOneAndUpdate(
          { provider: "google-calendar", userId: req.user._id },
          { refreshToken },
          { upsert: true, new: true }
        );
      }

      // 👇 Run the calendar sync for this user
      await syncCalendar(req.user._id, "primary");
      console.log(`[Auth] Synced meetings for user ${req.user.email}`);
    } catch (err) {
      console.error("[Auth] Error during Google callback:", err);
    }

    const token = signToken(req.user);
    const redirectBase = process.env.CLIENT_URL || "http://127.0.0.1:3000";
    res.redirect(`${redirectBase}/login#token=${token}`);
  }
);

app.post("/logout", (req, res) => {
  req.logout(() => {
    res.clearCookie("sid");
    res.sendStatus(204);
  });
});

let server;

try {
  await connectDB();

  // Apollo server with context from passport session
  server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Case 1: Passport session user
      if (req.user) return { user: req.user };

      // Case 2: Decode JWT manually
      return { user: getUserFromReq(req) };
    },
    introspection: true,
    playground: true, 
  });
} catch (err) {
  console.error("Error while building GraphQL Schema:", err.message);
  console.error(err.stack);
  process.exit(1);
}

// Production: serve React build
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../client/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../client/build/index.html"));
//   });
// }

// Start Apollo + Express
const startApolloServer = async () => {

  await server.start();
  server.applyMiddleware({ app });


  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(
      `GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`
    );
  });
};

startApolloServer();
