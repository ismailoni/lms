/*
  Warnings:

  - You are about to drop the `chapter_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `section_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chapter_progress" DROP CONSTRAINT "chapter_progress_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "chapter_progress" DROP CONSTRAINT "chapter_progress_sectionProgressId_fkey";

-- DropForeignKey
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "section_progress" DROP CONSTRAINT "section_progress_userCourseProgressId_fkey";

-- DropForeignKey
ALTER TABLE "sections" DROP CONSTRAINT "sections_courseId_fkey";

-- DropForeignKey
ALTER TABLE "user_course_progress" DROP CONSTRAINT "user_course_progress_courseId_fkey";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "enrollments" JSONB,
ADD COLUMN     "sections" JSONB;

-- AlterTable
ALTER TABLE "user_course_progress" ADD COLUMN     "progressData" JSONB;

-- DropTable
DROP TABLE "chapter_progress";

-- DropTable
DROP TABLE "chapters";

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "enrollments";

-- DropTable
DROP TABLE "section_progress";

-- DropTable
DROP TABLE "sections";

-- DropEnum
DROP TYPE "ChapterType";

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;
