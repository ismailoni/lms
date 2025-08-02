import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import UserCourseProgressModel from "../models/prisma/userCourseProgressModel";
import CourseModel from "../models/prisma/courseModel";
import { calculateOverallProgress } from "../utils/utils";

// Add interface for Course type
interface Course {
  courseId: string;
  title: string;
  teacherName: string;
  category: string;
  enrollments: string[];
  sections: any[];
  [key: string]: any;
}

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
    // Get enrolled courses from Course.enrollments (single source of truth)
    const enrolledCourses = await CourseModel.findEnrolledCoursesByUserId(userId);
    
    // Get progress data for each enrolled course
    const coursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course: Course) => { // FIXED: Added type annotation
        const progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, course.courseId);
        return {
          ...course,
          enrollments: course.enrollments || [], // Ensure it's an array
          sections: course.sections || [],       // Ensure it's an array
          progress: progress || {
            overallProgress: 0,
            enrollmentDate: new Date().toISOString(),
            lastAccessedTimestamp: new Date().toISOString()
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Enrolled courses retrieved successfully",
      data: coursesWithProgress,
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
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  try {
    // Check enrollment first
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // enrollments is now String[] so we can directly use includes()
    const enrollments = course.enrollments || [];
    if (!enrollments.includes(userId)) {
      res.status(403).json({ 
        success: false, 
        message: "User is not enrolled in this course" 
      });
      return;
    }

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
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  try {
    // Verify enrollment
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // enrollments is now String[] so we can directly use includes()
    const enrollments = course.enrollments || [];
    if (!enrollments.includes(userId)) {
      res.status(403).json({ 
        success: false, 
        message: "User is not enrolled in this course" 
      });
      return;
    }

    let progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);

    if (!progress) {
      // Create new progress record
      progress = await UserCourseProgressModel.create({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: progressData.overallProgress || 0,
        lastAccessedTimestamp: new Date().toISOString(),
        progressData: { sections: progressData.sections || [] },
      });
    } else {
      // Update existing progress
      if (progressData.sections && progressData.sections.length > 0) {
        for (const sectionData of progressData.sections) {
          if (sectionData.chapters && sectionData.chapters.length > 0) {
            for (const chapterData of sectionData.chapters) {
              await UserCourseProgressModel.updateChapterProgress(
                userId,
                courseId,
                sectionData.sectionId,
                chapterData.chapterId,
                chapterData.completed
              );
            }
          }
        }
      }

      // Update overall progress and timestamp
      await UserCourseProgressModel.update(userId, courseId, {
        lastAccessedTimestamp: new Date().toISOString(),
        overallProgress: progressData.overallProgress !== undefined 
          ? progressData.overallProgress 
          : progress.overallProgress,
      });
    }

    // Get updated progress
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

export const updateChapterProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, sectionId, chapterId } = req.params;
  const { completed } = req.body;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  try {
    // Verify enrollment
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // enrollments is now String[] so we can directly use includes()
    const enrollments = course.enrollments || [];
    if (!enrollments.includes(userId)) {
      res.status(403).json({ 
        success: false, 
        message: "User is not enrolled in this course" 
      });
      return;
    }

    await UserCourseProgressModel.updateChapterProgress(
      userId,
      courseId,
      sectionId,
      chapterId,
      completed
    );

    // Calculate and update overall progress
    const progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);
    
    if (progress && course) {
      const sectionsData = (course.sections as any[]) || [];
      const overallProgress = calculateOverallProgress(sectionsData);
      
      await UserCourseProgressModel.update(userId, courseId, {
        overallProgress,
        lastAccessedTimestamp: new Date().toISOString(),
      });
    }

    const updatedProgress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);

    res.status(200).json({
      success: true,
      message: "Chapter progress updated successfully",
      data: updatedProgress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating chapter progress",
      error: (error as Error).message,
    });
  }
};

export const checkCourseAccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // enrollments is now String[] so we can directly use includes()
    const enrollments = course.enrollments || [];
    const isEnrolled = enrollments.includes(userId);

    let progress = null;
    if (isEnrolled) {
      progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);
    }

    res.status(200).json({
      success: true,
      message: "Course access status retrieved successfully",
      data: {
        isEnrolled,
        hasProgress: !!progress,
        progress: progress || null,
        course: {
          courseId: course.courseId,
          title: course.title,
          sections: course.sections
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking course access",
      error: (error as Error).message,
    });
  }
};