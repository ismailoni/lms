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

// Enhanced safe array function with better validation
function safeArray(value: any): any[] | null {
  console.log(`    Validating array data:`, typeof value, Array.isArray(value));
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    console.log(`    -> Returning null for null/undefined`);
    return null;
  }
  
  // Handle proper arrays
  if (Array.isArray(value)) {
    console.log(`    -> Valid array with ${value.length} items`);
    return value.length > 0 ? value : null;
  }
  
  // Handle strings that might be JSON
  if (typeof value === 'string') {
    if (value.trim() === '' || value === 'null' || value === 'undefined') {
      console.log(`    -> Empty/null string, returning null`);
      return null;
    }
    
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        console.log(`    -> Parsed JSON array with ${parsed.length} items`);
        return parsed.length > 0 ? parsed : null;
      } else {
        console.log(`    -> Parsed JSON is not an array, returning null`);
        return null;
      }
    } catch (error) {
      console.log(`    -> Failed to parse JSON string, returning null`);
      return null;
    }
  }
  
  // Handle objects that might be arrays
  if (typeof value === 'object') {
    // Check if it's an array-like object
    if (value.hasOwnProperty('length') && typeof value.length === 'number') {
      try {
        const arrayValue = Array.from(value);
        console.log(`    -> Converted array-like object to array with ${arrayValue.length} items`);
        return arrayValue.length > 0 ? arrayValue : null;
      } catch (error) {
        console.log(`    -> Failed to convert array-like object, returning null`);
        return null;
      }
    }
  }
  
  console.log(`    -> Unhandled type, returning null`);
  return null;
}

async function seedData() {
  console.log("Seeding basic data...");

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
      "user_course_progress", 
      "courses"
    RESTART IDENTITY CASCADE;
  `);

  // Insert Courses with enhanced validation
  console.log("Inserting courses...");
  for (let i = 0; i < coursesRaw.length; i++) {
    const course = coursesRaw[i];
    
    try {
      console.log(`\nProcessing course ${i + 1}: ${course.title || 'No title'}`);
      
      // Log raw data for debugging
      console.log(`  Raw sections:`, course.sections);
      console.log(`  Raw enrollments:`, course.enrollments);
      
      // Safely parse sections and enrollments
      const sections = safeArray(course.sections);
      const enrollments = safeArray(course.enrollments);
      
      console.log(`  - Final Sections: ${sections ? sections.length : 0} items`);
      console.log(`  - Final Enrollments: ${enrollments ? enrollments.length : 0} items`);

      // Create course data with explicit null handling
      const courseData = {
        courseId: course.courseId,
        teacherId: course.teacherId ?? course.teacher_id,
        teacherName: course.teacherName ?? course.teacher_name,
        teacherImage: course.teacherImage ?? course.teacher_image ?? null,
        title: course.title,
        description: course.description ?? null,
        category: course.category,
        image: course.image ?? null,
        price: course.price ?? null,
        level: course.level,
        status: course.status,
        sections: sections ?? Prisma.JsonNull,
        enrollments: enrollments ?? Prisma.JsonNull,
      };

      console.log(`  Creating course with data:`, {
        ...courseData,
        sections: sections ? `Array(${sections.length})` : 'null',
        enrollments: enrollments ? `Array(${enrollments.length})` : 'null'
      });

      await prisma.course.create({
        data: courseData,
      });
      
      console.log(`  ✅ Course ${i + 1} inserted successfully`);
    } catch (error) {
      console.error(`❌ Error inserting course ${i + 1}:`, error);
      console.log("Full course data:", JSON.stringify(course, null, 2));
      
      // Try inserting with completely null sections and enrollments
      console.log("Attempting to insert with null sections and enrollments...");
      try {
        await prisma.course.create({
          data: {
            courseId: course.courseId || `course-${i}`,
            teacherId: course.teacherId ?? course.teacher_id ?? `teacher-${i}`,
            teacherName: course.teacherName ?? course.teacher_name ?? `Teacher ${i}`,
            teacherImage: null,
            title: course.title || `Course ${i}`,
            description: course.description ?? null,
            category: course.category || "General",
            image: null,
            price: course.price ?? null,
            level: "Beginner" as CourseLevel,
            status: "Published" as CourseStatus,
            sections: Prisma.JsonNull,
            enrollments: Prisma.JsonNull,
          },
        });
        console.log(`  ✅ Course ${i + 1} inserted with fallback data`);
      } catch (fallbackError) {
        console.error(`❌ Fallback insertion also failed for course ${i + 1}:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  // Insert Transactions and update enrollments
  console.log("Inserting transactions...");
  if (transactionsRaw.length) {
    for (const transaction of transactionsRaw) {
      try {
        // Create transaction
        await prisma.transaction.create({
          data: {
            userId: transaction.userId ?? transaction.user_id,
            dateTime: transaction.dateTime ?? transaction.date_time,
            courseId: transaction.courseId ?? transaction.course_id,
            paymentProvider: (transaction.paymentProvider ?? "stripe") as PaymentProvider,
            amount: transaction.amount ?? 0,
          },
        });

        // Add user to course enrollments
        const courseId = transaction.courseId ?? transaction.course_id;
        const userId = transaction.userId ?? transaction.user_id;

        const course = await prisma.course.findUnique({
          where: { courseId },
        });

        if (course) {
          const currentEnrollments = safeArray(course.enrollments) || [];
          if (!currentEnrollments.includes(userId)) {
            currentEnrollments.push(userId);
            await prisma.course.update({
              where: { courseId },
              data: { enrollments: currentEnrollments },
            });
          }
        }
      } catch (error) {
        console.error("Error processing transaction:", error);
        console.log("Transaction data:", JSON.stringify(transaction, null, 2));
        // Don't throw here, continue with other transactions
      }
    }
  }

  // Generate teacher earnings
  console.log("Generating teacher earnings...");
  const transactions = await prisma.transaction.findMany({
    include: { course: true },
  });

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
    earnings.earnings += (transaction.amount || 0) * 0.7;
  }

  for (const [key, earningsData] of earningsMap) {
    try {
      await prisma.teacherEarnings.create({
        data: {
          teacherId: earningsData.teacherId,
          courseId: earningsData.courseId,
          title: earningsData.title,
          enrollCount: earningsData.enrollCount,
          earnings: +earningsData.earnings.toFixed(2),
        },
      });
    } catch (error) {
      console.error("Error creating teacher earnings:", error);
    }
  }

  // Insert UserCourseProgress
  console.log("Inserting user course progress...");
  for (const ucp of userCourseProgressRaw) {
    try {
      const progressData =
        ucp.progressData && Object.keys(ucp.progressData).length > 0
          ? ucp.progressData
          : { sections: [] };

      await prisma.userCourseProgress.create({
        data: {
          userId: ucp.userId ?? ucp.user_id,
          courseId: ucp.courseId ?? ucp.course_id,
          enrollmentDate: ucp.enrollmentDate ?? ucp.enrollment_date,
          overallProgress: ucp.overallProgress ?? ucp.overall_progress,
          lastAccessedTimestamp:
            ucp.lastAccessedTimestamp ?? ucp.last_accessed_timestamp,
          progressData: progressData,
        },
      });
    } catch (error) {
      console.error("Error inserting user course progress:", error);
      console.log("Progress data:", JSON.stringify(ucp, null, 2));
      // Don't throw here, continue with other progress records
    }
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
