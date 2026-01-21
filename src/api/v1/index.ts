import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import healthRoutes from "./health/health.routes";
import userRoutes from "./user/user.routes";
import orgRoutes from "./org/org.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/users", userRoutes);
router.use("/orgs", orgRoutes);

export default router;
