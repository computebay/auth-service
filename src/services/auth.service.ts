import prisma from "../config/db";
import type { RegisterUserInput } from "../schemas/user.schema";
import type { LoginUserCredential } from "../schemas/userCredential.schema";
import logger from "../libs/logger";
import { AppError } from "../utils/error";
import { hashPassword } from "../utils/crypto";

export const registerUser = async (data: RegisterUserInput) => {
  try {
    const existsingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existsingUser) {
      logger.warn(`Attempt to register with existing email: ${data.email}`);
      throw new AppError("User already exists", 400, "USER_EXISTS");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        // password: hashedPassword,
        name: data.name,

        credentials: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });

    return user;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error("Error registering user:", error);
    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const loginUser = async (data: LoginUserCredential) => {
  //check user exists or not
};
