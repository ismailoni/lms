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
      enrollments: (course.enrollments as string[]) || [],
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
      enrollments: (course.enrollments as string[]) || [],
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
        enrollments: data.enrollments,
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
      updateData.enrollments = data.enrollments && data.enrollments.length > 0 ? data.enrollments : null;
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
    const course = await this.findById(courseId);
    if (!course) throw new Error('Course not found');
    
    const enrollments = (course.enrollments as string[]) || [];
    if (!enrollments.includes(userId)) {
      enrollments.push(userId);
      return this.update(courseId, { enrollments });
    }
    return course;
  }

  static async removeEnrollment(courseId: string, userId: string) {
    const course = await this.findById(courseId);
    if (!course) throw new Error('Course not found');
    
    const enrollments = (course.enrollments as string[]) || [];
    const updatedEnrollments = enrollments.filter(id => id !== userId);
    return this.update(courseId, { enrollments: updatedEnrollments });
  }

  static async findEnrolledCoursesByUserId(userId: string) {
    // Use raw SQL query to handle JSON array search properly
    const courses = await prisma.$queryRaw<any[]>`
      SELECT * FROM courses 
      WHERE enrollments IS NOT NULL 
      AND enrollments @> ${JSON.stringify([userId])}::jsonb
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
