import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserCourseProgressData {
  userId: string;
  courseId: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessedTimestamp: string;
}

export interface UpdateUserCourseProgressData {
  overallProgress?: number;
  lastAccessedTimestamp?: string;
}

export class UserCourseProgressModel {
  static async findAll() {
    const userCourseProgress = await prisma.userCourseProgress.findMany({
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        },
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return userCourseProgress;
  }

  static async findByUserId(userId: string) {
    const userCourseProgress = await prisma.userCourseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        },
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return userCourseProgress;
  }

  static async findByUserIdAndCourseId(userId: string, courseId: string) {
    const userCourseProgress = await prisma.userCourseProgress.findFirst({
      where: { 
        userId,
        courseId 
      },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        },
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });

    return userCourseProgress;
  }

  static async create(data: CreateUserCourseProgressData) {
    const userCourseProgress = await prisma.userCourseProgress.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        enrollmentDate: new Date(data.enrollmentDate).toISOString(),
        overallProgress: data.overallProgress,
        lastAccessedTimestamp: new Date(data.lastAccessedTimestamp).toISOString()
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

    return userCourseProgress;
  }

  static async update(userId: string, courseId: string, data: UpdateUserCourseProgressData) {
    const updateData: any = {};
    
    if (data.overallProgress !== undefined) {
      updateData.overallProgress = data.overallProgress;
    }
    if (data.lastAccessedTimestamp !== undefined) {
      updateData.lastAccessedTimestamp = new Date(data.lastAccessedTimestamp);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const userCourseProgress = await prisma.userCourseProgress.updateMany({
      where: { 
        userId,
        courseId 
      },
      data: updateData
    });

    return userCourseProgress;
  }

  static async createSectionProgress(userCourseProgressId: string, sectionId: string) {
    const sectionProgress = await prisma.sectionProgress.create({
      data: {
        sectionId,
        userCourseProgressId
      }
    });

    return sectionProgress;
  }

  static async createChapterProgress(sectionProgressId: string, chapterId: string, completed: boolean = false) {
    const chapterProgress = await prisma.chapterProgress.create({
      data: {
        chapterId,
        completed,
        sectionProgressId
      }
    });

    return chapterProgress;
  }

  static async updateChapterProgress(chapterId: string, sectionProgressId: string, completed: boolean) {
    const chapterProgress = await prisma.chapterProgress.updateMany({
      where: { 
        chapterId,
        sectionProgressId 
      },
      data: { completed }
    });

    return chapterProgress;
  }
}

export default UserCourseProgressModel;