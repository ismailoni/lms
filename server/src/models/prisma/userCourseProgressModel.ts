import db from '../../utils/database';

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
    const query = `
      SELECT ucp.*, 
             c.title as course_title, c."teacherName", c.category,
             COALESCE(json_agg(
               DISTINCT jsonb_build_object(
                 'id', sp.id,
                 'sectionId', sp."sectionId",
                 'chapterProgress', sp_chapters.chapters
               )
             ) FILTER (WHERE sp.id IS NOT NULL), '[]') as "sectionProgress"
      FROM user_course_progress ucp
      LEFT JOIN courses c ON ucp."courseId" = c."courseId"
      LEFT JOIN section_progress sp ON ucp.id = sp."userCourseProgressId"
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(
          jsonb_build_object(
            'id', cp.id,
            'chapterId', cp."chapterId",
            'completed', cp.completed
          )
        ), '[]') as chapters
        FROM chapter_progress cp
        WHERE cp."sectionProgressId" = sp.id
      ) sp_chapters ON true
      GROUP BY ucp.id, c.title, c."teacherName", c.category
      ORDER BY ucp."createdAt" DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findByUserId(userId: string) {
    const query = `
      SELECT ucp.*, 
             c.title as course_title, c."teacherName", c.category,
             COALESCE(json_agg(
               DISTINCT jsonb_build_object(
                 'id', sp.id,
                 'sectionId', sp."sectionId",
                 'chapterProgress', sp_chapters.chapters
               )
             ) FILTER (WHERE sp.id IS NOT NULL), '[]') as "sectionProgress"
      FROM user_course_progress ucp
      LEFT JOIN courses c ON ucp."courseId" = c."courseId"
      LEFT JOIN section_progress sp ON ucp.id = sp."userCourseProgressId"
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(
          jsonb_build_object(
            'id', cp.id,
            'chapterId', cp."chapterId",
            'completed', cp.completed
          )
        ), '[]') as chapters
        FROM chapter_progress cp
        WHERE cp."sectionProgressId" = sp.id
      ) sp_chapters ON true
      WHERE ucp."userId" = $1
      GROUP BY ucp.id, c.title, c."teacherName", c.category
      ORDER BY ucp."createdAt" DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findByUserIdAndCourseId(userId: string, courseId: string) {
    const query = `
      SELECT ucp.*, 
             c.title as course_title, c."teacherName", c.category,
             COALESCE(json_agg(
               DISTINCT jsonb_build_object(
                 'id', sp.id,
                 'sectionId', sp."sectionId",
                 'chapterProgress', sp_chapters.chapters
               )
             ) FILTER (WHERE sp.id IS NOT NULL), '[]') as "sectionProgress"
      FROM user_course_progress ucp
      LEFT JOIN courses c ON ucp."courseId" = c."courseId"
      LEFT JOIN section_progress sp ON ucp.id = sp."userCourseProgressId"
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(
          jsonb_build_object(
            'id', cp.id,
            'chapterId', cp."chapterId",
            'completed', cp.completed
          )
        ), '[]') as chapters
        FROM chapter_progress cp
        WHERE cp."sectionProgressId" = sp.id
      ) sp_chapters ON true
      WHERE ucp."userId" = $1 AND ucp."courseId" = $2
      GROUP BY ucp.id, c.title, c."teacherName", c.category
    `;
    const result = await db.query(query, [userId, courseId]);
    return result.rows[0];
  }

  static async create(data: CreateUserCourseProgressData) {
    const query = `
      INSERT INTO user_course_progress ("userId", "courseId", "enrollmentDate", "overallProgress", "lastAccessedTimestamp", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      data.userId,
      data.courseId,
      data.enrollmentDate,
      data.overallProgress,
      data.lastAccessedTimestamp
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(userId: string, courseId: string, data: UpdateUserCourseProgressData) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (data.overallProgress !== undefined) {
      updateFields.push(`"overallProgress" = $${paramCount++}`);
      values.push(data.overallProgress);
    }
    if (data.lastAccessedTimestamp !== undefined) {
      updateFields.push(`"lastAccessedTimestamp" = $${paramCount++}`);
      values.push(data.lastAccessedTimestamp);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(userId, courseId);

    const query = `
      UPDATE user_course_progress 
      SET ${updateFields.join(', ')}
      WHERE "userId" = $${paramCount++} AND "courseId" = $${paramCount++}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async createSectionProgress(userCourseProgressId: string, sectionId: string) {
    const query = `
      INSERT INTO section_progress ("sectionId", "userCourseProgressId")
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [sectionId, userCourseProgressId]);
    return result.rows[0];
  }

  static async createChapterProgress(sectionProgressId: string, chapterId: string, completed: boolean = false) {
    const query = `
      INSERT INTO chapter_progress ("chapterId", completed, "sectionProgressId")
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [chapterId, completed, sectionProgressId]);
    return result.rows[0];
  }

  static async updateChapterProgress(chapterId: string, sectionProgressId: string, completed: boolean) {
    const query = `
      UPDATE chapter_progress 
      SET completed = $1
      WHERE "chapterId" = $2 AND "sectionProgressId" = $3
      RETURNING *
    `;
    const result = await db.query(query, [completed, chapterId, sectionProgressId]);
    return result.rows[0];
  }
}

export default UserCourseProgressModel;