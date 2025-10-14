import { google } from 'googleapis';
import OAuthToken from "../models/OAuthToken.js";

export async function getCalendarClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );

    const saved = await OAuthToken.findOne({ provider: "google-calendar" });
    if (!saved?.refreshToken) {
        throw new Error("No saved refresh token found for Google Calendar");
    }

    oauth2Client.setCredentials({
        refresh_token: saved.refreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getUserCalendarClient(userId) {
    const tokenDoc = await OAuthToken.findOne({
        userId,
        provider: "google-calendar",
    });
    if (!tokenDoc) throw new Error("No Google Calendar token on file");

    const oAuth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oAuth2.setCredentials({
        access_token: tokenDoc.accessToken,
        refresh_token: tokenDoc.refreshToken,
    });

    // Persist refreshed access tokens
    oAuth2.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            tokenDoc.accessToken = tokens.access_token;
            tokenDoc.expiryDate = new Date(Date.now() + 3500 * 1000);
            await tokenDoc.save();
        }
    });

    return google.calendar({ version: "v3", auth: oAuth2 });
}