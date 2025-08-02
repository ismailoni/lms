import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Clock, Star, Users } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

const CourseCard = ({ course, onGoToCourse }: CourseCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const enrollmentCount = course.enrollments?.length || 0;
  const sectionCount = course.sections?.length || 0;
  const chapterCount = course.sections?.reduce((acc, section) => acc + (section.chapters?.length || 0), 0) || 0;

  return (
    <Card 
      className="course-card group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 border border-gray-700/30 hover:border-blue-500/30" 
      onClick={() => onGoToCourse(course)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="course-card__header relative overflow-hidden p-0">
        <div className="relative">
          {!imageLoaded && (
            <div className="w-full h-48 bg-gray-700/50 animate-pulse flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <Image
            src={course.image || "/placeholder.png"}
            alt={course.title}
            width={400}
            height={200}
            className={`course-card__image transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
            onLoad={() => setImageLoaded(true)}
            priority
          />
          
          {/* Overlay with play button */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 p-0">
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
          </div>

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={course.price === 0 ? "secondary" : "default"}
              className={`${course.price === 0 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'} font-semibold`}
            >
              {formatPrice(course.price)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="course-card__content p-4 space-y-3">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            {course.category}
          </Badge>
          
          <CardTitle className="course-card__title text-base font-semibold line-clamp-2 text-white group-hover:text-blue-400 transition-colors">
            {course.title}
          </CardTitle>
          
          {course.description && (
            <p className="text-sm text-gray-400 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        {/* Course stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{enrollmentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{chapterCount} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{sectionCount} sections</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
          <Avatar className="w-6 h-6 ring-2 ring-gray-700">
            <AvatarImage alt={course.teacherName} />
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {course.teacherName?.charAt(0) || 'T'}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-400 flex-1">
            {course.teacherName}
          </p>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-500">4.8</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
