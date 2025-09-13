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

import { typeDefs, resolvers } from "./schemas/index.js";
import db from "./config/connection.js";
// Load passport strategy after env has been configured
await import("./auth.js");
import authMiddleware from "./authMiddleware.js";

const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS so CRA dev can talk to backend
app.use(
  cors({
    origin: "http://localhost:3000",
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
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = signToken(req.user);   // 👈 cleaner
    // Use a real route so BrowserRouter mounts Login; carry token in hash
    res.redirect(`http://localhost:3000/login#token=${token}`);
    
  }
);

app.post("/logout", (req, res) => {
  req.logout(() => {
    res.clearCookie("sid");
    res.sendStatus(204);
  });
});

// Apollo server with context from passport session
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // req.user comes from passport after login
    return { user: req.user || null };
  },
});

// Production: serve React build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

// Start Apollo + Express
const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(
        `GraphQL at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

startApolloServer();
