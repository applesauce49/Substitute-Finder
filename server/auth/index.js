import passport from "passport";
import googleStrategy from "./googleStrategy.js";
import User from "../models/User.js";

console.log("[OAuth env]",
  "ID:", !!process.env.GOOGLE_CLIENT_ID,
  "SECRET:", !!process.env.GOOGLE_CLIENT_SECRET,
  "CB:", process.env.GOOGLE_CALLBACK_URL
);

passport.use(googleStrategy);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error(
    "[GoogleAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Check server/.env and load order."
  );
}

export default passport;
