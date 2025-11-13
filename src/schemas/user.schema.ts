import { z } from "zod";

export const RegisterUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    phone: z.string().optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
