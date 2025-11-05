import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import { upsertUserFromGoogle, saveTokens } from "./userHelpers.js";

// Build the callback url dynamically
const GOOGLE_CALLBACK_URL = `${process.env.USE_HTTPS ? "https" : "http"}://${process.env.HOST}:${process.env.PORT}/auth/google/callback`;

export default new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        authorizationParams: {
            access_type: 'offline',
            // prompt: 'consent'
        }
    },

    async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await upsertUserFromGoogle(profile);
            if ( accessToken || refreshToken) {
                await saveTokens(user._id, refreshToken, accessToken);
            }
            done(null, user);
        } catch (err) {
            done(err);
        }
    }
);
