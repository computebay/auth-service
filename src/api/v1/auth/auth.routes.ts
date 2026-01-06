import { Router } from "express";
import * as authController from "./auth.controller";
import { RegisterUserSchema, loginUserSchema, RefreshTokenSchema } from "../../../validators";
import { validate } from "../../../middlewares/validate";
const router = Router();

/**
 * @desc Register new user
 * @route POST /api/v1/auth/register
 * @body { email, password, name? }
 */
router.post("/register", validate(RegisterUserSchema), authController.register);

/**
 * @desc Login with email/password
 * @route POST /api/v1/auth/login
 * @body { email, password }
 */
router.post("/login", validate(loginUserSchema), authController.login)

/**
 * @desc Refresh (refresh the access token)
 * @route POST /api/v1/auth/refresh
 * @body { refreshToken }
*/
router.post("/refresh", validate(RefreshTokenSchema), authController.refresh)

/**
 * @desc Logout (invalidate refresh token)
 * @route POST /api/v1/auth/logout
 * @body { refreshToken }
 */

/**
 * @desc Forgot password (send OTP)
 * @route POST /api/v1/auth/forgot-password
 * @body { email }
 */

/**
 * @desc Verify OTP (email or phone)
 * @route POST /api/v1/auth/verify-otp
 * @body { emailOrPhone, otp, purpose }
 */

/**
 * @desc Get logged-in user (for clients)
 * @route GET /api/v1/auth/me
 * @auth Required (JWT)
 */
export default router;
