import "./config/env.js";
import express from "express";
import session from "express-session";
import cors from "cors";
import fs from "fs";
import https from "https";
import path from "path";
import bodyParser from "body-parser";
import http from "http";
import { CONFIG } from "./config/env.js";
import { corsOptions } from "./config/corsOptions.js";
import { connectDB } from "./config/db.js";
import passport from "./auth/index.js";
import authMiddleware, { getUserFromReq } from "./auth/middleware.js";
import { createApolloServer } from "./graphql/server.js";
import routes from "./routes/index.js";

await connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

app.use(
  session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: CONFIG.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(authMiddleware);
app.use(routes);

// ✅ Create HTTP or HTTPS server BEFORE starting Apollo
let httpServer;
if (CONFIG.USE_HTTPS) {
  const keyPath = path.join("certs", "key.pem");
  const certPath = path.join("certs", "cert.pem");
  httpServer = https.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    app
  );
} else {
  httpServer = http.createServer(app);
}

// ✅ Create and start Apollo v5
const apolloServer = await createApolloServer(httpServer);

// ✅ Add GraphQL route manually using Express JSON parser
app.use(
  "/graphql",
  bodyParser.json(),
  async (req, res) => {
    await apolloServer.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        body: req.body,
        headers: req.headers,
        method: req.method,
        search: req.url.split("?")[1] || "",
      },
      context: async () => ({
        user: req.user || getUserFromReq(req),
      }),
    }).then(({ body }) => {
      res.setHeader("Content-Type", "application/json");
      res.send(body.string);
    });
  }
);

// ✅ Start listening
const PORT = process.env.PORT || CONFIG.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http${CONFIG.USE_HTTPS ? "s" : ""}://${CONFIG.HOST}:${PORT}/graphql`);
});