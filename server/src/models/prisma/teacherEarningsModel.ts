import { PrismaClient, TeacherEarnings } from '@prisma/client';

const prisma = new PrismaClient();

export class TeacherEarningsModel {
  static async findByTeacherIdAndCourseId(teacherId: string, courseId: string) {
    return prisma.teacherEarnings.findUnique({
      where: { teacherId_courseId: { teacherId, courseId } },
    });
  }

  static async findByTeacherId(teacherId: string) {
    return prisma.teacherEarnings.findMany({
      where: { teacherId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(data: {
    teacherId: string;
    courseId: string;
    title?: string | null;
    enrollCount?: number;
    earnings?: number; // now float
  }) {
    return prisma.teacherEarnings.create({
      data: {
        teacherId: data.teacherId,
        courseId: data.courseId,
        title: data.title ?? null,
        enrollCount: data.enrollCount ?? 1,
        earnings: +(data.earnings ?? 0).toFixed(2),
      },
    });
  }

  static async update(
    teacherId: string,
    courseId: string,
    data: Partial<Pick<TeacherEarnings, 'enrollCount' | 'earnings' | 'title'>>
  ) {
    if (data.earnings !== undefined) {
      data.earnings = +data.earnings.toFixed(2);
    }
    return prisma.teacherEarnings.update({
      where: { teacherId_courseId: { teacherId, courseId } },
      data,
    });
  }

  static async delete(teacherId: string, courseId: string) {
    return prisma.teacherEarnings.delete({
      where: { teacherId_courseId: { teacherId, courseId } },
    });
  }
}

export default TeacherEarningsModel;
