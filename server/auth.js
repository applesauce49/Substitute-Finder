import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/User.js";

// Helpers to create or fetch users based on Google profile
async function upsertUserFromGoogle(profile) {
  const email = profile?.emails?.[0]?.value?.toLowerCase();
  const displayName = profile?.displayName || email?.split("@")[0] || "user";
  const profileURL = profile?.photos?.[0]?.value || undefined;

  if (!email) {
    throw new Error("Google profile missing email");
  }

  let user = await User.findOne({ email });
  if (user) {
    // Update basic profile fields if changed
    const next = {};
    if (!user.username) next.username = displayName;
    if (profileURL && user.profileURL !== profileURL) next.profileURL = profileURL;
    if (Object.keys(next).length) {
      user = await User.findByIdAndUpdate(user._id, { $set: next }, { new: true });
    }
    return user;
  }

  // Satisfy required password with a random string (unused for OAuth logins)
  const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  user = await User.create({
    username: displayName,
    email,
    password: randomPassword,
    profileURL,
  });
  return user;
}

async function getUserById(id) {
  return User.findById(id);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertUserFromGoogle(profile);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Basic sanity check to help diagnose env problems early
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("[GoogleAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Check server/.env and load order.");
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

/* ------------------------
   DEBUG PATCH: log full Google errors
   ------------------------ */
const googleStrategy = passport._strategies.google;
const origGetToken = googleStrategy._oauth2.getOAuthAccessToken;

googleStrategy._oauth2.getOAuthAccessToken = function (
  code,
  params,
  callback
) {
  return origGetToken.call(this, code, params, function (
    err,
    accessToken,
    refreshToken,
    results
  ) {
    if (err) {
      console.error("Google token exchange failed:");
      if (err.data) {
        try {
          console.error("Error data:", JSON.parse(err.data));
        } catch {
          console.error("Error data (raw):", err.data);
        }
      } else {
        console.error(err);
      }
    }
    callback(err, accessToken, refreshToken, results);
  });
};