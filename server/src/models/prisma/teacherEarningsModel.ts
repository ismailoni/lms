import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTeacherEarningsData {
  teacherId: string;
  courseId: string;
  title?: string;
  enrollCount?: number;
  earnings?: number;
  updatedAt?: string;
}

export interface UpdateTeacherEarningsData {
  title?: string;
  enrollCount?: number;
  earnings?: number;
  updatedAt?: string;
}

export class TeacherEarningsModel {
  static async findAll() {
    const teacherEarnings = await prisma.teacherEarnings.findMany({
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarnings;
  }

  static async findByTeacherId(teacherId: string) {
    const teacherEarnings = await prisma.teacherEarnings.findMany({
      where: { teacherId },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarnings;
  }

  static async findByTeacherIdAndCourseId(teacherId: string, courseId: string) {
    const teacherEarning = await prisma.teacherEarnings.findUnique({
      where: {
        teacherId_courseId: {
          teacherId,
          courseId
        }
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarning;
  }

  static async create(data: CreateTeacherEarningsData) {
    const teacherEarning = await prisma.teacherEarnings.create({
      data: {
        teacherId: data.teacherId,
        courseId: data.courseId,
        title: data.title,
        enrollCount: data.enrollCount,
        earnings: data.earnings,
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarning;
  }

  static async update(teacherId: string, courseId: string, data: UpdateTeacherEarningsData) {
    const updateData: any = {};
    
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.enrollCount !== undefined) {
      updateData.enrollCount = data.enrollCount;
    }
    if (data.earnings !== undefined) {
      updateData.earnings = data.earnings;
    }
    if (data.updatedAt !== undefined) {
      updateData.updatedAt = new Date(data.updatedAt);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const teacherEarning = await prisma.teacherEarnings.update({
      where: {
        teacherId_courseId: {
          teacherId,
          courseId
        }
      },
      data: updateData,
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarning;
  }

  static async upsert(teacherId: string, courseId: string, data: CreateTeacherEarningsData) {
    const teacherEarning = await prisma.teacherEarnings.upsert({
      where: {
        teacherId_courseId: {
          teacherId,
          courseId
        }
      },
      update: {
        title: data.title,
        enrollCount: data.enrollCount,
        earnings: data.earnings,
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      },
      create: {
        teacherId: data.teacherId,
        courseId: data.courseId,
        title: data.title,
        enrollCount: data.enrollCount,
        earnings: data.earnings,
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarning;
  }

  static async delete(teacherId: string, courseId: string) {
    const teacherEarning = await prisma.teacherEarnings.delete({
      where: {
        teacherId_courseId: {
          teacherId,
          courseId
        }
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      }
    });

    return teacherEarning;
  }
}

export default TeacherEarningsModel;