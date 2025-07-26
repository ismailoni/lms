import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTeacherEarningsData {
  teacherId: string;
  courseId: string;
  title?: string;
  enrollCount?: number;
  earnings?: number;
}

export interface UpdateTeacherEarningsData {
  title?: string;
  enrollCount?: number;
  earnings?: number;
}

export class TeacherEarningsModel {
  // Fetch all teacher earnings
  static async findAll() {
    return prisma.teacherEarnings.findMany({
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Fetch all earnings for a teacher
  static async findByTeacherId(teacherId: string) {
    return prisma.teacherEarnings.findMany({
      where: { teacherId },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Fetch a single record by teacher + course
  static async findByTeacherIdAndCourseId(teacherId: string, courseId: string) {
    return prisma.teacherEarnings.findUnique({
      where: { teacherId_courseId: { teacherId, courseId } },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Create a record
  static async create(data: CreateTeacherEarningsData) {
    return prisma.teacherEarnings.create({
      data: {
        teacherId: data.teacherId,
        courseId: data.courseId,
        title: data.title,
        enrollCount: data.enrollCount ?? 0,
        earnings: data.earnings ?? 0,
        // No updatedAt — handled by Prisma
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Update a record
  static async update(
    teacherId: string,
    courseId: string,
    data: UpdateTeacherEarningsData
  ) {
    const updateData: Prisma.TeacherEarningsUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.enrollCount !== undefined) updateData.enrollCount = data.enrollCount;
    if (data.earnings !== undefined) updateData.earnings = data.earnings;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    return prisma.teacherEarnings.update({
      where: { teacherId_courseId: { teacherId, courseId } },
      data: updateData, // updatedAt is auto-updated by Prisma
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Upsert a record
  static async upsert(
    teacherId: string,
    courseId: string,
    data: CreateTeacherEarningsData
  ) {
    return prisma.teacherEarnings.upsert({
      where: { teacherId_courseId: { teacherId, courseId } },
      update: {
        title: data.title,
        enrollCount: data.enrollCount,
        earnings: data.earnings,
      },
      create: {
        teacherId: data.teacherId,
        courseId: data.courseId,
        title: data.title,
        enrollCount: data.enrollCount ?? 0,
        earnings: data.earnings ?? 0,
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }

  // Delete a record
  static async delete(teacherId: string, courseId: string) {
    return prisma.teacherEarnings.delete({
      where: { teacherId_courseId: { teacherId, courseId } },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true,
          },
        },
      },
    });
  }
}

export default TeacherEarningsModel;
