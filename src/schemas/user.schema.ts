import { z } from "zod";

export const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().optional(),
    phone: z.string().optional(),
    provider: z.string().optional(),
    isEmailVerified: z.boolean().default(false),
    isPhoneVerified: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;