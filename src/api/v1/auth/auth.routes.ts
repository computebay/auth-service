import { Router } from "express";
import * as authController from "./auth.controller";
import {
    RegisterUserSchema,
    loginUserSchema,
    RefreshTokenSchema,
    ForgotPasswordSchema,
    VerifyOTPSchema,
} from "../../../validators";
import { validate } from "../../../middlewares/validate";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/", (req, res) => {
    res.send("auth api is up")

})
/**
 * @desc Register new user
 * @route POST /api/v1/auth/register
 * @body { email, password, name? }
 * 
 */
router.post("/register", validate(RegisterUserSchema), authController.register);

/**
 * @desc Login with email/password
 * @route POST /api/v1/auth/login
 * @body { email, password }
 */
router.post("/login", validate(loginUserSchema), authController.login);

/**
 * @desc Refresh (refresh the access token)
 * @route POST /api/v1/auth/refresh
 * @body { refreshToken }
 */
router.post("/refresh", validate(RefreshTokenSchema), authController.refresh);

/**
 * @desc Logout (invalidate refresh token)
 * @route POST /api/v1/auth/logout
 * @body { refreshToken }
*/
router.post("/logout", validate(RefreshTokenSchema), authController.logout);

/**
 * @desc Forgot password (send OTP)
 * @route POST /api/v1/auth/forgot-password
 * @body { email }
 */
router.post("/forgot-password", validate(ForgotPasswordSchema), authController.handleForgotPassword);

/**
 * @desc Verify OTP (email or phone)
 * @route POST /api/v1/auth/verify-otp
 * @body { email, code, type }
 */
router.post("/verify-otp", validate(VerifyOTPSchema), authController.handleVerifyOTP);

/**
 * @desc Get logged-in user (for clients)
 * @route GET /api/v1/auth/me
 * @auth Required (JWT)
 */
router.get('/me', authenticate, authController.getUser)
export default router;
