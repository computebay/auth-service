import { Router } from "express";
import authRoutes from "./auth/auth.routes.ts";
import healthRoutes from "./health/health.routes.ts";
// import userRoutes from "./user/user.routes.ts";
// import oauthRoutes from "./oauth/oauth.routes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
// router.use("/users", userRoutes);
// router.use("/oauth", oauthRoutes);

export default router;
