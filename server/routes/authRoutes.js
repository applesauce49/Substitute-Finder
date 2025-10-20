import express from "express";
import passport from "../auth/index.js";
import { signToken } from "../utils/auth.js";
import OAuthToken from "../models/OAuthToken.js";

const router = express.Router();

router.get(
    "/google",
    passport.authenticate("google", {
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
        ],
        accessType: "offline",
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
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
            const redirectBase = 
                process.env.CLIENT_URL;
            res.redirect(`${redirectBase}/login#token=${token}`);
        } catch (err) {
            console.error("[Auth] Error during Google callback:", err);
            res.redirect("/login#error=auth_failed");
        }
    }
);

router.post("/logout", (req, res) => {
    req.logout(() => {
        res.clearCookie("sid");
        res.sendStatus(204);
    });
});

export default router;
