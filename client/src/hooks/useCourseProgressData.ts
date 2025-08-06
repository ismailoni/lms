import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateChapterProgressMutation,
} from "@/state/api";
import { useUser } from "@clerk/nextjs";

export const useCourseProgressData = () => {
  const { courseId, chapterId } = useParams();
  const { user, isLoaded } = useUser();
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [updateChapterProgress] = useUpdateChapterProgressMutation();

  const { data: course, isLoading: courseLoading, error: courseError } = useGetCourseQuery(
    (courseId as string) ?? "",
    {
      skip: !courseId,
    }
  );

  const { data: userProgress, isLoading: progressLoading, error: progressError } =
    useGetUserCourseProgressQuery(
      {
        userId: user?.id ?? "",
        courseId: (courseId as string) ?? "",
      },
      {
        skip: !isLoaded || !user || !courseId,
      }
    );

  // Debug logging
  console.log("Course data:", { course, courseLoading, courseError });
  console.log("Progress data:", { userProgress, progressLoading, progressError });

  const isLoading = !isLoaded || courseLoading || progressLoading;

  const currentSection = course?.sections.find((s) =>
    s.chapters.some((c) => c.chapterId === chapterId)
  );

  const currentChapter = currentSection?.chapters.find(
    (c) => c.chapterId === chapterId
  );

  const isChapterCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.progressData?.sections)
      return false;

    const section = userProgress.progressData.sections.find(
      (s) => s.sectionId === currentSection.sectionId
    );
    return (
      section?.chapters.some(
        (c) => c.chapterId === currentChapter.chapterId && c.completed
      ) ?? false
    );
  };

  const updateChapterProgressHandler = (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => {
    if (!user) return;

    updateChapterProgress({
      userId: user.id,
      courseId: (courseId as string) ?? "",
      sectionId,
      chapterId,
      completed,
    });
  };

  return {
    user,
    courseId,
    chapterId,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    courseError,
    progressError,
    isChapterCompleted,
    updateChapterProgress: updateChapterProgressHandler,
    hasMarkedComplete,
    setHasMarkedComplete,
  };
};
