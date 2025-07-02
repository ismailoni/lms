// server/src/controllers/teacherController.ts
import { Request, Response } from "express";
import TeacherEarnings from "../models/teacherEarningsModel";

export const getTeacherEarningsFromTable = async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  try {
    const records = await TeacherEarnings.query("teacherId").eq(teacherId).exec();

    const breakdown = records.map(r => ({
      courseId:   r.courseId,
      title:      r.title,
      enrollCount: r.enrollCount,
      earnings:   r.earnings,
    }));

    const totalEarnings = breakdown.reduce((sum, c) => sum + c.earnings, 0);

    res.json({ teacherId, breakdown, totalEarnings, currency: "USD" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch earnings", error: err });
  }
};
