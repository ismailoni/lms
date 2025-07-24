import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import UserCourseProgressModel from "../models/prisma/userCourseProgressModel";
import CourseModel from "../models/prisma/courseModel";
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
    const enrolledCourses = await UserCourseProgressModel.findByUserId(userId);
    
    // Extract unique course data from the progress records
    const courses = enrolledCourses.map((progress: any) => ({
      courseId: progress.courseId,
      title: progress.course_title,
      teacherName: progress.teacherName,
      category: progress.category,
      overallProgress: progress.overallProgress,
      lastAccessedTimestamp: progress.lastAccessedTimestamp,
    }));

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
    const progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);

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
    let progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);

    if (!progress) {
      // Create new progress record
      progress = await UserCourseProgressModel.create({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        lastAccessedTimestamp: new Date().toISOString(),
      });

      // Create initial section and chapter progress structure if provided
      if (progressData.sections && progressData.sections.length > 0) {
        for (const sectionData of progressData.sections) {
          const sectionProgress = await UserCourseProgressModel.createSectionProgress(
            progress.id,
            sectionData.sectionId
          );

          if (sectionData.chapters && sectionData.chapters.length > 0) {
            for (const chapterData of sectionData.chapters) {
              await UserCourseProgressModel.createChapterProgress(
                sectionProgress.id,
                chapterData.chapterId,
                chapterData.completed || false
              );
            }
          }
        }
      }
    } else {
      // Update existing progress
      const updatedProgress = await UserCourseProgressModel.update(userId, courseId, {
        lastAccessedTimestamp: new Date().toISOString(),
        overallProgress: progressData.overallProgress || progress.overallProgress,
      });
      progress = updatedProgress;

      // Update individual chapter progress if provided
      if (progressData.sections && progressData.sections.length > 0) {
        for (const sectionData of progressData.sections) {
          if (sectionData.chapters && sectionData.chapters.length > 0) {
            for (const chapterData of sectionData.chapters) {
              // Find the section progress for this section
              const sectionProgress = progress.sectionProgress?.find(
                (sp: any) => sp.sectionId === sectionData.sectionId
              );
              
              if (sectionProgress) {
                await UserCourseProgressModel.updateChapterProgress(
                  chapterData.chapterId,
                  sectionProgress.id,
                  chapterData.completed
                );
              }
            }
          }
        }
      }
    }

    // Get updated progress with all related data
    const updatedProgress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);

    res.status(200).json({
      success: true,
      message: "User course progress updated successfully",
      data: updatedProgress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user course progress",
      error: (error as Error).message,
    });
  }
};
