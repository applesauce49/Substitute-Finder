import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function getUserFromReq(req) {
  const authHeader = req.headers?.authorization;

  if (!authHeader) {
    // Avoid noisy logs for all non-auth requests (static assets, etc.)
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.warn("[AUTH] Invalid Authorization format:", authHeader);
    return null;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    const payload = decoded?.data || decoded;

    const user = await User.findById(payload._id).lean();

    if (!user) {
      console.warn("[AUTH] No user found for ID: ", payload._id);
      return null;
    }

    return user;
  } catch (err) {
    console.error("[AUTH] Invalid token:", err.message);
    return null;
  }
}


export default function authMiddleware(req, res, next) {
  req.user = getUserFromReq(req);
  next();
}
