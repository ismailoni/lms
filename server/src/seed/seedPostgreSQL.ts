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
import { v4 as uuidv4 } from "uuid";

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
function safeArray(value: any): any[] {
  console.log(`    Validating array data:`, typeof value, Array.isArray(value));
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    console.log(`    -> Returning empty array for null/undefined`);
    return [];
  }
  
  // Handle proper arrays
  if (Array.isArray(value)) {
    console.log(`    -> Valid array with ${value.length} items`);
    return value;
  }
  
  // Handle strings that might be JSON
  if (typeof value === 'string') {
    if (value.trim() === '' || value === 'null' || value === 'undefined') {
      console.log(`    -> Empty/null string, returning empty array`);
      return [];
    }
    
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        console.log(`    -> Parsed JSON array with ${parsed.length} items`);
        return parsed;
      } else {
        console.log(`    -> Parsed JSON is not an array, returning empty array`);
        return [];
      }
    } catch (error) {
      console.log(`    -> Failed to parse JSON string, returning empty array`);
      return [];
    }
  }
  
  // Handle objects that might be arrays
  if (typeof value === 'object') {
    // Check if it's an array-like object
    if (value.hasOwnProperty('length') && typeof value.length === 'number') {
      try {
        const arrayValue = Array.from(value);
        console.log(`    -> Converted array-like object to array with ${arrayValue.length} items`);
        return arrayValue;
      } catch (error) {
        console.log(`    -> Failed to convert array-like object, returning empty array`);
        return [];
      }
    }
  }
  
  console.log(`    -> Unhandled type, returning empty array`);
  return [];
}

