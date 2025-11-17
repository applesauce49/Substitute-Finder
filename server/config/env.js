import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Determine environment
const env = process.env.NODE_ENV || "development";

console.log(`[Env] Loading environment: ${env}`);
const BASE_ENV_FILE = path.join(__dirname, "../.env");
const LOCAL_ENV_FILE = path.join(__dirname, "../.env.local");
const ENV_FILE = path.join(__dirname, `../.env.${env}`);
const ENV_LOCAL_FILE = path.join(__dirname, `../.env.${env}.local`);

dotenv.config({
    path: [
        ENV_LOCAL_FILE,
        ENV_FILE,
        LOCAL_ENV_FILE,
        BASE_ENV_FILE,
    ] },
);


if (process.env.HTTPS_PROXY) {
    const proxyUrl = process.env.HTTPS_PROXY;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    https.globalAgent = agent;
    console.log(`[Env] HTTPS_PROXY set to ${process.env.HTTPS_PROXY}`);
}
