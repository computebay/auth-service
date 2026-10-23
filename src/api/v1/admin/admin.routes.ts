import { Router } from "express";
import * as adminController from "./admin.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { requireAdmin } from "../../../middlewares/admin.middleware";

const router = Router();

/**
 * @desc Platform-wide overview: machines, jobs and user counts
 * @route GET /api/v1/admin/stats
 * @auth Required (JWT) - Platform admin only
 */
router.get("/stats", authenticate, requireAdmin, adminController.getStats);

export default router;
