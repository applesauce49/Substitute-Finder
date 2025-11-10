import express from "express";
import passport from "../auth/index.js";
import { signToken } from "../utils/auth.js";
import OAuthToken from "../models/OAuthToken.js";

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// const BACKEND_URL = process.env.BACKEND_URL || "https://localhost:3001";
// const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback";


router.get(
    "/google",
    passport.authenticate("google", {
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
        ],
        accessType: "offline",
        // prompt: "consent",
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
    async (req, res) => {
        try {
            const refreshToken = req.authInfo?.refreshToken;

            if (refreshToken) {
                await OAuthToken.findOneAndUpdate(
                    { provider: "google-calendar", userId: req.user._id },
                    { refreshToken },
                    { upsert: true, new: true }
                );
            }

            const token = signToken(req.user);
            res.redirect(`${FRONTEND_URL}/login#token=${token}`);
        } catch (err) {
            console.error("[Auth] Error during Google callback:", err);
            res.redirect(`${FRONTEND_URL}/login#error=auth_failed`);
        }
    }
);

router.post("logout", (req, res) => {
    req.logout(() => {
        res.clearCookie("sid");
        res.sendStatus(204);
    });
});

export default router;
