import { Router } from "express";
import * as userController from "./user.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/", (req, res) => {
  res.send("user api is up");
});

/**
 * @desc Get all users
 * @route GET /api/v1/users
 */
router.get("/all", userController.listUsers);

/**
 * @desc Get user by ID
 * @route GET /api/v1/users/:userId
 */
router.get("/:userId", userController.getUser);

/**
 * @desc Update current user profile
 * @route PATCH /api/v1/users/me
 * @auth Required (JWT)
 * @body { name?, phone? }
 */
router.patch("/me", authenticate, userController.updateCurrentUser);

/**
 * @desc Delete current user account
 * @route DELETE /api/v1/users/me
 * @auth Required (JWT)
 */
router.delete("/me", authenticate, userController.deleteCurrentUser);

export default router;
