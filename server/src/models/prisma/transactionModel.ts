import prisma from '../../utils/prisma';

export interface CreateTransactionData {
  userId: string;
  dateTime: string;
  courseId: string;
  paymentProvider: 'stripe';
  amount?: number;
}

export class TransactionModel {
  static async findAll() {
    return await prisma.transaction.findMany({
      include: {
        course: true
      }
    });
  }

  static async findByUserId(userId: string) {
    return await prisma.transaction.findMany({
      where: { userId },
      include: {
        course: true
      }
    });
  }

  static async findByCourseId(courseId: string) {
    return await prisma.transaction.findMany({
      where: { courseId },
      include: {
        course: true
      }
    });
  }

  static async create(data: CreateTransactionData) {
    return await prisma.transaction.create({
      data,
      include: {
        course: true
      }
    });
  }

  static async findById(transactionId: string) {
    return await prisma.transaction.findUnique({
      where: { transactionId },
      include: {
        course: true
      }
    });
  }
}

export default TransactionModel;