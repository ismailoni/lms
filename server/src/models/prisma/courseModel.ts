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
    return prisma.course.delete({ where: { courseId } });
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
