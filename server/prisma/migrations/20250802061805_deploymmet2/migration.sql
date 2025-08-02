/*
  Warnings:

  - You are about to drop the column `sections` on the `courses` table. All the data in the column will be lost.
  - The `level` column on the `courses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `courses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `price` on table `courses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "sections",
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0,
DROP COLUMN "level",
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'Beginner',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft',
ALTER COLUMN "enrollments" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "sections" (
    "sectionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sectionDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "chapters" (
    "chapterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Text',
    "video" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("chapterId")
);

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("sectionId") ON DELETE CASCADE ON UPDATE CASCADE;