// Safe function for JSON data that can be null
function safeJson(value: any): any {
  console.log(`    Validating JSON data:`, typeof value);
  
  if (value === null || value === undefined) {
    console.log(`    -> Returning null for null/undefined`);
    return null;
  }
  
  if (Array.isArray(value) || typeof value === 'object') {
    console.log(`    -> Valid JSON object/array`);
    return value;
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      console.log(`    -> Parsed JSON string successfully`);
      return parsed;
    } catch (error) {
      console.log(`    -> Failed to parse JSON string, returning null`);
      return null;
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
      "chapters",
      "sections",
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
      
      // Parse sections data but don't include in course creation
      const sectionsData = safeJson(course.sections);
      const enrollments = safeArray(course.enrollments);
      
      console.log(`  - Sections data:`, sectionsData ? `${sectionsData.length || 0} sections` : 'no sections');
      console.log(`  - Final Enrollments: ${enrollments.length} string items`);

      // FIXED: Create course data WITHOUT sections (they'll be created as relations)
      const courseData: Prisma.CourseCreateInput = {
        courseId: course.courseId,
        teacherId: course.teacherId ?? course.teacher_id,
        teacherName: course.teacherName ?? course.teacher_name,
        teacherImage: course.teacherImage ?? course.teacher_image ?? null,
        title: course.title,
        description: course.description ?? null,
        category: course.category,
        image: course.image ?? null,
        price: course.price ?? null,
        level: course.level as CourseLevel,
        status: course.status as CourseStatus,
        enrollments: enrollments, // This is String[]
        // REMOVED: sections - will be created separately as relations
      };

      // Create the course first
      const createdCourse = await prisma.course.create({
        data: courseData,
      });

      // Now create sections and chapters as separate entities if they exist
      if (sectionsData && Array.isArray(sectionsData) && sectionsData.length > 0) {
        console.log(`  - Creating ${sectionsData.length} sections...`);
        
        for (const sectionData of sectionsData) {
          try {
            const section = await prisma.section.create({
              data: {
                sectionId: sectionData.sectionId || uuidv4(),
                courseId: createdCourse.courseId,
                sectionTitle: sectionData.sectionTitle || sectionData.title || 'Untitled Section',
                sectionDescription: sectionData.sectionDescription || sectionData.description || '',
              }
            });

            // Create chapters for this section
            if (sectionData.chapters && Array.isArray(sectionData.chapters) && sectionData.chapters.length > 0) {
              console.log(`    - Creating ${sectionData.chapters.length} chapters for section ${section.sectionTitle}...`);
              
              for (const chapterData of sectionData.chapters) {
                await prisma.chapter.create({
                  data: {
                    chapterId: chapterData.chapterId || uuidv4(),
                    sectionId: section.sectionId,
                    title: chapterData.title || 'Untitled Chapter',
                    content: chapterData.content || '',
                    type: chapterData.type || 'Text',
                    video: chapterData.video || '',
                  }
                });
              }
            }
          } catch (sectionError) {
            console.error(`    ❌ Error creating section:`, sectionError);
            // Continue with other sections
          }
        }
      }
      
      console.log(`  ✅ Course ${i + 1} inserted successfully`);
    } catch (error) {
      console.error(`❌ Error inserting course ${i + 1}:`, error);
      console.log("Full course data:", JSON.stringify(course, null, 2));
      
      // Try inserting with completely safe defaults
      console.log("Attempting to insert with safe defaults...");
      try {
        const fallbackData: Prisma.CourseCreateInput = {
          courseId: course.courseId || `course-${i}`,
          teacherId: course.teacherId ?? course.teacher_id ?? `teacher-${i}`,
          teacherName: course.teacherName ?? course.teacher_name ?? `Teacher ${i}`,
          teacherImage: null,
          title: course.title || `Course ${i}`,
          description: course.description ?? null,
          category: course.category || "General",
          image: null,
          price: course.price ?? null,
          level: (course.level as CourseLevel) || CourseLevel.Beginner,
          status: (course.status as CourseStatus) || CourseStatus.Published,
          enrollments: [], // Empty array for String[]
          // REMOVED: sections - not part of CourseCreateInput when using relations
        };

        await prisma.course.create({
          data: fallbackData,
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

        // Add user to course enrollments using raw SQL for array operations
        const courseId = transaction.courseId ?? transaction.course_id;
        const userId = transaction.userId ?? transaction.user_id;

        const course = await prisma.course.findUnique({
          where: { courseId },
        });

        if (course) {
          const currentEnrollments = course.enrollments || [];
          if (!currentEnrollments.includes(userId)) {
            await prisma.course.update({
              where: { courseId },
              data: { 
                enrollments: {
                  push: userId // Use Prisma's push operation for arrays
                }
              },
            });
          }
        }
      } catch (error) {
        console.error("Error processing transaction:", error);
        // Continue with other transactions
      }
    }
  }

  // Generate teacher earnings
  console.log("Generating teacher earnings...");
  
  // Get all courses with their actual enrollments
  const courses = await prisma.course.findMany({
    select: {
      courseId: true,
      teacherId: true,
      title: true,
      enrollments: true, // This is String[]
      price: true,
    },
  });

  const earningsMap = new Map();
  
  for (const course of courses) {
    const key = `${course.teacherId}-${course.courseId}`;
    
    // Calculate actual enrollment count from course.enrollments array
    const actualEnrollmentCount = course.enrollments?.length || 0;
    
    // Calculate total earnings from enrollments for this course
    const courseTransactions = course.enrollments.length * (course.price || 0);
    const totalEarnings = courseTransactions * 0.7; // 70% to teacher
    
    // Only create earnings record if there are enrollments or transactions
    if (actualEnrollmentCount > 0) {
      earningsMap.set(key, {
        teacherId: course.teacherId,
        courseId: course.courseId,
        title: course.title,
        enrollCount: actualEnrollmentCount,  // ← Use actual enrollments count
        earnings: totalEarnings,
      });
    }
  }

  // Insert teacher earnings
  for (const [key, earningsData] of earningsMap) {
    try {
      await prisma.teacherEarnings.create({
        data: {
          teacherId: earningsData.teacherId,
          courseId: earningsData.courseId,
          title: earningsData.title,
          enrollCount: earningsData.enrollCount,
          earnings: Math.round(earningsData.earnings), // Round to avoid floating point issues
        },
      });
      
      console.log(`Created earnings for course "${earningsData.title}": ${earningsData.enrollCount} students, $${(earningsData.earnings / 100).toFixed(2)}`);
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
          : Prisma.JsonNull;

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
