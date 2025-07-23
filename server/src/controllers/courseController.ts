import { Request, Response } from "express";
import Course from "../models/courseModel";
import TeacherEarnings from "../models/teacherEarningsModel";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;
  try {
    const courses =
      category && category !== "all"
        ? await Course.scan("category").eq(category as string).exec()
        : await Course.scan().exec();

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: (error as Error).message,
    });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching course",
      error: (error as Error).message,
    });
  }
};

export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { teacherId, teacherName } = req.body;

    if (!teacherId || !teacherName) {
      res.status(400).json({
        success: false,
        message: "Teacher ID and name are required",
      });
      return;
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
      teacherName,
      teacherImage: "",
      title: "Untitled Course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      level: "Beginner",
      status: "Draft",
      sections: [],
      enrollments: [],
    });
    await newCourse.save();

    // 💥 Create a TeacherEarnings record automatically
    const newTeacherEarning = new TeacherEarnings({
      teacherId: teacherId,
      courseId: newCourse.courseId,
      title: newCourse.title,
      enrollCount: 0,
      earnings: 0,
      updatedAt: new Date().toISOString(),
    });
    await newTeacherEarning.save();

    res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating course",
      error: (error as Error).message,
    });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const updateData = { ...req.body };
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this course",
      });
      return;
    }

    if (updateData.price) {
      const price = parseInt(updateData.price);
      if (isNaN(price) || price < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid price",
        });
        return;
      }
      updateData.price = price * 100; // Convert to cents if needed
    }

    if (updateData.sections) {
      const sectionsData =
        typeof updateData.sections === "string"
          ? JSON.parse(updateData.sections)
          : updateData.sections;

      updateData.sections = sectionsData.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapterId: chapter.chapterId || uuidv4(),
        })),
      }));
    }

    // Handle image upload
    if (req.file) {
      // For now, we'll store the image as base64 or file path
      // In a production environment, you'd upload to S3/CloudFront and store the URL
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Update course
    Object.assign(course, updateData);
    await course.save();

    // Optionally update TeacherEarnings title if course title changed
    if (updateData.title) {
      const earningsRecord = await TeacherEarnings.get({
        teacherId: course.teacherId,
        courseId: course.courseId,
      });

      if (earningsRecord) {
        earningsRecord.title = updateData.title;
        earningsRecord.updatedAt = new Date().toISOString();
        await earningsRecord.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating course",
      error: (error as Error).message,
    });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this course",
      });
      return;
    }

    // Delete the course
    await Course.delete(courseId);

    // Delete corresponding TeacherEarnings record
    await TeacherEarnings.delete({
      teacherId: course.teacherId,
      courseId: course.courseId,
    });

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: (error as Error).message,
    });
  }
};
