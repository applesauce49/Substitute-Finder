import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader) {
    // Avoid noisy logs for all non-auth requests (static assets, etc.)
    req.user = null;
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.warn("[AUTH] Invalid Authorization format:", authHeader);
    req.user = null;
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    const data = decoded?.data || decoded; // Support tokens with { data: payload }
    req.user = data;
  } catch (err) {
    console.error("[AUTH] Invalid token:", err.message);
    req.user = null;
  }

  return next();
}
