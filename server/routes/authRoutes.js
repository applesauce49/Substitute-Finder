import express from "express";
import passport from "../auth/index.js";
import { signToken } from "../utils/auth.js";
import OAuthToken from "../models/OAuthToken.js";

const router = express.Router();
const redirectBase = process.env.CLIENT_URL;

console.log(`redirectBase URL is ${redirectBase}`)

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
    passport.authenticate("google", { failureRedirect: `${redirectBase}login` }),
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
            res.redirect(`${redirectBase}login#token=${token}`);
        } catch (err) {
            console.error("[Auth] Error during Google callback:", err);
            res.redirect(`${redirectBase}login#error=auth_failed`);
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
