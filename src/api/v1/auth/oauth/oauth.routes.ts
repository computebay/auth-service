import { Router } from "express";
import { startOAuth, oauthCallback } from "./oauth.controller";

const router = Router();

router.get("/:provider", startOAuth);
router.get("/:provider/callback", oauthCallback);

export default router;
