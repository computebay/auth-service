import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client";

export const prisma = new PrismaClient();

// const addUser = async () => {
//     await prisma.user.create({
//         data: {
//             name: "Test",
//             email: "123@gmail.com",
//             provider: "oauth"
//         }
//     });
// };

// await addUser();
