import crypto from "crypto";

function timingSafeEqual(a, b) {
  const aBuffer = Buffer.from(a || "", "utf8");
  const bBuffer = Buffer.from(b || "", "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function schedulerAuth(req, res, next) {
  const configuredKey = process.env.SCHEDULER_API_KEY;

  if (!configuredKey) {
    console.error("[SchedulerAuth] SCHEDULER_API_KEY is not configured.");
    return res.status(500).json({
      success: false,
      error: "Scheduler authentication is not configured.",
    });
  }

  const requestKey = req.get("x-scheduler-key") || "";

  if (!timingSafeEqual(requestKey, configuredKey)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized scheduler request.",
    });
  }

  return next();
}
