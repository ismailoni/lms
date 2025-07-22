import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";

const ChaptersSidebar = () => {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const {
    user,
    course,
    userProgress,
    chapterId,
    courseId,
    isLoading,
    updateChapterProgress,
  } = useCourseProgressData();

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view course progress.</div>;
  if (!course || !userProgress) return <div>Error loading course content.</div>;

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const handleChapterClick = (sectionId: string, chapterId: string) => {
    router.push(`/user/courses/${courseId}/chapters/${chapterId}`, { scroll: false });
  };

  return (
    <div ref={sidebarRef} className="chapters-sidebar">
      <div className="chapters-sidebar__header">
        <h2 className="chapters-sidebar__title">{course.title}</h2>
        <hr className="chapters-sidebar__divider" />
      </div>

      {course.sections.map((section, index) => {
        const sectionProgress = userProgress.sections.find(s => s.sectionId === section.sectionId);
        const completedChapters = sectionProgress?.chapters.filter(c => c.completed).length ?? 0;

        return (
          <Section
            key={section.sectionId}
            section={section}
            index={index}
            chapterId={typeof chapterId === "string" ? chapterId : Array.isArray(chapterId) ? chapterId[0] ?? "" : ""}
            courseId={typeof courseId === "string" ? courseId : Array.isArray(courseId) ? courseId[0] ?? "" : ""}
            sectionProgress={sectionProgress}
            completedChapters={completedChapters}
            totalChapters={section.chapters.length}
            isExpanded={expandedSections.includes(section.sectionTitle)}
            toggleSection={toggleSection}
            handleChapterClick={handleChapterClick}
            updateChapterProgress={updateChapterProgress}
          />
        );
      })}
    </div>
  );
};

const Section = ({
  section,
  index,
  chapterId,
  sectionProgress,
  completedChapters,
  totalChapters,
  isExpanded,
  toggleSection,
  handleChapterClick,
  updateChapterProgress,
}: {
  section: {
    sectionId: string;
    sectionTitle: string;
    chapters: { chapterId: string; title: string; type: string }[];
  };
  index: number;
  chapterId: string;
  courseId: string;
  sectionProgress?: {
    sectionId: string;
    chapters: { chapterId: string; completed: boolean }[];
  };
  completedChapters: number;
  totalChapters: number;
  isExpanded: boolean;
  toggleSection: (sectionTitle: string) => void;
  handleChapterClick: (sectionId: string, chapterId: string) => void;
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void;
}) => {
  return (
    <div className="chapters-sidebar__section">
      <div
        onClick={() => toggleSection(section.sectionTitle)}
        className="chapters-sidebar__section-header"
      >
        <div className="chapters-sidebar__section-title-wrapper">
          <p className="chapters-sidebar__section-number">Section 0{index + 1}</p>
          {isExpanded ? (
            <ChevronUp className="chapters-sidebar__chevron" />
          ) : (
            <ChevronDown className="chapters-sidebar__chevron" />
          )}
        </div>
        <h3 className="chapters-sidebar__section-title">{section.sectionTitle}</h3>
      </div>
      <hr className="chapters-sidebar__divider" />

      {isExpanded && (
        <div className="chapters-sidebar__section-content">
          <ProgressVisuals
            chapters={section.chapters}
            sectionProgress={sectionProgress}
            completedChapters={completedChapters}
            totalChapters={totalChapters}
          />
          <ul className="chapters-sidebar__chapters">
            {section.chapters.map((chapter, idx) => {
              const chapterProgress = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId);
              const isCompleted = chapterProgress?.completed ?? false;
              const isCurrentChapter = chapterId === chapter.chapterId;

              return (
                <li
                  key={chapter.chapterId}
                  className={cn("chapters-sidebar__chapter", {
                    "chapters-sidebar__chapter--current": isCurrentChapter,
                  })}
                  onClick={() => handleChapterClick(section.sectionId, chapter.chapterId)}
                >
                  {isCompleted ? (
                    <div
                      className="chapters-sidebar__chapter-check"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateChapterProgress(section.sectionId, chapter.chapterId, !isCompleted);
                      }}
                      title="Toggle completion status"
                    >
                      <CheckCircle className="chapters-sidebar__check-icon" />
                    </div>
                  ) : (
                    <div
                      className={cn("chapters-sidebar__chapter-number", {
                        "chapters-sidebar__chapter-number--current": isCurrentChapter,
                      })}
                    >
                      {idx + 1}
                    </div>
                  )}

                  <span
                    className={cn("chapters-sidebar__chapter-title", {
                      "chapters-sidebar__chapter-title--completed": isCompleted,
                      "chapters-sidebar__chapter-title--current": isCurrentChapter,
                    })}
                  >
                    {chapter.title}
                  </span>

                  {chapter.type === "Text" && <FileText className="chapters-sidebar__text-icon" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <hr className="chapters-sidebar__divider" />
    </div>
  );
};

const ProgressVisuals = ({
  chapters,
  sectionProgress,
  completedChapters,
  totalChapters,
}: {
  chapters: { chapterId: string; title: string; type: string }[];
  sectionProgress?: {
    sectionId: string;
    chapters: { chapterId: string; completed: boolean }[];
  };
  completedChapters: number;
  totalChapters: number;
}) => {
  return (
    <>
      <div className="chapters-sidebar__progress">
        <div className="chapters-sidebar__progress-bars">
          {chapters.map((chapter) => {
            const isCompleted = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId)?.completed ?? false;
            return (
              <div
                key={chapter.chapterId}
                className={cn("chapters-sidebar__progress-bar", {
                  "chapters-sidebar__progress-bar--completed": isCompleted,
                })}
              />
            );
          })}
        </div>
        <div className="chapters-sidebar__trophy">
          <Trophy className="chapters-sidebar__trophy-icon" />
        </div>
      </div>
      <p className="chapters-sidebar__progress-text">
        {completedChapters}/{totalChapters} COMPLETED
      </p>
    </>
  );
};

export default ChaptersSidebar;
