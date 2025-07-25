import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTransactionData {
  userId: string;
  dateTime: string;
  courseId: string;
  paymentProvider: 'stripe';
  amount?: number;
}

export class TransactionModel {
  static async findAll() {
    const transactions = await prisma.transaction.findMany({
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return transactions;
  }

  static async findByUserId(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return transactions;
  }

  static async findByCourseId(courseId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { courseId },
      include: {
        course: {
          select: {
            title: true,
            teacherName: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return transactions;
  }

  static async create(data: CreateTransactionData) {
    const transaction = await prisma.transaction.create({
      data: {
        userId: data.userId,
        dateTime: new Date(data.dateTime).toISOString(),
        courseId: data.courseId,
        paymentProvider: data.paymentProvider,
        amount: data.amount
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

    return transaction;
  }

  static async findById(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId },
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

    return transaction;
  }

  // Method to create transaction with specific transactionId (for compatibility)
  static async createWithId(transactionId: string, data: CreateTransactionData) {
    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        userId: data.userId,
        dateTime: new Date(data.dateTime).toISOString(),
        courseId: data.courseId,
        paymentProvider: data.paymentProvider,
        amount: data.amount
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

    return transaction;
  }
}

export default TransactionModel;