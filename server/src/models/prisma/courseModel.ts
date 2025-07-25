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
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export class CourseModel {
  static async findAll(category?: string) {
    const whereClause = category && category !== 'all' ? { category } : {};
    
    const courses = await prisma.course.findMany({
      where: whereClause,
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
        enrollments: {
          select: {
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return courses;
  }

  static async findById(courseId: string) {
    const course = await prisma.course.findUnique({
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
        enrollments: {
          select: {
            userId: true
          }
        }
      }
    });

    return course;
  }

  static async create(data: CreateCourseData) {
    const course = await prisma.course.create({
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
        status: data.status
      }
    });

    return course;
  }

  static async update(courseId: string, data: UpdateCourseData) {
    const course = await prisma.course.update({
      where: { courseId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return course;
  }

  static async delete(courseId: string) {
    const course = await prisma.course.delete({
      where: { courseId }
    });

    return course;
  }

  static async createSection(courseId: string, sectionData: {
    sectionTitle: string;
    sectionDescription?: string;
  }) {
    const section = await prisma.section.create({
      data: {
        sectionTitle: sectionData.sectionTitle,
        sectionDescription: sectionData.sectionDescription,
        courseId: courseId
      }
    });

    return section;
  }

  static async createChapter(sectionId: string, chapterData: {
    type: 'Text' | 'Quiz' | 'Video';
    title: string;
    content: string;
    video?: string;
  }) {
    const chapter = await prisma.chapter.create({
      data: {
        type: chapterData.type,
        title: chapterData.title,
        content: chapterData.content,
        video: chapterData.video,
        sectionId: sectionId
      }
    });

    return chapter;
  }

  static async addEnrollment(courseId: string, userId: string) {
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      update: {},
      create: {
        userId: userId,
        courseId: courseId
      }
    });

    return enrollment;
  }

  static async removeEnrollment(courseId: string, userId: string) {
    const enrollment = await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    });

    return enrollment;
  }
}

export default CourseModel;