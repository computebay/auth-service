-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "auth"."User" ADD COLUMN "role" "auth"."UserRole" NOT NULL DEFAULT 'USER';
