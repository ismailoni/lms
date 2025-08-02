import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import { PrismaClient } from '@prisma/client';

import CourseModel from "../models/prisma/courseModel";
import TeacherEarningsModel from "../models/prisma/teacherEarningsModel";
import UserCourseProgressModel from "../models/prisma/userCourseProgressModel";
import TransactionModel from "../models/prisma/transactionModel";
import cloudinary from "../utils/cloudinary";

const prisma = new PrismaClient();

export const listCourses = async (req: Request, res: Response) => {
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

export const listTeacherCourses = async (req: Request, res: Response) => {
  try {
    const courses = await CourseModel.findByTeacherId();
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

export const getCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
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

export const createCourse = async (req: Request, res: Response) => {
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
      price: 0, // dollars
      level: "Beginner",
      status: "Draft",
    });

    // Create TeacherEarnings placeholder
    await TeacherEarningsModel.create({
      teacherId,
      courseId: newCourse.courseId,
      title: newCourse.title,
      enrollCount: 0,
      earnings: 0,
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

export const updateCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const updateData: any = { ...req.body };
  const { userId } = getAuth(req);

  try {
    console.log("Updating course:", courseId);
    console.log("Update data received:", updateData);
    console.log("User ID:", userId);

    const course = await CourseModel.findById(courseId);

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
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
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "image",
                folder: "course-images",
                transformation: [
                  { width: 1280, height: 720, crop: "fit" },
                  { quality: "auto", fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(req.file!.buffer);
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

    // Validate and keep price as float (no * 100 since DB stores dollars)
    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (isNaN(price) || price < 0) {
        res.status(400).json({ success: false, message: "Invalid price" });
        return;
      }
      updateData.price = price; // keep as dollars in DB
    }

    // Validate status field
    if (updateData.status !== undefined) {
      if (!["Draft", "Published"].includes(updateData.status)) {
        res.status(400).json({ success: false, message: "Invalid status. Must be 'Draft' or 'Published'" });
        return;
      }
    }

    // For draft courses, ensure required fields have defaults
    if (updateData.status === "Draft") {
      updateData.title = updateData.title || course.title || "Untitled Course";
      updateData.category = updateData.category || course.category || "Uncategorized";
      // description is optional in the schema, so we don't need to set a default
    }

    // For published courses, validate required fields
    if (updateData.status === "Published") {
      if (!updateData.title && !course.title) {
        res.status(400).json({ success: false, message: "Title is required for published courses" });
        return;
      }
      if (!updateData.category && !course.category) {
        res.status(400).json({ success: false, message: "Category is required for published courses" });
        return;
      }
    }

    console.log("Processed update data:", updateData);

    // FIXED: Handle sections update with proper transaction
    if (updateData.sections) {
      const sectionsData =
        typeof updateData.sections === "string"
          ? JSON.parse(updateData.sections)
          : updateData.sections;

      // Use transaction to update course and sections atomically
      const updatedCourse = await prisma.$transaction(async (tx) => {
        // First, delete existing sections and chapters
        await tx.chapter.deleteMany({
          where: {
            section: {
              courseId: courseId
            }
          }
        });

        await tx.section.deleteMany({
          where: { courseId: courseId }
        });

        // Update course data (excluding sections)
        const { sections: _, ...courseUpdateData } = updateData;
        const course = await tx.course.update({
          where: { courseId },
          data: courseUpdateData,
        });

        // Create new sections with chapters
        if (sectionsData && sectionsData.length > 0) {
          for (const sectionData of sectionsData) {
            const section = await tx.section.create({
              data: {
                sectionId: sectionData.sectionId || uuidv4(),
                courseId: courseId,
                sectionTitle: sectionData.sectionTitle,
                sectionDescription: sectionData.sectionDescription || "",
              }
            });

            // Create chapters for this section
            if (sectionData.chapters && sectionData.chapters.length > 0) {
              for (const chapterData of sectionData.chapters) {
                await tx.chapter.create({
                  data: {
                    chapterId: chapterData.chapterId || uuidv4(),
                    sectionId: section.sectionId,
                    title: chapterData.title,
                    content: chapterData.content || "",
                    type: chapterData.type || "Text",
                    video: chapterData.video || "",
                  }
                });
              }
            }
          }
        }

        // Return updated course with sections and chapters
        return await tx.course.findUnique({
          where: { courseId },
          include: {
            sections: {
              include: {
                chapters: true
              }
            }
          }
        });
      });

      // If title changed, sync TeacherEarnings title
      if (updateData.title) {
        const earningsRecord =
          await TeacherEarningsModel.findByTeacherIdAndCourseId(
            course.teacherId,
            course.courseId
          );

        if (earningsRecord) {
          await TeacherEarningsModel.update(course.teacherId, course.courseId, {
            title: updateData.title,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });

    } else {
      // Handle updates without sections changes
      const updatedCourse = await CourseModel.update(courseId, updateData);

      // If title changed, sync TeacherEarnings title
      if (updateData.title) {
        const earningsRecord =
          await TeacherEarningsModel.findByTeacherIdAndCourseId(
            course.teacherId,
            course.courseId
          );

        if (earningsRecord) {
          await TeacherEarningsModel.update(course.teacherId, course.courseId, {
            title: updateData.title,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });
    }

  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course",
      error: (error as Error).message,
    });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    console.log(`Attempting to delete course: ${courseId} by user: ${userId}`);

    const course = await CourseModel.findById(courseId);

    if (!course) {
      res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
      return;
    }

    // Check ownership
    if (course.teacherId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this course",
      });
      return;
    }

    // Check if course has enrollments
    const enrollmentCount = course.enrollments?.length || 0;
    if (enrollmentCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete course with ${enrollmentCount} enrolled students. Please contact support for assistance.`,
      });
      return;
    }

    // Use Prisma transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (tx) => {
      console.log("Starting deletion transaction...");

      // 1. Delete user course progress records
      const progressRecords = await tx.userCourseProgress.findMany({
        where: { courseId }
      });
      
      if (progressRecords.length > 0) {
        console.log(`Deleting ${progressRecords.length} progress records...`);
        await tx.userCourseProgress.deleteMany({
          where: { courseId }
        });
      }

      // 2. Delete transaction records
      const transactionRecords = await tx.transaction.findMany({
        where: { courseId }
      });
      
      if (transactionRecords.length > 0) {
        console.log(`Deleting ${transactionRecords.length} transaction records...`);
        await tx.transaction.deleteMany({
          where: { courseId }
        });
      }

      // 3. Delete teacher earnings records
      const earningsRecords = await tx.teacherEarnings.findMany({
        where: { 
          teacherId: course.teacherId,
          courseId: courseId 
        }
      });
      
      if (earningsRecords.length > 0) {
        console.log(`Deleting ${earningsRecords.length} earnings records...`);
        await tx.teacherEarnings.deleteMany({
          where: {
            teacherId: course.teacherId,
            courseId: courseId
          }
        });
      }

      // 4. Delete the course itself
      console.log("Deleting course...");
      await tx.course.delete({
        where: { courseId }
      });

      console.log("Course deletion transaction completed successfully");
    });

    // Optional: Delete associated media from Cloudinary
    try {
      if (course.image) {
        const publicId = extractPublicIdFromUrl(course.image);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted course image: ${publicId}`);
        }
      }

      // Delete course videos if they exist
      if (course.sections && Array.isArray(course.sections)) {
        for (const section of course.sections) {
          if (section.chapters && Array.isArray(section.chapters)) {
            for (const chapter of section.chapters) {
              if (chapter.video) {
                const videoPublicId = extractPublicIdFromUrl(chapter.video);
                if (videoPublicId) {
                  await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
                  console.log(`Deleted chapter video: ${videoPublicId}`);
                }
              }
            }
          }
        }
      }
    } catch (cloudinaryError) {
      console.warn("Warning: Could not delete some media files from Cloudinary:", cloudinaryError);
      // Don't fail the entire operation for media cleanup issues
    }

    res.status(200).json({
      success: true,
      message: "Course and all associated data deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting course:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        res.status(400).json({
          success: false,
          message: "Cannot delete course due to existing enrollments or transactions. Please contact support.",
          error: "Foreign key constraint violation"
        });
      } else if (error.message.includes('Record to delete does not exist')) {
        res.status(404).json({
          success: false,
          message: "Course not found or already deleted",
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error deleting course",
          error: error.message,
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: "Unknown error occurred while deleting course",
      });
    }
  }
};

export const getUploadVideoUrl = async (req: Request, res: Response) => {
  const { courseId, sectionId, chapterId } = req.params;
  const { fileName } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to upload videos for this course",
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `videos/${courseId}/${sectionId}/${chapterId}/${timestamp}_${fileName}`;

    const paramsToSign = {
      folder: "course-videos",
      public_id: publicId,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`;

    const uploadParams = {
      api_key: process.env.CLOUDINARY_API_KEY!,
      timestamp,
      signature,
      folder: "course-videos",
      public_id: publicId,
    };

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

// Helper function to extract Cloudinary public ID from URL
function extractPublicIdFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}
