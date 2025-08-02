import { formatPrice } from "@/lib/utils";
import React from "react";
import Image from "next/image";
import AccordionSections from "./AccordionSections";
import { Users } from "lucide-react";

const CoursePreview = ({ course }: { course: Course }) => {
  const price = formatPrice(course.price);
  // enrollments is now String[] so we can directly access length
  const enrollmentCount = course.enrollments?.length || 0;

  return (
    <div className="course-preview">
      <div className="course-preview__container">
        <div className="course-preview__image-wrapper">
          <Image
            src={course.image || "/course-preview-placeholder.png"}
            alt={course.title}
            width={600}
            height={360}
            className="w-full"
          />
        </div>
        <div className="course-preview__details">
          <h2 className="course-preview__title">{course.title}</h2>
          <p className="text-gray-400 text-md mb-4">by {course.teacherName}</p>
          <p className="text-sm text-customgreys-dirtyGrey">{course.description}</p>
        </div>
        <div>
            <h4 className="text-white-50/90 font-semibold mb-2">
                Course Content
            </h4>
            <AccordionSections sections={course.sections} />
        </div>
      </div>
      <div className="course-preview__container">
        <h3 className="text-xl mb-4">Price Details (1 item)</h3>
        <div className="flex justify-between mb-4 text-customgreys-dirtyGrey text-base">
            <span className="font-bold">1x {course.title}</span>
            <span className="font-bold">{price}</span>
        </div>
        <div className="flex justify-between border-t border-customgreys-dirtyGrey pt-4">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="font-bold text-lg">{price}</span>
        </div>
      </div>
      <div className="course-preview__stats">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {enrollmentCount} student{enrollmentCount !== 1 ? 's' : ''} enrolled
          </span>
        </div>
        {/* ...other stats... */}
      </div>
    </div>
  );
};

export default CoursePreview;
