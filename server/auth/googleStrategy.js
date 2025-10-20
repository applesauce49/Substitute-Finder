import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import { upsertUserFromGoogle, saveTokens } from "./userHelpers.js";

export default new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback",
    },

    async (revokeAccessToken, refreshToken, profile, done) => {
        try {
            const user = await upsertUserFromGoogle(profile);
            if (refreshToken) {
                await saveTokens(user._id, refreshToken, accessToken);
            }
            done(null, user);
        } catch (err) {
            done(err);
        }
    }
);
