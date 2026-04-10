import express from "express";
import { runMatchEngineConfigurable, getEligibleJobsForMatchEngine } from "../matchEngine/matchEngine.js";
import { acquireMatchEngineRunLock, releaseMatchEngineRunLock } from "../services/systemSettingsService.js";
import { schedulerAuth } from "../auth/schedulerAuth.js";

const router = express.Router();

router.use(schedulerAuth);

router.get("/eligible-jobs", async (_req, res) => {
  try {
    const jobs = await getEligibleJobsForMatchEngine();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("[Scheduler] Failed to fetch eligible jobs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch eligible jobs.",
    });
  }
});

router.post("/run-match-engine", async (req, res) => {
  const startedAt = new Date();
  const body = req.body || {};
  const { jobIds = null } = body;
  const dryRun = body.dryRun === true;

  if (jobIds !== null && !Array.isArray(jobIds)) {
    return res.status(400).json({
      success: false,
      error: "jobIds must be an array of IDs or null.",
    });
  }

  let runId = null;

  try {
    if (!dryRun) {
      const lockResult = await acquireMatchEngineRunLock({
        owner: `scheduler:${req.ip || "unknown"}`,
      });

      if (!lockResult.acquired) {
        return res.status(423).json({
          success: false,
          error: "Match engine run already in progress.",
          lock: lockResult.lock,
        });
      }

      runId = lockResult.runId;
    }

    const result = await runMatchEngineConfigurable(jobIds, dryRun);
    const finishedAt = new Date();

    return res.status(200).json({
      success: true,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      runId,
      result,
    });
  } catch (error) {
    const finishedAt = new Date();
    console.error("[Scheduler] Match engine run failed:", error);

    return res.status(500).json({
      success: false,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      runId,
      error: error?.message || "Match engine execution failed.",
    });
  } finally {
    if (runId) {
      await releaseMatchEngineRunLock(runId);
    }
  }
});

export default router;
