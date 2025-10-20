import User from "../models/User.js";
import OAuthToken from "../models/OAuthToken.js";

// Helpers to create or fetch users based on Google profile
export async function upsertUserFromGoogle(profile) {
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

export async function saveTokens(userId, refreshToken, accessToken) {
    await OAuthToken.findOneAndUpdate(
        { userId, provider: "google-calendar" },
        {
            $set: {
                refreshToken,
                accessToken,
                expiryDate: new Date(Date.now() + 3500 * 1000)
            },
        },
        { upsert: true }
    );
}