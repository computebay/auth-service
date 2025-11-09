import prisma from "../config/db";
import type { CreateUserInput } from "../schemas/user.schema";
import logger from "../libs/logger";

export const registerUser = async (data: CreateUserInput) => {
    try {
        const user = await prisma.user.create({
            data
        });
        logger.info({ email: data.email }, "✅ User registered:");
        return user;
    } catch (error: any) {
        logger.error("Error registering user:", error);
        throw error;

    }
};
