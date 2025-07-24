import fs from "fs";
import path from "path";
import db from "../utils/database";
import runMigrations from "../utils/runMigrations";
import dotenv from "dotenv";

dotenv.config();

async function createTables() {
  try {
    console.log("Running migrations to create tables...");
    await runMigrations();
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

async function seedData() {
  try {
    console.log("Seeding data...");
    
    // Read JSON data files
    const coursesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/courses.json"), "utf8")
    );
    const transactionsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/transactions.json"), "utf8")
    );
    const userCourseProgressData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/userCourseProgress.json"), "utf8")
    );

    // Clear existing data
    console.log("Clearing existing data...");
    await db.query('TRUNCATE TABLE teacher_earnings, transactions, chapter_progress, section_progress, user_course_progress, enrollments, comments, chapters, sections, courses RESTART IDENTITY CASCADE');

    // Seed courses
    console.log("Seeding courses...");
    for (const course of coursesData) {
      // Insert course
      const courseResult = await db.query(
        `INSERT INTO courses ("courseId", "teacherId", "teacherName", "teacherImage", title, description, category, image, price, level, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING "courseId"`,
        [
          course.courseId,
          course.teacherId,
          course.teacherName,
          course.teacherImage,
          course.title,
          course.description,
          course.category,
          course.image,
          course.price,
          course.level,
          course.status
        ]
      );

      const courseId = courseResult.rows[0].courseId;

      // Insert sections
      if (course.sections && course.sections.length > 0) {
        for (const section of course.sections) {
          const sectionResult = await db.query(
            `INSERT INTO sections ("sectionId", "sectionTitle", "sectionDescription", "courseId")
             VALUES ($1, $2, $3, $4)
             RETURNING "sectionId"`,
            [section.sectionId, section.sectionTitle, section.sectionDescription, courseId]
          );

          const sectionId = sectionResult.rows[0].sectionId;

          // Insert chapters
          if (section.chapters && section.chapters.length > 0) {
            for (const chapter of section.chapters) {
              const chapterResult = await db.query(
                `INSERT INTO chapters ("chapterId", type, title, content, video, "sectionId")
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING "chapterId"`,
                [chapter.chapterId, chapter.type, chapter.title, chapter.content, chapter.video, sectionId]
              );

              const chapterId = chapterResult.rows[0].chapterId;

              // Insert comments
              if (chapter.comments && chapter.comments.length > 0) {
                for (const comment of chapter.comments) {
                  await db.query(
                    `INSERT INTO comments ("commentId", "userId", text, timestamp, "chapterId")
                     VALUES ($1, $2, $3, $4, $5)`,
                    [comment.commentId, comment.userId, comment.text, comment.timestamp, chapterId]
                  );
                }
              }
            }
          }
        }
      }

      // Insert enrollments
      if (course.enrollments && course.enrollments.length > 0) {
        for (const enrollment of course.enrollments) {
          await db.query(
            `INSERT INTO enrollments ("userId", "courseId")
             VALUES ($1, $2)
             ON CONFLICT ("userId", "courseId") DO NOTHING`,
            [enrollment.userId, courseId]
          );
        }
      }
    }

    // Seed transactions
    console.log("Seeding transactions...");
    for (const transaction of transactionsData) {
      await db.query(
        `INSERT INTO transactions ("transactionId", "userId", "dateTime", "courseId", "paymentProvider", amount, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          transaction.transactionId,
          transaction.userId,
          transaction.dateTime,
          transaction.courseId,
          transaction.paymentProvider,
          transaction.amount
        ]
      );
    }

    // Seed user course progress
    console.log("Seeding user course progress...");
    for (const progress of userCourseProgressData) {
      const progressResult = await db.query(
        `INSERT INTO user_course_progress ("userId", "courseId", "enrollmentDate", "overallProgress", "lastAccessedTimestamp", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [
          progress.userId,
          progress.courseId,
          progress.enrollmentDate,
          progress.overallProgress,
          progress.lastAccessedTimestamp
        ]
      );

      const userCourseProgressId = progressResult.rows[0].id;

      // Insert section progress
      if (progress.sections && progress.sections.length > 0) {
        for (const sectionProgress of progress.sections) {
          const sectionProgressResult = await db.query(
            `INSERT INTO section_progress ("sectionId", "userCourseProgressId")
             VALUES ($1, $2)
             RETURNING id`,
            [sectionProgress.sectionId, userCourseProgressId]
          );

          const sectionProgressId = sectionProgressResult.rows[0].id;

          // Insert chapter progress
          if (sectionProgress.chapters && sectionProgress.chapters.length > 0) {
            for (const chapterProgress of sectionProgress.chapters) {
              await db.query(
                `INSERT INTO chapter_progress ("chapterId", completed, "sectionProgressId")
                 VALUES ($1, $2, $3)`,
                [chapterProgress.chapterId, chapterProgress.completed, sectionProgressId]
              );
            }
          }
        }
      }
    }

    console.log("Data seeded successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

export default async function seedPostgreSQL() {
  try {
    await createTables();
    await seedData();
    console.log("PostgreSQL database setup completed successfully");
  } catch (error) {
    console.error("Failed to setup PostgreSQL database:", error);
    throw error;
  }
}

// Run if called directly
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