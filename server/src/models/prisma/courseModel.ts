import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCourseData {
  teacherId: string;
  teacherName: string;
  teacherImage?: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  price?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published';
  sections?: any[];
  enrollments?: string[];
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  imageUrl?: string;
}

export class CourseModel {
  static async findAll(category?: string) {
    const whereClause = category && category !== 'all' ? { category } : {};

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Ensure enrollments and sections are arrays
    return courses.map(course => ({
      ...course,
      enrollments: course.enrollments || [], // Now String[] from database
      sections: (course.sections as any[]) || []
    }));
  }

  static async findById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { courseId },
    });

    if (!course) return null;

    // Ensure enrollments and sections are arrays
    return {
      ...course,
      enrollments: course.enrollments || [], // Now String[] from database
      sections: (course.sections as any[]) || []
    };
  }

  static async create(data: CreateCourseData) {
    return prisma.course.create({
      data: {
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        teacherImage: data.teacherImage,
        title: data.title,
        description: data.description,
        category: data.category,
        image: data.image,
        price: data.price,
        level: data.level,
        status: data.status,
        sections: data.sections,
        enrollments: data.enrollments || [], // Default to empty array
      },
    });
  }

  static async update(courseId: string, data: UpdateCourseData) {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Handle sections and enrollments properly
    if (data.sections !== undefined) {
      updateData.sections = data.sections && data.sections.length > 0 ? data.sections : null;
    }
    if (data.enrollments !== undefined) {
      updateData.enrollments = data.enrollments || []; // Always array for String[]
    }

    return prisma.course.update({
      where: { courseId },
      data: updateData,
    });
  }

  static async delete(courseId: string) {
    // Check for enrollments first
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: { enrollments: true, teacherId: true }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.enrollments && course.enrollments.length > 0) {
      throw new Error(`Cannot delete course with ${course.enrollments.length} enrolled students`);
    }

    // Use transaction to ensure clean deletion
    return await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.userCourseProgress.deleteMany({
        where: { courseId }
      });

      await tx.transaction.deleteMany({
        where: { courseId }
      });

      await tx.teacherEarnings.deleteMany({
        where: { 
          teacherId: course.teacherId,
          courseId: courseId 
        }
      });

      // Finally delete the course
      return await tx.course.delete({ 
        where: { courseId } 
      });
    });
  }

  // New method to check if course can be deleted
  static async canDelete(courseId: string): Promise<{
    canDelete: boolean;
    reason?: string;
    enrollmentCount?: number;
    transactionCount?: number;
  }> {
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: { enrollments: true }
    });

    if (!course) {
      return { canDelete: false, reason: 'Course not found' };
    }

    const enrollmentCount = course.enrollments?.length || 0;
    const transactionCount = await prisma.transaction.count({
      where: { courseId }
    });

    if (enrollmentCount > 0) {
      return { 
        canDelete: false, 
        reason: `Course has ${enrollmentCount} enrolled students`,
        enrollmentCount,
        transactionCount
      };
    }

    if (transactionCount > 0) {
      return { 
        canDelete: false, 
        reason: `Course has ${transactionCount} transaction records`,
        enrollmentCount,
        transactionCount
      };
    }

    return { canDelete: true, enrollmentCount: 0, transactionCount: 0 };
  }

  static async addEnrollment(courseId: string, userId: string) {
    // Use PostgreSQL array operations for String[]
    await prisma.$executeRaw`
      UPDATE "courses" 
      SET "enrollments" = array_append("enrollments", ${userId})
      WHERE "courseId" = ${courseId}
      AND NOT (${userId} = ANY("enrollments"))
    `;
    
    return this.findById(courseId);
  }

  static async removeEnrollment(courseId: string, userId: string) {
    // Use PostgreSQL array operations for String[]
    await prisma.$executeRaw`
      UPDATE "courses" 
      SET "enrollments" = array_remove("enrollments", ${userId})
      WHERE "courseId" = ${courseId}
    `;
    
    return this.findById(courseId);
  }

  static async findEnrolledCoursesByUserId(userId: string) {
    // Use PostgreSQL array operations to check if user is in enrollments
    const courses = await prisma.$queryRaw<any[]>`
      SELECT * FROM "courses" 
      WHERE "enrollments" IS NOT NULL 
      AND ${userId} = ANY("enrollments")
      ORDER BY "createdAt" DESC
    `;

    // Ensure enrollments and sections are arrays for returned courses
    return courses.map(course => ({
      ...course,
      enrollments: course.enrollments || [],
      sections: course.sections || []
    }));
  }
}

export default CourseModel;
