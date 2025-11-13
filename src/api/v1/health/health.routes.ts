import { Router } from "express";
import * as healthController from "./health.controller";

const router = Router();

router.get("/", healthController.healthCheck);
export default router;
