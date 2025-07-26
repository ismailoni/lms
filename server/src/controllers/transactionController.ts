import { Request, Response } from "express";
import TransactionModel from "../models/prisma/transactionModel";
import TeacherEarningsModel from "../models/prisma/teacherEarningsModel";
import CourseModel from "../models/prisma/courseModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactionData = req.body;
    
    // Create the transaction
    const transaction = await TransactionModel.create(transactionData);
    
    // Update teacher earnings automatically
    await updateTeacherEarnings(transactionData.courseId, transactionData.amount || 0);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating transaction",
      error: (error as Error).message,
    });
  }
};

export const listTransaction = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query;
  try {
    const transactions = userId 
      ? await TransactionModel.findByUserId(userId as string)
      : await TransactionModel.findAll();

    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: (error as Error).message,
    });
  }
};

// This should be in your server-side transaction controller
export const createStripePaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, courseId, userId } = req.body;

    console.log("Received payment intent request:", { amount, courseId, userId });

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      res.status(400).json({ success: false, message: "Amount must be a valid number" });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ success: false, message: "Amount must be greater than 0" });
      return;
    }

    if (!courseId || !userId) {
      res.status(400).json({ success: false, message: "courseId and userId are required" });
      return;
    }

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    console.log(`Converted amount to cents: ${amountInCents}`);

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { courseId, userId },
    });

    console.log("PaymentIntent created:", paymentIntent.id);

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: { clientSecret: paymentIntent.client_secret },
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment intent",
      error: (error as Error).message,
    });
  }
};


// Helper function to update teacher earnings
async function updateTeacherEarnings(courseId: string, transactionAmount: number): Promise<void> {
  try {
    // Get course details to find the teacher
    const course = await CourseModel.findById(courseId);
    
    if (!course) {
      console.error(`Course not found: ${courseId}`);
      return;
    }

    // Calculate teacher's 70% commission
    const teacherEarning = Math.round(transactionAmount * 0.7);
    
    // Check if teacher earnings record exists
    const existingEarnings = await TeacherEarningsModel.findByTeacherIdAndCourseId(
      course.teacherId, 
      courseId
    );
    
    if (existingEarnings) {
      // Update existing record
      await TeacherEarningsModel.update(course.teacherId, courseId, {
        enrollCount: (existingEarnings.enrollCount || 0) + 1,
        earnings: (existingEarnings.earnings || 0) + teacherEarning,
      });
      
      console.log(`Updated earnings for teacher ${course.teacherId}, course ${courseId}: +$${teacherEarning/100}`);
    } else {
      // Create new record
      await TeacherEarningsModel.create({
        teacherId: course.teacherId,
        courseId: courseId,
        title: course.title,
        enrollCount: 1,
        earnings: teacherEarning
      });
      
      console.log(`Created new earnings record for teacher ${course.teacherId}, course ${courseId}: $${teacherEarning/100}`);
    }
  } catch (error) {
    console.error('Error updating teacher earnings:', error);
    // Don't throw error - we don't want to fail the transaction if earnings update fails
  }
}

// Stripe webhook handler for production payments
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({
        success: false,
        message: "Missing stripe signature",
      });
      return;
    }

    const event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    console.log(`Received Stripe webhook: ${event.type}`);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { courseId, userId } = paymentIntent.metadata;
      
      if (!courseId || !userId) {
        console.error('Missing metadata in payment intent:', paymentIntent.metadata);
        res.status(400).json({
          success: false,
          message: "Missing courseId or userId in payment metadata",
        });
        return;
      }

      // Create transaction record
      const transactionData = {
        userId,
        courseId,
        amount: paymentIntent.amount / 100, // Convert back from cents
        dateTime: new Date().toISOString(),
        paymentProvider: 'stripe' as const
      };

      const transaction = await TransactionModel.create(transactionData);
      
      // Update teacher earnings automatically
      await updateTeacherEarnings(courseId, transactionData.amount);
      
      console.log(`Payment successful: ${paymentIntent.id}, Transaction created: ${transaction}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      message: "Webhook error",
      error: (error as Error).message,
    });
  }
};