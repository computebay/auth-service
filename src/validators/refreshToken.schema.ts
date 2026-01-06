import { z } from "zod";

export const CreateRefreshTokenSchema = z.object({
  userId: z.string().uuid(),
  tokenHash: z.string(),
  revoked: z.boolean().default(false),
  replacedBy: z.string().uuid().optional(),
  expiresAt: z.date(),
});

export const UpdateRefreshTokenSchema = z.object({
  id: z.string().uuid(),
  revoked: z.boolean().optional(),
  replacedBy: z.string().uuid().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
})

export type CreateRefreshTokenInput = z.infer<typeof CreateRefreshTokenSchema>;
export type UpdateRefreshTokenInput = z.infer<typeof UpdateRefreshTokenSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>