import db from '../../utils/database';

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
    let query = `
      SELECT c.*, 
             COALESCE(json_agg(
               DISTINCT jsonb_build_object(
                 'sectionId', s."sectionId",
                 'sectionTitle', s."sectionTitle", 
                 'sectionDescription', s."sectionDescription",
                 'chapters', s_chapters.chapters
               )
             ) FILTER (WHERE s."sectionId" IS NOT NULL), '[]') as sections,
             COALESCE(json_agg(
               DISTINCT jsonb_build_object('userId', e."userId")
             ) FILTER (WHERE e."userId" IS NOT NULL), '[]') as enrollments
      FROM courses c
      LEFT JOIN sections s ON c."courseId" = s."courseId"
      LEFT JOIN enrollments e ON c."courseId" = e."courseId"
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(
          jsonb_build_object(
            'chapterId', ch."chapterId",
            'type', ch.type,
            'title', ch.title,
            'content', ch.content,
            'video', ch.video,
            'comments', ch_comments.comments
          )
        ), '[]') as chapters
        FROM chapters ch
        LEFT JOIN LATERAL (
          SELECT COALESCE(json_agg(
            jsonb_build_object(
              'commentId', cm."commentId",
              'userId', cm."userId",
              'text', cm.text,
              'timestamp', cm.timestamp
            )
          ), '[]') as comments
          FROM comments cm
          WHERE cm."chapterId" = ch."chapterId"
        ) ch_comments ON true
        WHERE ch."sectionId" = s."sectionId"
      ) s_chapters ON true
    `;
    
    const params = [];
    if (category && category !== 'all') {
      query += ` WHERE c.category = $1`;
      params.push(category);
    }
    
    query += ` GROUP BY c."courseId" ORDER BY c."createdAt" DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(courseId: string) {
    const query = `
      SELECT c.*, 
             COALESCE(json_agg(
               DISTINCT jsonb_build_object(
                 'sectionId', s."sectionId",
                 'sectionTitle', s."sectionTitle", 
                 'sectionDescription', s."sectionDescription",
                 'chapters', s_chapters.chapters
               )
             ) FILTER (WHERE s."sectionId" IS NOT NULL), '[]') as sections,
             COALESCE(json_agg(
               DISTINCT jsonb_build_object('userId', e."userId")
             ) FILTER (WHERE e."userId" IS NOT NULL), '[]') as enrollments
      FROM courses c
      LEFT JOIN sections s ON c."courseId" = s."courseId"
      LEFT JOIN enrollments e ON c."courseId" = e."courseId"
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(
          jsonb_build_object(
            'chapterId', ch."chapterId",
            'type', ch.type,
            'title', ch.title,
            'content', ch.content,
            'video', ch.video,
            'comments', ch_comments.comments
          )
        ), '[]') as chapters
        FROM chapters ch
        LEFT JOIN LATERAL (
          SELECT COALESCE(json_agg(
            jsonb_build_object(
              'commentId', cm."commentId",
              'userId', cm."userId",
              'text', cm.text,
              'timestamp', cm.timestamp
            )
          ), '[]') as comments
          FROM comments cm
          WHERE cm."chapterId" = ch."chapterId"
        ) ch_comments ON true
        WHERE ch."sectionId" = s."sectionId"
      ) s_chapters ON true
      WHERE c."courseId" = $1
      GROUP BY c."courseId"
    `;
    
    const result = await db.query(query, [courseId]);
    return result.rows[0];
  }

  static async create(data: CreateCourseData) {
    const query = `
      INSERT INTO courses ("teacherId", "teacherName", "teacherImage", title, description, category, image, price, level, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      data.teacherId,
      data.teacherName,
      data.teacherImage,
      data.title,
      data.description,
      data.category,
      data.image,
      data.price,
      data.level,
      data.status
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(courseId: string, data: UpdateCourseData) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach((key) => {
      if (data[key as keyof UpdateCourseData] !== undefined) {
        updateFields.push(`"${key}" = $${paramCount++}`);
        values.push(data[key as keyof UpdateCourseData]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(courseId);

    const query = `
      UPDATE courses 
      SET ${updateFields.join(', ')}
      WHERE "courseId" = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(courseId: string) {
    const query = `DELETE FROM courses WHERE "courseId" = $1 RETURNING *`;
    const result = await db.query(query, [courseId]);
    return result.rows[0];
  }

  static async createSection(courseId: string, sectionData: {
    sectionTitle: string;
    sectionDescription?: string;
  }) {
    const query = `
      INSERT INTO sections ("sectionTitle", "sectionDescription", "courseId")
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [
      sectionData.sectionTitle,
      sectionData.sectionDescription,
      courseId
    ]);
    return result.rows[0];
  }

  static async createChapter(sectionId: string, chapterData: {
    type: 'Text' | 'Quiz' | 'Video';
    title: string;
    content: string;
    video?: string;
  }) {
    const query = `
      INSERT INTO chapters (type, title, content, video, "sectionId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [
      chapterData.type,
      chapterData.title,
      chapterData.content,
      chapterData.video,
      sectionId
    ]);
    return result.rows[0];
  }

  static async addEnrollment(courseId: string, userId: string) {
    const query = `
      INSERT INTO enrollments ("userId", "courseId")
      VALUES ($1, $2)
      ON CONFLICT ("userId", "courseId") DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [userId, courseId]);
    return result.rows[0];
  }

  static async removeEnrollment(courseId: string, userId: string) {
    const query = `
      DELETE FROM enrollments 
      WHERE "userId" = $1 AND "courseId" = $2
      RETURNING *
    `;
    const result = await db.query(query, [userId, courseId]);
    return result.rows[0];
  }
}

export default CourseModel;