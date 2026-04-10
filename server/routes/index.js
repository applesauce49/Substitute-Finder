import express from "express";
import authRoutes from "./authRoutes.js";
import schedulerRoutes from "./schedulerRoutes.js";

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/api/scheduler", schedulerRoutes);

export default router;