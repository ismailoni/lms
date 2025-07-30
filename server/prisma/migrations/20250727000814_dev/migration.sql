/*
  Warnings:

  - The `dateTime` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,courseId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `enrollCount` on table `teacher_earnings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `earnings` on table `teacher_earnings` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `teacher_earnings` table without a default value. This is not possible if the table is not empty.
  - Made the column `amount` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "teacher_earnings" ALTER COLUMN "enrollCount" SET NOT NULL,
ALTER COLUMN "enrollCount" SET DEFAULT 0,
ALTER COLUMN "earnings" SET NOT NULL,
ALTER COLUMN "earnings" SET DEFAULT 0,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "dateTime",
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "amount" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_userId_courseId_key" ON "transactions"("userId", "courseId");
