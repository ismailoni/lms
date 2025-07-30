import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface CreateTransactionData {
  userId: string;
  courseId: string;
  paymentProvider: 'stripe';
  amount: number;
}

// Extremely simple sanitization - only keep safe characters
function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  const cleaned = value.replace(/[^a-zA-Z0-9\-_]/g, '');
  console.log(`Sanitized: "${value}" -> "${cleaned}"`);
  return cleaned;
}

export class TransactionModel {
  static async findAll() {
    return prisma.transaction.findMany({
      include: {
        course: { select: { title: true, teacherName: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findByUserId(userId: string) {
    const cleanUserId = sanitizeString(userId);
    console.log('Finding transactions for userId:', cleanUserId);
    
    return prisma.transaction.findMany({
      where: { userId: cleanUserId },
      include: {
        course: { select: { title: true, teacherName: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findByUserIdAndCourseId(userId: string, courseId: string) {
    const cleanUserId = sanitizeString(userId);
    const cleanCourseId = sanitizeString(courseId);
    
    return prisma.transaction.findFirst({ 
      where: { 
        userId: cleanUserId, 
        courseId: cleanCourseId 
      } 
    });
  }

  static async createSimpleTest() {
    console.log("Creating hardcoded test transaction...");
    const payload = {
      userId: "testuser123",
      courseId: "testcourse123",
      paymentProvider: "stripe" as const,
      amount: 99.99,
    };
    console.log("Hardcoded test payload:", payload);
    return prisma.transaction.create({ data: payload });
  }

  static async create(data: CreateTransactionData) {
    const cleanUserId = sanitizeString(data.userId);
    const cleanCourseId = sanitizeString(data.courseId);
    
    console.log('Sanitization results:', { 
      original: { userId: data.userId, courseId: data.courseId },
      cleaned: { userId: cleanUserId, courseId: cleanCourseId }
    });
    
    if (!cleanUserId || cleanUserId.length < 3) {
      throw new Error(`Invalid userId: "${data.userId}" -> "${cleanUserId}"`);
    }
    
    if (!cleanCourseId || cleanCourseId.length < 3) {
      throw new Error(`Invalid courseId: "${data.courseId}" -> "${cleanCourseId}"`);
    }

    const payload = {
      userId: cleanUserId,
      courseId: cleanCourseId,
      paymentProvider: data.paymentProvider,
      amount: Number(data.amount),
    };

    console.log("Final create payload:", payload);

    // Simple create without complex transaction
    const transaction = await prisma.transaction.create({
      data: payload,
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
