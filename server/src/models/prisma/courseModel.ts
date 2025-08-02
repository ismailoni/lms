import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
  level?: string;
  status?: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  image?: string;
  price?: number;
  level?: string;
  status?: string;
  sections?: any;
  enrollments?: string[];
}

export class CourseModel {
  static async findAll(category?: string) {
    const whereClause = category 
      ? { category, status: "Published" } 
      : { status: "Published" };

    return prisma.course.findMany({
      where: whereClause,
      include: {
        sections: {
          include: {
            chapters: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(courseId: string) {
    return prisma.course.findUnique({
      where: { courseId },
      include: {
        sections: {
          include: {
            chapters: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
    });
  }

  static async create(data: CreateCourseData) {
    return prisma.course.create({
      data: {
        courseId: uuidv4(),
        ...data,
        enrollments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async update(courseId: string, data: UpdateCourseData) {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Handle enrollments properly
    if (data.enrollments !== undefined) {
      updateData.enrollments = data.enrollments || []; // Always array for String[]
    }

    // Remove sections from updateData as it's handled separately
    if (updateData.sections) {
      delete updateData.sections;
    }

    return prisma.course.update({
      where: { courseId },
      data: updateData,
      include: {
        sections: {
          include: {
            chapters: true
          }
        }
      },
    });
  }

  // FIXED: Add missing addEnrollment method
  static async addEnrollment(courseId: string, userId: string) {
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: { enrollments: true }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const currentEnrollments = course.enrollments || [];
    
    // Check if user is already enrolled
    if (currentEnrollments.includes(userId)) {
      throw new Error('User is already enrolled in this course');
    }

    // Add user to enrollments
    return prisma.course.update({
      where: { courseId },
      data: {
        enrollments: {
          push: userId
        }
      }
    });
  }

  // FIXED: Add missing findEnrolledCoursesByUserId method
  static async findEnrolledCoursesByUserId(userId: string) {
    return prisma.course.findMany({
      where: {
        enrollments: {
          has: userId
        }
      },
      include: {
        sections: {
          include: {
            chapters: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async delete(courseId: string) {
    // Use transaction to ensure clean deletion
    return await prisma.$transaction(async (tx) => {
      // Delete chapters first
      await tx.chapter.deleteMany({
        where: {
          section: {
            courseId: courseId
          }
        }
      });

      // Delete sections
      await tx.section.deleteMany({
        where: { courseId }
      });

      // Delete related records
      await tx.userCourseProgress.deleteMany({
        where: { courseId }
      });

      await tx.transaction.deleteMany({
        where: { courseId }
      });

      // Finally delete the course
      return await tx.course.delete({ 
        where: { courseId } 
      });
    });
  }

  static async findByTeacherId(teacherId: string) {
    return prisma.course.findMany({
      where: { teacherId },
      include: {
        sections: {
          include: {
            chapters: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default CourseModel;
