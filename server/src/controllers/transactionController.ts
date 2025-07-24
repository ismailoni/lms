import Stripe from "stripe";
import dotenv from "dotenv";
import { Request, Response } from "express";
import CourseModel from "../models/prisma/courseModel";
import TransactionModel from "../models/prisma/transactionModel";
import UserCourseProgressModel from "../models/prisma/userCourseProgressModel";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("No Stripe secret key found");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const listTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  try {
    const transactions = userId
      ? await TransactionModel.findByUserId(userId as string)
      : await TransactionModel.findAll();

    res.json({
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving transactions", error });
  }
};

export const createStripePaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  let { amount } = req.body;

  if (!amount || amount <= 0) {
    amount = 50;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });
    res.json({
      message: "",
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating payment intent", error });
  }
};

export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, transactionId, amount, paymentProvider } = req.body;

  try {
    //1. get course info
    const course = await CourseModel.findById(courseId);
    
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    //2. create transaction record
    const newTransaction = await TransactionModel.createWithId(transactionId, {
      dateTime: new Date().toISOString(),
      userId,
      courseId,
      amount,
      paymentProvider,
    });

    //3. create initial course progress
    const initialProgress = await UserCourseProgressModel.create({
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      lastAccessedTimestamp: new Date().toISOString(),
    });

    // Create section and chapter progress structure
    if (course.sections && course.sections.length > 0) {
      for (const section of course.sections) {
        const sectionProgress = await UserCourseProgressModel.createSectionProgress(
          initialProgress.id,
          section.sectionId
        );

        if (section.chapters && section.chapters.length > 0) {
          for (const chapter of section.chapters) {
            await UserCourseProgressModel.createChapterProgress(
              sectionProgress.id,
              chapter.chapterId,
              false
            );
          }
        }
      }
    }

    //4. add enrollment to relevant course
    await CourseModel.addEnrollment(courseId, userId);

    res.json({
      message: "Purchased Course Successfully",
      data: {
        transaction: newTransaction,
        courseProgress: initialProgress,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating transaction and enrollment", error });
  }
};
