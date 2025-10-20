import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("[OAuth env]",
  "ID:", !!process.env.GOOGLE_CLIENT_ID,
  "SECRET:", !!process.env.GOOGLE_CLIENT_SECRET,
  "CB:", process.env.GOOGLE_CALLBACK_URL
);

if (process.env.HTTPS_PROXY) {
    const proxyUrl = process.env.HTTPS_PROXY;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    https.globalAgent = agent;
    console.log(`[Env] HTTPS_PROXY set to ${process.env.HTTPS_PROXY}`);
}

export const CONFIG = {
    PORT: process.env.PORT || 3001,
    HOST: process.env.HOST || "localhost",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
    USE_HTTPS: process.env.USE_HTTPS === "true" || false,
    SESSION_SECRET: process.env.SESSION_SECRET || "change-me",
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "supersecretkey",
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/substituteFinder"
};
