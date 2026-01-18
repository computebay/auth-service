import { z } from "zod";

export const CreateOTPSchema = z.object({
  userId: z.string().uuid(),
  codeHash: z.string(),
  type: z.string(),
  expiresAt: z.date(),
});

export const UpdateOTPSchema = z.object({
  id: z.string().uuid(),
  attempts: z.number().optional(),
  consumed: z.boolean().optional(),
  used: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const VerifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(6),
  type: z.enum(["EMAIL_VERIFICATION", "PHONE_VERIFICATION"]),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(6),
  newPassword:z.string(),
});

export type CreateOTPInput = z.infer<typeof CreateOTPSchema>;
export type UpdateOTPInput = z.infer<typeof UpdateOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
