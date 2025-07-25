process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import {
  PrismaClient,
  CourseLevel,
  CourseStatus,
  PaymentProvider,
  Prisma,
} from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
console.log(
  "Loaded DATABASE_URL:",
  process.env.DATABASE_URL || "❌ Not found!"
);

const prisma = new PrismaClient();

const dataPath = (...p: string[]) => path.join(__dirname, "data", ...p);
const readJSON = <T = any>(p: string): T =>
  JSON.parse(fs.readFileSync(p, "utf8"));

async function seedData() {
  console.log("Seeding full data hierarchy...");

  const coursesRaw = readJSON<any[]>(dataPath("courses.json"));
  const transactionsRaw = readJSON<any[]>(dataPath("transactions.json"));
  const userCourseProgressRaw = readJSON<any[]>(
    dataPath("userCourseProgress.json")
  );

  console.log("Clearing existing data...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "teacher_earnings", 
      "transactions", 
      "chapter_progress", 
      "section_progress", 
      "user_course_progress", 
      "enrollments", 
      "comments", 
      "chapters", 
      "sections", 
      "courses"
    RESTART IDENTITY CASCADE;
  `);

  const pendingComments: Prisma.CommentCreateManyInput[] = [];
  const pendingChapterProgress: Prisma.ChapterProgressCreateManyInput[] = [];

  // --- Insert Courses → Sections → Chapters ---
  console.log("Inserting courses, sections, chapters...");
  for (const course of coursesRaw) {
    const createdCourse = await prisma.course.create({
      data: {
        courseId: course.courseId, // Preserve the original courseId
        teacherId: course.teacherId ?? course.teacher_id,
        teacherName: course.teacherName ?? course.teacher_name,
        teacherImage: course.teacherImage ?? course.teacher_image ?? null,
        title: course.title,
        description: course.description ?? null,
        category: course.category,
        image: course.image ?? null,
        price: course.price ?? null,
        level: (course.level ?? "Beginner") as CourseLevel,
        status: (course.status ?? "Published") as CourseStatus,
      },
    });

    if (course.enrollments && course.enrollments.length > 0) {
      for (const enrollment of course.enrollments) {
        await prisma.enrollment.create({
          data: {
            userId: enrollment.userId,
            courseId: course.courseId, // Use the original courseId
          },
        });
      }
    }

    if (Array.isArray(course.sections)) {
      for (const sec of course.sections) {
        const createdSection = await prisma.section.create({
          data: {
            // Remove sectionId to let Prisma auto-generate unique IDs
            sectionTitle: sec.sectionTitle ?? sec.title,
            sectionDescription:
              sec.sectionDescription ?? sec.description ?? null,
            courseId: createdCourse.courseId,
          },
        });

        if (Array.isArray(sec.chapters)) {
          for (const ch of sec.chapters) {
            const createdChapter = await prisma.chapter.create({
              data: {
                // Remove chapterId to let Prisma auto-generate unique IDs
                type: ch.type ?? "Text",
                title: ch.title,
                content: ch.content,
                video: ch.video ?? null,
                sectionId: createdSection.sectionId,
              },
            });

            if (Array.isArray(ch.comments)) {
              for (const c of ch.comments) {
                pendingComments.push({
                  userId: c.userId ?? c.user_id,
                  text: c.text,
                  timestamp: c.timestamp,
                  chapterId: createdChapter.chapterId,
                });
              }
            }
          }
        }
      }
    }
  }

  // --- Insert Transactions ---
  console.log("Inserting transactions...");
  if (transactionsRaw.length) {
    await prisma.transaction.createMany({
      data: transactionsRaw.map((t) => ({
        userId: t.userId ?? t.user_id,
        dateTime: t.dateTime ?? t.date_time,
        courseId: t.courseId ?? t.course_id,
        paymentProvider: (t.paymentProvider ?? "stripe") as PaymentProvider,
        amount: t.amount ?? null,
      })),
      skipDuplicates: true,
    });
  }

  console.log("Generating teacher earnings...");
  // Calculate and insert teacher earnings based on transactions
  const transactions = await prisma.transaction.findMany({
    include: {
      course: true,
    },
  });

  // Group transactions by teacher and course
  const earningsMap = new Map();

  for (const transaction of transactions) {
    const key = `${transaction.course.teacherId}-${transaction.courseId}`;

    if (!earningsMap.has(key)) {
      earningsMap.set(key, {
        teacherId: transaction.course.teacherId,
        courseId: transaction.courseId,
        title: transaction.course.title,
        enrollCount: 0,
        earnings: 0,
      });
    }

    const earnings = earningsMap.get(key);
    earnings.enrollCount += 1;
    earnings.earnings += (transaction.amount || 0) * 0.7; // Assuming 70% commission to teacher
  }

  // Insert teacher earnings
  for (const [key, earningsData] of earningsMap) {
    await prisma.teacherEarnings.create({
      data: {
        teacherId: earningsData.teacherId,
        courseId: earningsData.courseId,
        title: earningsData.title,
        enrollCount: earningsData.enrollCount,
        earnings: Math.round(earningsData.earnings), // Round to nearest cent
      },
    });
  }

  console.log("Teacher earnings generated successfully!");

  // --- Insert UserCourseProgress → SectionProgress (collect ChapterProgress) ---
  console.log("Inserting user course progress...");
  for (const ucp of userCourseProgressRaw) {
    const createdUCP = await prisma.userCourseProgress.create({
      data: {
        userId: ucp.userId ?? ucp.user_id,
        courseId: ucp.courseId ?? ucp.course_id,
        enrollmentDate: ucp.enrollmentDate ?? ucp.enrollment_date,
        overallProgress: ucp.overallProgress ?? ucp.overall_progress,
        lastAccessedTimestamp:
          ucp.lastAccessedTimestamp ?? ucp.last_accessed_timestamp,
      },
    });

    if (Array.isArray(ucp.sectionProgress)) {
      for (const sp of ucp.sectionProgress) {
        const createdSP = await prisma.sectionProgress.create({
          data: {
            sectionId: sp.sectionId ?? sp.section_id,
            userCourseProgressId: createdUCP.id,
          },
        });

        if (Array.isArray(sp.chapterProgress)) {
          for (const cp of sp.chapterProgress) {
            pendingChapterProgress.push({
              chapterId: cp.chapterId ?? cp.chapter_id,
              completed: !!cp.completed,
              sectionProgressId: createdSP.id,
            });
          }
        }
      }
    }
  }

  // --- Bulk Inserts ---
  console.log(
    `Bulk inserting ${pendingComments.length} comments and ${pendingChapterProgress.length} chapter progress entries...`
  );

  if (pendingComments.length) {
    await prisma.comment.createMany({ data: pendingComments });
  }

  if (pendingChapterProgress.length) {
    await prisma.chapterProgress.createMany({ data: pendingChapterProgress });
  }

  console.log("Data seeded successfully!");
}

export default async function seedPostgreSQL() {
  try {
    await seedData();
    console.log("PostgreSQL database setup completed successfully");
  } catch (error) {
    console.error("Failed to setup PostgreSQL database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPostgreSQL()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
