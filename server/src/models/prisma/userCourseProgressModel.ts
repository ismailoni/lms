import prisma from '../../utils/prisma';

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
    return await prisma.userCourseProgress.findMany({
      include: {
        course: true,
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });
  }

  static async findByUserId(userId: string) {
    return await prisma.userCourseProgress.findMany({
      where: { userId },
      include: {
        course: true,
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });
  }

  static async findByUserIdAndCourseId(userId: string, courseId: string) {
    return await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        course: true,
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });
  }

  static async create(data: CreateUserCourseProgressData) {
    return await prisma.userCourseProgress.create({
      data,
      include: {
        course: true,
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });
  }

  static async update(userId: string, courseId: string, data: UpdateUserCourseProgressData) {
    return await prisma.userCourseProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data,
      include: {
        course: true,
        sectionProgress: {
          include: {
            chapterProgress: true
          }
        }
      }
    });
  }

  static async createSectionProgress(userCourseProgressId: string, sectionId: string) {
    return await prisma.sectionProgress.create({
      data: {
        sectionId,
        userCourseProgressId
      },
      include: {
        chapterProgress: true
      }
    });
  }

  static async createChapterProgress(sectionProgressId: string, chapterId: string, completed: boolean = false) {
    return await prisma.chapterProgress.create({
      data: {
        chapterId,
        completed,
        sectionProgressId
      }
    });
  }

  static async updateChapterProgress(chapterId: string, sectionProgressId: string, completed: boolean) {
    return await prisma.chapterProgress.update({
      where: {
        chapterId_sectionProgressId: {
          chapterId,
          sectionProgressId
        }
      },
      data: {
        completed
      }
    });
  }
}

export default UserCourseProgressModel;