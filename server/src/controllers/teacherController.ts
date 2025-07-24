// server/src/controllers/teacherController.ts
import { Request, Response } from "express";
import TeacherEarningsModel from "../models/prisma/teacherEarningsModel";

export const getTeacherEarningsFromTable = async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  try {
    const records = await TeacherEarningsModel.findByTeacherId(teacherId);

    const breakdown = records.map((r: any) => ({
      courseId: r.courseId,
      title: r.title,
      enrollCount: r.enrollCount || 0,
      earnings: r.earnings || 0,
    }));

    const totalEarnings = breakdown.reduce((sum: number, c: any) => sum + (c.earnings || 0), 0);

    res.json({ teacherId, breakdown, totalEarnings, currency: "USD" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch earnings", error: err });
  }
};
