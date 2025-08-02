import React, { useState } from "react";
import {
  Card,
  CardContent,
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
  Eye,
  BarChart3,
} from "lucide-react";

type ViewMode = "grid" | "list";

interface TeacherCourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  isOwner: boolean;
  viewMode?: ViewMode; // Add this line
  earnings?: number;
  enrollmentCount?: number; // Add this to override the course.enrollments count if needed
}

const TeacherCourseCard = ({
  course,
  onEdit,
  onDelete,
  isOwner,
  viewMode = "grid", // Default to grid view
  enrollmentCount,
}: TeacherCourseCardProps) => {
  // Use provided enrollmentCount or fall back to course.enrollments length
  const studentCount = enrollmentCount ?? course.enrollments?.length ?? 0;
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  // Calculate course statistics
  const sectionCount = course.sections?.length || 0;
  const chapterCount = course.sections?.reduce((acc, section) => acc + (section.chapters?.length || 0), 0) || 0;
  const estimatedEarnings = studentCount * (course.price || 0) / 100;

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
                  className="rounded-lg object-cover max-w-[80px] max-h-[60px]"
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
                        {studentCount} student{studentCount !== 1 ? "s" : ""}
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
    <Card 
      className="course-card-teacher group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 border border-gray-700/30 hover:border-blue-500/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="course-card-teacher__header p-0 relative overflow-hidden">
        {course.image ? (
          <div className="relative">
            <Image
              src={course.image}
              alt={course.title}
              width={370}
              height={200}
              className={`course-card-teacher__image w-full max-h-48 object-cover transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
            />
            
            {/* Overlay with analytics preview */}
            <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="text-center text-white space-y-2">
                <Eye className="w-8 h-8 mx-auto" />
                <p className="text-sm font-medium">Quick Analytics</p>
              </div>
            </div>

            {/* Status Badge Overlay */}
            <Badge
              variant={
                course.status === "Published" ? "default" : "secondary"
              }
              className={cn(
                "absolute top-3 right-3 font-semibold shadow-lg",
                course.status === "Published"
                  ? "bg-green-600 text-white border-green-500"
                  : "bg-yellow-600 text-white border-yellow-500"
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

      <CardContent className="course-card-teacher__content p-4 space-y-4">
        {/* Title and Category */}
        <div>
          <CardTitle className="course-card-teacher__title text-lg font-semibold line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
            {course.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            {course.category || "Uncategorized"}
          </Badge>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-medium">{studentCount}</span>
            <span className="text-xs">students</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="font-medium">{chapterCount}</span>
            <span className="text-xs">lessons</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">{formatPrice(course.price)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="font-medium">${estimatedEarnings.toFixed(0)}</span>
            <span className="text-xs">earned</span>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-700/50">
          {isOwner ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="course-card-teacher__edit-button flex-1 gap-1 bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-600/50 transition-all duration-300"
                onClick={() => onEdit(course)}
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="course-card-teacher__delete-button flex-1 gap-1 bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/20 hover:border-red-600/50 transition-all duration-300"
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
      </CardContent>
    </Card>
  );
};

export default TeacherCourseCard;
