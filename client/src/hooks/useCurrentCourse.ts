import { useGetCourseQuery } from "@/state/api";
import { useSearchParams } from "next/navigation";

export const useCurrentCourse = () => {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id") ?? "";
  const { data: course, ...rest } = useGetCourseQuery(courseId);

  // if (!courseId) {
  //   return { course: null, isLoading: false, isError: true, courseId: null };
  // }

  return { course, courseId, ...rest };
};
