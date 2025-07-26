import { Request, Response } from "express";
import CourseModel from "../models/prisma/courseModel";
import TeacherEarningsModel from "../models/prisma/teacherEarningsModel";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import cloudinary from "../utils/cloudinary";

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;
  try {
    const courses = await CourseModel.findAll(category as string);

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
    const course = await CourseModel.findById(courseId);

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

    const newCourse = await CourseModel.create({
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
    });

    // 💥 Create a TeacherEarnings record automatically
    await TeacherEarningsModel.create({
      teacherId: teacherId,
      courseId: newCourse.courseId,
      title: newCourse.title,
      enrollCount: 0,
      earnings: 0
    });

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

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const updateData = { ...req.body };
  const { userId } = getAuth(req);

  try {
    const course = await CourseModel.findById(courseId);

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

    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "course-images",
              transformation: [
                { width: 1280, height: 720, crop: "fit" },
                { quality: "auto", fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(req.file!.buffer);
        });

        const uploadResult = (await uploadPromise) as any;
        updateData.image = uploadResult.secure_url;
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        res.status(500).json({
          success: false,
          message: "Error uploading image",
          error: (error as Error).message,
        });
        return;
      }
    } else if (updateData.imageUrl) {
      updateData.image = updateData.imageUrl;
      delete updateData.imageUrl;
    }

    // Validate and convert price
    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (isNaN(price) || price < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid price",
        });
        return;
      }
      updateData.price = price * 100;
    }

    // Handle sections
    if (updateData.sections) {
      const sectionsData =
        typeof updateData.sections === "string"
          ? JSON.parse(updateData.sections)
          : updateData.sections;

      updateData.sections = {
        deleteMany: {}, // Delete existing sections
        create: sectionsData.map((section: any) => ({
          sectionId: section.sectionId || uuidv4(),
          sectionTitle: section.sectionTitle,
          sectionDescription: section.sectionDescription,
          chapters: {
            create: section.chapters.map((chapter: any) => ({
              chapterId: chapter.chapterId || uuidv4(),
              title: chapter.title,
              content: chapter.content,
              type: chapter.type,
              video: chapter.video || "",
            })),
          },
        })),
      };
    }

    // Update the course
    const updatedCourse = await CourseModel.update(courseId, updateData);

    // If title changed, update TeacherEarnings title
    if (updateData.title) {
      const earningsRecord = await TeacherEarningsModel.findByTeacherIdAndCourseId(
        course.teacherId,
        course.courseId
      );

      if (earningsRecord) {
        await TeacherEarningsModel.update(course.teacherId, course.courseId, {
          title: updateData.title,
          // No updatedAt here — Prisma auto-updates it
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
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
    const course = await CourseModel.findById(courseId);

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

    // Delete the course (cascade will handle related records)
    await CourseModel.delete(courseId);

    // Delete corresponding TeacherEarnings record
    await TeacherEarningsModel.delete(course.teacherId, course.courseId);

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

export const getUploadVideoUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { fileName } = req.body;
  const { userId } = getAuth(req);

  try {
    // Verify course ownership
    const course = await CourseModel.findById(courseId);

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
        message: "You are not authorized to upload videos for this course",
      });
      return;
    }

    // Correct timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Unique public_id for video
    const publicId = `videos/${courseId}/${sectionId}/${chapterId}/${timestamp}_${fileName}`;

    // Parameters for signing (no resource_type)
    const paramsToSign = {
      folder: "course-videos",
      public_id: publicId,
      timestamp: timestamp,
    };

    // Generate Cloudinary signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    // Upload URL for videos
    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`;

    // Params to send back
    const uploadParams = {
      api_key: process.env.CLOUDINARY_API_KEY!,
      timestamp: timestamp,
      signature: signature,
      folder: "course-videos",
      public_id: publicId,
    };

    console.log("Generated upload params:", {
      timestamp,
      publicId,
      signature: signature.substring(0, 10) + "...",
    });

    res.status(200).json({
      success: true,
      message: "Video upload URL generated successfully",
      data: {
        uploadUrl,
        uploadParams,
        videoUrl: cloudinary.url(publicId, { resource_type: "video" }),
      },
    });
  } catch (error) {
    console.error("Error generating video upload URL:", error);
    res.status(500).json({
      success: false,
      message: "Error generating video upload URL",
      error: (error as Error).message,
    });
  }
};
