import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

const TeacherCourseCard = ({
  course,
  onEdit,
  onDelete,
  isOwner,
}: TeacherCourseCardProps) => {
  return (
    <Card className="course-card-teacher group">
      <CardHeader className="course-card-teacher__header">
        {course.image && (
          <Image
            src={course.image}
            alt={course.title}
            width={370}
            height={200}
            className="course-card-teacher__image"
          />
        )}
      </CardHeader>

      <CardContent className="course-card-teacher__content">
        <div className="flex flex-col">
          <CardTitle className="course-card-teacher__title">
            {course.title}
          </CardTitle>

          <CardDescription className="course-card-teacher__category">
            {course.category || "Uncategorized"}
          </CardDescription>

          <p className="text-sm mb-2">
            Status:{" "}
            <span
              className={cn(
                "font-semibold px-2 py-1 rounded",
                course.status === "Published"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {course.status}
            </span>
          </p>
          {course.enrollments && (
            <p className="ml-1 mt-1 inline-block text-secondary bg-secondary/10 text-sm">
              <span className="font-bold text-white-100">
                {course.enrollments.length}
              </span>{" "}
              Student{course.enrollments.length !== 1 ? "s" : ""} Enrolled
            </p>
          )}
        </div>
        <div className="w-full flex flex-col sm:flex-row gap-2 mt-3">
          {isOwner ? (
            <>
              <Button
                variant="outline"
                className="course-card-teacher__edit-button flex-1"
                onClick={() => onEdit(course)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Course
              </Button>
              <Button
                variant="destructive"
                className="course-card-teacher__delete-button flex-1"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">View Only</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherCourseCard;
