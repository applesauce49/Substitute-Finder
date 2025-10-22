import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs, resolvers } from "./schemas/index.js";
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
import { Headers } from "node-fetch";

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

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
})
const serverCleanup = useServer({ schema }, wsServer);

// ✅ Create and start Apollo v5
const apolloServer = await createApolloServer(httpServer, serverCleanup);

// ✅ Add GraphQL route manually using Express JSON parser
app.use(
  "/graphql",
  bodyParser.json(),
  async (req, res) => {
    const { body, headers, status } = await apolloServer.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        body: req.body,
        headers: new Headers(req.headers),
        method: req.method,
        search: req.url.split("?")[1] || "",
      },
      context: async () => ({
        user: req.user || getUserFromReq(req),
      }),
    });

    // ✅ Apply status code if Apollo provided one
    if (status) {
      res.status(status);
    }

    // ✅ Forward Apollo's headers (ensures HTML renders properly)
    for (const [key, value] of headers) {
      res.setHeader(key, value);
    }

    // ✅ Safely read Apollo's body (supports both string and text streams)
    const responseBody = body.string
      ? body.string
      : await body.text?.();

    res.send(responseBody);
  }
);

// ✅ Start listening
const PORT = process.env.PORT || CONFIG.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http${CONFIG.USE_HTTPS ? "s" : ""}://${CONFIG.HOST}:${PORT}/graphql`);
});