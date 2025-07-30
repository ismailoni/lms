import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserCourseProgressData {
  userId: string;
  courseId: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessedTimestamp: string;
  progressData?: any;
}

export interface UpdateUserCourseProgressData {
  overallProgress?: number;
  lastAccessedTimestamp?: string;
  progressData?: any;
}

export class UserCourseProgressModel {
  static async findAll() {
    return prisma.userCourseProgress.findMany({
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findByUserId(userId: string) {
    return prisma.userCourseProgress.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findByUserIdAndCourseId(userId: string, courseId: string) {
    return prisma.userCourseProgress.findFirst({
      where: { userId, courseId },
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
  }

  static async create(data: CreateUserCourseProgressData) {
    return prisma.userCourseProgress.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        enrollmentDate: new Date(data.enrollmentDate).toISOString(),
        overallProgress: data.overallProgress,
        lastAccessedTimestamp: new Date(data.lastAccessedTimestamp).toISOString(),
        progressData: data.progressData || { sections: [] }
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
  }

  static async update(userId: string, courseId: string, data: UpdateUserCourseProgressData) {
    const updateData: any = {};
    if (data.overallProgress !== undefined) updateData.overallProgress = data.overallProgress;
    if (data.lastAccessedTimestamp !== undefined) {
      updateData.lastAccessedTimestamp = new Date(data.lastAccessedTimestamp).toISOString();
    }
    if (data.progressData !== undefined) updateData.progressData = data.progressData;
    
    if (Object.keys(updateData).length === 0) throw new Error('No fields to update');

    return prisma.userCourseProgress.updateMany({
      where: { userId, courseId },
      data: updateData
    });
  }

  static async updateSectionProgress(userId: string, courseId: string, sectionId: string, chapters: any[]) {
    const progress = await this.findByUserIdAndCourseId(userId, courseId);
    if (!progress) throw new Error('Progress not found');

    const progressData = (progress.progressData as any) || { sections: [] };
    const sectionIndex = progressData.sections.findIndex((s: any) => s.sectionId === sectionId);
    
    if (sectionIndex >= 0) {
      progressData.sections[sectionIndex].chapters = chapters;
    } else {
      progressData.sections.push({ sectionId, chapters });
    }

    return this.update(userId, courseId, { progressData });
  }

  static async updateChapterProgress(userId: string, courseId: string, sectionId: string, chapterId: string, completed: boolean) {
    const progress = await this.findByUserIdAndCourseId(userId, courseId);
    if (!progress) throw new Error('Progress not found');

    const progressData = (progress.progressData as any) || { sections: [] };
    let section = progressData.sections.find((s: any) => s.sectionId === sectionId);
    
    if (!section) {
      section = { sectionId, chapters: [] };
      progressData.sections.push(section);
    }

    const chapterIndex = section.chapters.findIndex((c: any) => c.chapterId === chapterId);
    if (chapterIndex >= 0) {
      section.chapters[chapterIndex].completed = completed;
    } else {
      section.chapters.push({ chapterId, completed });
    }

    return this.update(userId, courseId, { progressData });
  }
}

export default UserCourseProgressModel;
