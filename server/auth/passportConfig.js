import passport from "passport";
import googleStrategy from "./googleStrategy";
import User from "../models/User.js";

passport.use(googleStrategy);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try { done(null, await User.findById(id)); } catch (err) { done(err); }
});

export default passport;
