import db from '../../utils/database';

export interface CreateTransactionData {
  userId: string;
  dateTime: string;
  courseId: string;
  paymentProvider: 'stripe';
  amount?: number;
}

export class TransactionModel {
  static async findAll() {
    const query = `
      SELECT t.*, c.title as course_title, c."teacherName", c.category
      FROM transactions t
      LEFT JOIN courses c ON t."courseId" = c."courseId"
      ORDER BY t."createdAt" DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findByUserId(userId: string) {
    const query = `
      SELECT t.*, c.title as course_title, c."teacherName", c.category
      FROM transactions t
      LEFT JOIN courses c ON t."courseId" = c."courseId"
      WHERE t."userId" = $1
      ORDER BY t."createdAt" DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findByCourseId(courseId: string) {
    const query = `
      SELECT t.*, c.title as course_title, c."teacherName", c.category
      FROM transactions t
      LEFT JOIN courses c ON t."courseId" = c."courseId"
      WHERE t."courseId" = $1
      ORDER BY t."createdAt" DESC
    `;
    const result = await db.query(query, [courseId]);
    return result.rows;
  }

  static async create(data: CreateTransactionData) {
    const query = `
      INSERT INTO transactions ("transactionId", "userId", "dateTime", "courseId", "paymentProvider", amount, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      data.userId,
      data.dateTime,
      data.courseId,
      data.paymentProvider,
      data.amount
    ];
    const result = await db.query(query, values);
    
    // Return with course info
    const transactionWithCourse = await this.findById(result.rows[0].transactionId);
    return transactionWithCourse;
  }

  static async findById(transactionId: string) {
    const query = `
      SELECT t.*, c.title as course_title, c."teacherName", c.category
      FROM transactions t
      LEFT JOIN courses c ON t."courseId" = c."courseId"
      WHERE t."transactionId" = $1
    `;
    const result = await db.query(query, [transactionId]);
    return result.rows[0];
  }

  // Method to create transaction with specific transactionId (for compatibility)
  static async createWithId(transactionId: string, data: CreateTransactionData) {
    const query = `
      INSERT INTO transactions ("transactionId", "userId", "dateTime", "courseId", "paymentProvider", amount, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      transactionId,
      data.userId,
      data.dateTime,
      data.courseId,
      data.paymentProvider,
      data.amount
    ];
    const result = await db.query(query, values);
    
    // Return with course info
    const transactionWithCourse = await this.findById(result.rows[0].transactionId);
    return transactionWithCourse;
  }
}

export default TransactionModel;