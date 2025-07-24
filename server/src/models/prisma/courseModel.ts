import prisma from '../../utils/prisma';

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
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export class CourseModel {
  static async findAll(category?: string) {
    if (category && category !== 'all') {
      return await prisma.course.findMany({
        where: { category },
        include: {
          sections: {
            include: {
              chapters: {
                include: {
                  comments: true
                }
              }
            }
          },
          enrollments: true
        }
      });
    }
    
    return await prisma.course.findMany({
      include: {
        sections: {
          include: {
            chapters: {
              include: {
                comments: true
              }
            }
          }
        },
        enrollments: true
      }
    });
  }

  static async findById(courseId: string) {
    return await prisma.course.findUnique({
      where: { courseId },
      include: {
        sections: {
          include: {
            chapters: {
              include: {
                comments: true
              }
            }
          }
        },
        enrollments: true
      }
    });
  }

  static async create(data: CreateCourseData) {
    return await prisma.course.create({
      data
    });
  }

  static async update(courseId: string, data: UpdateCourseData) {
    return await prisma.course.update({
      where: { courseId },
      data
    });
  }

  static async delete(courseId: string) {
    return await prisma.course.delete({
      where: { courseId }
    });
  }

  static async createSection(courseId: string, sectionData: {
    sectionTitle: string;
    sectionDescription?: string;
  }) {
    return await prisma.section.create({
      data: {
        ...sectionData,
        courseId
      }
    });
  }

  static async createChapter(sectionId: string, chapterData: {
    type: 'Text' | 'Quiz' | 'Video';
    title: string;
    content: string;
    video?: string;
  }) {
    return await prisma.chapter.create({
      data: {
        ...chapterData,
        sectionId
      }
    });
  }

  static async addEnrollment(courseId: string, userId: string) {
    return await prisma.enrollment.create({
      data: {
        courseId,
        userId
      }
    });
  }

  static async removeEnrollment(courseId: string, userId: string) {
    return await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });
  }
}

export default CourseModel;