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
    const saved = await OAuthToken.findOne({ provider: "google-calendar", userId });

    if (!saved?.refreshToken) {
        throw new Error("No refresh token found for this user");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({ refresh_token: saved.refreshToken });
    return google.calendar({ version: "v3", auth: oauth2Client });
}