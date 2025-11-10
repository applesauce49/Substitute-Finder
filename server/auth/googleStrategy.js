import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import { upsertUserFromGoogle, saveTokens } from "./userHelpers.js";

// server config
const publicBase = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const port = process.env.PORT || 3001;

const GOOGLE_CALLBACK_URL = publicBase
  ? `${publicBase}/auth/google/callback`            // prod: no port
  : `https://localhost:${port}/auth/google/callback`; // dev: localhost ok

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
