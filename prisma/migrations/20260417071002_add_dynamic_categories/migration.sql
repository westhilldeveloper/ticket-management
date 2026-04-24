/*
  Warnings:

  - You are about to drop the column `mainCategory` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "mainCategory",
ADD COLUMN     "mainCategoryId" TEXT;

-- DropEnum
DROP TYPE "MainCategory";

-- CreateTable
CREATE TABLE "dynamic_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_categories_name_key" ON "dynamic_categories"("name");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "dynamic_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
