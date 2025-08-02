import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import TransactionModel from "../models/prisma/transactionModel";
import TeacherEarningsModel from "../models/prisma/teacherEarningsModel";
import CourseModel from "../models/prisma/courseModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Utility function for sanitization
function cleanString(value: string): string {
  return value ? value.replace(/\0/g, "") : value;
}

// ---------------------------------
// Create Payment Intent
// ---------------------------------
export const createStripePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const course = await CourseModel.findById(courseId);
    if (!course || !course.price) {
      return res.status(404).json({ success: false, message: "Course not found or invalid price" });
    }

    // Check if user is already enrolled - enrollments is now String[]
    const enrollments = course.enrollments || [];
    if (enrollments.includes(userId)) {
      return res.status(409).json({ success: false, message: "Already enrolled in this course" });
    }

    const amountInCents = Math.round(course.price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { userId, courseId },
    });

    return res.status(200).json({
      success: true,
      message: "Payment intent created",
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return res.status(500).json({ success: false, message: "Failed to create payment intent" });
  }
};

// ---------------------------------
// Create Transaction
// ---------------------------------
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    let { courseId } = req.body;

    // Sanitize and validate inputs
    const safeUserId = cleanString(userId || "");
    courseId = cleanString(courseId || "");

    if (!safeUserId) {
      res.status(401).json({ success: false, message: "User authentication required" });
      return;
    }

    if (!courseId) {
      res.status(400).json({ success: false, message: "courseId is required" });
      return;
    }

    // Fetch and validate course
    const course = await CourseModel.findById(courseId);
    if (!course || !course.price) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Check if user is already enrolled (handle null enrollments)
    const enrollments = course.enrollments || []; // Handle null case
    if (enrollments.includes(safeUserId)) {
      res.status(409).json({ success: false, message: "Already enrolled in this course" });
      return;
    }

    // Check for existing transaction
    const existingTransaction = await TransactionModel.findByUserIdAndCourseId(safeUserId, courseId);
    if (existingTransaction) {
      res.status(409).json({ success: false, message: "Transaction already exists for this course" });
      return;
    }

    // Sanitize course fields
    course.title = cleanString(course.title);
    course.teacherName = cleanString(course.teacherName);
    course.teacherId = cleanString(course.teacherId);

    const amount = course.price;

    // Create transaction
    const transaction = await TransactionModel.create({
      userId: safeUserId,
      courseId,
      amount,
      paymentProvider: "stripe",
    });

    console.log("Transaction created successfully:", transaction);

    // Add user to course enrollments
    try {
      await CourseModel.addEnrollment(courseId, safeUserId);
      console.log("User added to course enrollments successfully");
    } catch (enrollmentError) {
      console.warn("Failed to add user to enrollments, but transaction succeeded:", enrollmentError);
    }

    // Update teacher earnings
    await updateTeacherEarnings(courseId, amount);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error creating transaction",
      error: (error as Error).message,
    });
  }
};

// ---------------------------------
// List Transactions
// ---------------------------------
export const listTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const transactions = userId
      ? await TransactionModel.findByUserId(userId as string)
      : await TransactionModel.findAll();

    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching transactions",
      error: (error as Error).message 
    });
  }
};

// ---------------------------------
// Helper: Update Teacher Earnings
// ---------------------------------
export async function updateTeacherEarnings(courseId: string, transactionAmount: number): Promise<void> {
  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      console.error(`Course not found: ${courseId}`);
      return;
    }

    const teacherId = course.teacherId;
    const teacherEarning = Math.round(transactionAmount * 0.7); // 70% to teacher, in cents

    // Get actual enrollment count from course.enrollments array
    const actualEnrollmentCount = course.enrollments?.length || 0;

    const existingEarnings = await TeacherEarningsModel.findByTeacherIdAndCourseId(teacherId, courseId);

    if (existingEarnings) {
      await TeacherEarningsModel.update(teacherId, courseId, {
        enrollCount: actualEnrollmentCount, // ← Use actual count from enrollments
        earnings: (existingEarnings.earnings || 0) + teacherEarning,
      });
      console.log(`Updated earnings for teacher ${teacherId}: enrollments=${actualEnrollmentCount}, +$${teacherEarning/100}`);
    } else {
      await TeacherEarningsModel.create({
        teacherId,
        courseId,
        title: course.title,
        enrollCount: actualEnrollmentCount, // ← Use actual count from enrollments
        earnings: teacherEarning,
      });
      console.log(`Created earnings record for teacher ${teacherId}: enrollments=${actualEnrollmentCount}, $${teacherEarning/100}`);
    }
  } catch (error) {
    console.error("Error updating teacher earnings:", error);
  }
}
