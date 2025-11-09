import { z } from "zod";

export const CreateUserCredentialSchema = z.object({
    userId: z.string().uuid(),
    passwordHash: z.string().min(8),
});

export const UpdateUserCredentialSchema = z.object({
    id: z.string().uuid(),
    passwordHash: z.string().min(8).optional(),
    lastPasswordChange: z.date().optional(),
});

export type CreateUserCredentialInput = z.infer<typeof CreateUserCredentialSchema>;
export type UpdateUserCredentialInput = z.infer<typeof UpdateUserCredentialSchema>;
