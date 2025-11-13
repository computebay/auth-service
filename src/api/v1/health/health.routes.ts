import { Router } from 'express';
import * as healthController from './health.controller.ts';

const router = Router();


router.get('/', healthController.healthCheck);
export default router;