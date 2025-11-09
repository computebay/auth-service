import { z } from "zod";

export const CreateOAuthAccountSchema = z.object({
    userId: z.string().uuid(),
    provider: z.string(),
    providerAccountId: z.string(),
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.date().optional(),
});

export const UpdateOAuthAccountSchema = z.object({
    id: z.string().uuid(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresAt: z.date().optional(),
});

export type CreateOAuthAccountInput = z.infer<typeof CreateOAuthAccountSchema>;
export type UpdateOAuthAccountInput = z.infer<typeof UpdateOAuthAccountSchema>;
