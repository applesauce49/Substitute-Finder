import "./config/env.js";
import express from "express";
import session from "express-session";
import cors from "cors";
import fs from "fs";
import https from "https";
import path from "path";
import { CONFIG } from "./config/env.js";
import { corsOptions } from "./config/corsOptions.js";
import { connectDB } from "./config/db.js";
import passport from "./auth/index.js";
import authMiddleware from "./auth/middleware.js";
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
      secure: CONFIG.NODE_ENV === "production"
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(authMiddleware);
app.use(routes);

const apolloServer = await createApolloServer();
apolloServer.applyMiddleware({ app });

if (CONFIG.USE_HTTPS) {
  const keyPath = path.join("certs", "key.pem");
  const certPath = path.join("certs", "cert.pem");
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(
      `🚀 Server running at https://${CONFIG.HOST}:${CONFIG.PORT}${apolloServer.graphqlPath}`
    );
  });
} else {
  const PORT = process.env.PORT || CONFIG.PORT || 3001;
  // const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}${apolloServer.graphqlPath}`);
  });

}
