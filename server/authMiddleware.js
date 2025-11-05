import jwt from "jsonwebtoken";

export function getUserFromReq(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

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
    return decoded?.data || decoded; // Support tokens with { data: payload }
  } catch (err) {
    console.error("[AUTH] Invalid token:", err.message);
    return null;
  }
}

export default function authMiddleware(req, res, next) {
  const user = getUserFromReq(req);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized or expired token" });
  }

  req.user = user;
  next();
}
// export default function authMiddleware(req, res, next) {
//   req.user = getUserFromReq(req);
//   next();
// }
