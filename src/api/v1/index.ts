import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import healthRoutes from "./health/health.routes";
// import userRoutes from "./user/user.routes";
// import oauthRoutes from "./oauth/oauth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
// router.use("/users", userRoutes);
// router.use("/oauth", oauthRoutes);

export default router;
