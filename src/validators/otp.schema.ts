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

export type CreateOTPInput = z.infer<typeof CreateOTPSchema>;
export type UpdateOTPInput = z.infer<typeof UpdateOTPSchema>;
