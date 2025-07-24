import db from '../../utils/database';

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
    const query = `
      SELECT te.*, c.title as course_title, c."teacherName", c.category
      FROM teacher_earnings te
      LEFT JOIN courses c ON te."courseId" = c."courseId"
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findByTeacherId(teacherId: string) {
    const query = `
      SELECT te.*, c.title as course_title, c."teacherName", c.category
      FROM teacher_earnings te
      LEFT JOIN courses c ON te."courseId" = c."courseId"
      WHERE te."teacherId" = $1
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  static async findByTeacherIdAndCourseId(teacherId: string, courseId: string) {
    const query = `
      SELECT te.*, c.title as course_title, c."teacherName", c.category
      FROM teacher_earnings te
      LEFT JOIN courses c ON te."courseId" = c."courseId"
      WHERE te."teacherId" = $1 AND te."courseId" = $2
    `;
    const result = await db.query(query, [teacherId, courseId]);
    return result.rows[0];
  }

  static async create(data: CreateTeacherEarningsData) {
    const query = `
      INSERT INTO teacher_earnings ("teacherId", "courseId", title, "enrollCount", earnings, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.teacherId,
      data.courseId,
      data.title,
      data.enrollCount,
      data.earnings,
      data.updatedAt || new Date().toISOString()
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(teacherId: string, courseId: string, data: UpdateTeacherEarningsData) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.enrollCount !== undefined) {
      updateFields.push(`"enrollCount" = $${paramCount++}`);
      values.push(data.enrollCount);
    }
    if (data.earnings !== undefined) {
      updateFields.push(`earnings = $${paramCount++}`);
      values.push(data.earnings);
    }
    if (data.updatedAt !== undefined) {
      updateFields.push(`"updatedAt" = $${paramCount++}`);
      values.push(data.updatedAt);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(teacherId, courseId);
    
    const query = `
      UPDATE teacher_earnings 
      SET ${updateFields.join(', ')}
      WHERE "teacherId" = $${paramCount++} AND "courseId" = $${paramCount++}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async upsert(teacherId: string, courseId: string, data: CreateTeacherEarningsData) {
    const query = `
      INSERT INTO teacher_earnings ("teacherId", "courseId", title, "enrollCount", earnings, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("teacherId", "courseId") 
      DO UPDATE SET
        title = EXCLUDED.title,
        "enrollCount" = EXCLUDED."enrollCount",
        earnings = EXCLUDED.earnings,
        "updatedAt" = EXCLUDED."updatedAt"
      RETURNING *
    `;
    const values = [
      data.teacherId,
      data.courseId,
      data.title,
      data.enrollCount,
      data.earnings,
      data.updatedAt || new Date().toISOString()
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(teacherId: string, courseId: string) {
    const query = `
      DELETE FROM teacher_earnings 
      WHERE "teacherId" = $1 AND "courseId" = $2
      RETURNING *
    `;
    const result = await db.query(query, [teacherId, courseId]);
    return result.rows[0];
  }
}

export default TeacherEarningsModel;