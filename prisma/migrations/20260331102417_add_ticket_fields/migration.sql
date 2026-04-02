-- CreateEnum
CREATE TYPE "MainCategory" AS ENUM ('IT', 'ADMIN', 'HR');

-- CreateEnum
CREATE TYPE "RequestServiceType" AS ENUM ('REQUEST', 'SERVICE');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "count" TEXT,
ADD COLUMN     "itemType" TEXT,
ADD COLUMN     "mainCategory" "MainCategory",
ADD COLUMN     "requestServiceType" "RequestServiceType",
ADD COLUMN     "serviceDetails" JSONB;
