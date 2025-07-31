import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Pencil,
  Trash2,
  Users,
  DollarSign,
  BookOpen,
} from "lucide-react";

type ViewMode = "grid" | "list";

interface TeacherCourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => Promise<void>;
  isOwner: boolean;
  viewMode?: ViewMode; // Add this line
}

const TeacherCourseCard = ({
  course,
  onEdit,
  onDelete,
  isOwner,
  viewMode = "grid", // Default to grid view
}: TeacherCourseCardProps) => {
  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  const enrollmentCount = course.enrollments?.length || 0;

  // List view layout
  if (viewMode === "list") {
    return (
      <Card className="course-card-teacher-list group hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Course Image */}
            <div className="flex-shrink-0">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  width={80}
                  height={60}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-15 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {course.category || "Uncategorized"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {enrollmentCount} student{enrollmentCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatPrice(course.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  variant={
                    course.status === "Published" ? "default" : "secondary"
                  }
                  className={cn(
                    "ml-2",
                    course.status === "Published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  )}
                >
                  {course.status}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(course)}
                    className="gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(course)}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </>
              ) : (
                <span className="text-sm text-gray-500 italic">View Only</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view layout (default)
  return (
    <Card className="course-card-teacher group hover:shadow-lg transition-all duration-200">
      <CardHeader className="course-card-teacher__header p-0">
        {course.image ? (
          <div className="relative">
            <Image
              src={course.image}
              alt={course.title}
              width={370}
              height={200}
              className="course-card-teacher__image w-full h-48 object-cover rounded-t-lg"
            />
            {/* Status Badge Overlay */}
            <Badge
              variant={
                course.status === "Published" ? "default" : "secondary"
              }
              className={cn(
                "absolute top-3 right-3",
                course.status === "Published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              )}
            >
              {course.status}
            </Badge>
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center relative">
            <BookOpen className="w-12 h-12 text-gray-400" />
            <Badge
              variant={
                course.status === "Published" ? "default" : "secondary"
              }
              className={cn(
                "absolute top-3 right-3",
                course.status === "Published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              )}
            >
              {course.status}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="course-card-teacher__content p-4">
        <div className="space-y-3">
          {/* Title and Category */}
          <div>
            <CardTitle className="course-card-teacher__title text-lg font-semibold line-clamp-2 mb-1">
              {course.title}
            </CardTitle>
            <CardDescription className="course-card-teacher__category text-sm">
              {course.category || "Uncategorized"}
            </CardDescription>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {enrollmentCount} student{enrollmentCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatPrice(course.price)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isOwner ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="course-card-teacher__edit-button flex-1 gap-1"
                  onClick={() => onEdit(course)}
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="course-card-teacher__delete-button flex-1 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDelete(course)}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic text-center w-full py-2">
                View Only
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherCourseCard;
