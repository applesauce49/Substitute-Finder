import User from "../models/User.js";

/**
 * Bootstrap the first admin user if the database is empty
 * This function checks if there are any users in the database,
 * and if not, creates a default admin user using environment variables.
 */
export async function bootstrapAdminUser() {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      console.log(`[Bootstrap] Database already has ${userCount} user(s). Skipping bootstrap.`);
      return;
    }

    console.log("[Bootstrap] No users found in database. Creating initial admin user...");

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "admin@substitute-finder.local";
    const adminUsername = process.env.ADMIN_USERNAME || "Admin";
    const adminPhone = process.env.ADMIN_PHONE || "";

    // Create the initial admin user
    const adminUser = await User.create({
      email: adminEmail,
      username: adminUsername,
      phone: adminPhone,
      admin: true,
      about: "Initial system administrator",
    });

    console.log(`[Bootstrap] ✅ Created initial admin user: ${adminUser.email} (ID: ${adminUser._id})`);
    console.log(`[Bootstrap] Username: ${adminUser.username}`);
    console.log(`[Bootstrap] Please ensure this user can authenticate via Google OAuth.`);

  } catch (error) {
    console.error("[Bootstrap] ❌ Error creating initial admin user:", error.message);
    // Don't throw - allow server to continue starting even if bootstrap fails
  }
}
