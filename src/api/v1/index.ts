import { Router } from "express";
import authRoutes from "./auth/auth.routes.ts";
// import userRoutes from "./user/user.routes.ts";
// import oauthRoutes from "./oauth/oauth.routes.ts";
// import healthRoutes from "./health/health.routes.ts";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
// router.use("/oauth", oauthRoutes);
// router.use("/health", healthRoutes);

export default router;
