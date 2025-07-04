import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";
import Course from "../models/courseModel";
import { calculateOverallProgress } from "../utils/utils";
import { mergeSections } from "../utils/utils";

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }
  try {
    const enrolledCourses = await UserCourseProgress.query("userId")
      .eq(userId)
      .exec();
    const courseIds = enrolledCourses.map((item: any) => item.courseId);
    const courses = await Course.batchGet(courseIds);

    res.status(200).json({
      success: true,
      message: "Enrolled courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: (error as Error).message,
    });
  }
};

export const getUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  try {
    const progress = await UserCourseProgress.get({ userId, courseId });

    res.status(200).json({
      success: true,
      message: "Course Progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving Course Progress",
      error: (error as Error).message,
    });
  }
};

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const progressData = req.body;

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      progress = new UserCourseProgress({
        userId,
        courseId,
        sections: progressData.sections || [],
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        lastAccessedTimestamp: new Date().toISOString(),
      });
    } else {
      // Merge existing sections with new sections
      progress.sections = mergeSections(
        progress.sections,
        progressData.sections || []
      );
      // Update last accessed timestamp
      progress.lastAccessedTimestamp = new Date().toISOString();
      // Update overall progress
      progress.overallProgress = calculateOverallProgress(progress.sections);
    }

    await progressData.save();

    res.status(200).json({
      success: true,
      message: "User course progress updated successfully",
      data: progressData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user course progress",
      error: (error as Error).message,
    });
  }
};
