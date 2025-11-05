import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

if (process.env.HTTPS_PROXY) {
    const proxyUrl = process.env.HTTPS_PROXY;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    https.globalAgent = agent;
    console.log(`[Env] HTTPS_PROXY set to ${process.env.HTTPS_PROXY}`);
}
