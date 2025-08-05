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

// ---------------------------------
// Create Initial Course Progress
// ---------------------------------
export const createInitialCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { courseId } = req.body;
    if (!courseId) {
      res.status(400).json({ success: false, message: "courseId is required" });
      return;
    }

    // Check if user is enrolled in the course
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const enrollments = course.enrollments || [];
    if (!enrollments.includes(userId)) {
      res.status(403).json({ 
        success: false, 
        message: "User is not enrolled in this course" 
      });
      return;
    }

    // Check if progress already exists
    const existingProgress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);
    if (existingProgress) {
      res.status(409).json({ 
        success: false, 
        message: "Course progress already exists for this user" 
      });
      return;
    }

    // Initialize progress data structure based on course sections and chapters
    const progressData: any = {
      sections: []
    };

    // Create progress structure for each section and chapter
    if (course.sections && course.sections.length > 0) {
      progressData.sections = course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters ? section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
          lastAccessedAt: null,
          timeSpent: 0 // in seconds
        })) : []
      }));
    }

    const currentTimestamp = new Date().toISOString();

    // Create initial course progress record
    const newProgress = await UserCourseProgressModel.create({
      userId,
      courseId,
      enrollmentDate: currentTimestamp,
      overallProgress: 0, // Start at 0% progress
      lastAccessedTimestamp: currentTimestamp,
      progressData
    });

    res.status(201).json({
      success: true,
      message: "Initial course progress created successfully",
      data: {
        progress: newProgress,
        sectionsInitialized: progressData.sections.length,
        chaptersInitialized: progressData.sections.reduce((total: number, section: any) => total + section.chapters.length, 0)
      }
    });

  } catch (error) {
    console.error("Error creating initial course progress:", error);
    res.status(500).json({
      success: false,
      message: "Error creating initial course progress",
      error: (error as Error).message,
    });
  }
};

// ---------------------------------
// Recalculate Overall Progress
// ---------------------------------
export const recalculateOverallProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { courseId } = req.params;
    if (!courseId) {
      res.status(400).json({ success: false, message: "courseId is required" });
      return;
    }

    // Get current progress
    const progress = await UserCourseProgressModel.findByUserIdAndCourseId(userId, courseId);
    if (!progress) {
      res.status(404).json({ success: false, message: "Course progress not found" });
      return;
    }

    // Calculate new overall progress
    const progressData = progress.progressData as any;
    const newOverallProgress = calculateOverallProgress(progressData?.sections || []);

    // Update the progress
    await UserCourseProgressModel.update(userId, courseId, {
      overallProgress: newOverallProgress,
      lastAccessedTimestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: "Overall progress recalculated successfully",
      data: {
        previousProgress: progress.overallProgress,
        newProgress: newOverallProgress,
        progressData: progressData
      }
    });

  } catch (error) {
    console.error("Error recalculating overall progress:", error);
    res.status(500).json({
      success: false,
      message: "Error recalculating overall progress",
      error: (error as Error).message,
    });
  }
};