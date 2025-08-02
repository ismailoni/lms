import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  Trophy,
  Play,
  Clock,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  if (!userProgress) return <div>Error loading course content.</div>;

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

  // Calculate overall course progress
  const totalChapters = course?.sections?.reduce((total, section) => total + section.chapters.length, 0) ?? 0;
  const completedTotal = userProgress.sections.reduce((total, section) => 
    total + section.chapters.filter(c => c.completed).length, 0
  );
  const overallProgress = totalChapters > 0 ? (completedTotal / totalChapters) * 100 : 0;

  return (
    <div ref={sidebarRef} className="chapters-sidebar bg-customgreys-secondarybg border-r border-gray-700/50">
      {/* Enhanced Header */}
      <div className="chapters-sidebar__header p-6 bg-customgreys-primarybg border-b border-gray-700/50">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="chapters-sidebar__title text-lg font-semibold text-white line-clamp-2">
                {course?.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {course?.sections?.length || 0} sections • {totalChapters} chapters
              </p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Course Progress</span>
              <Badge 
                className={`${
                  overallProgress === 100 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {Math.round(overallProgress)}%
              </Badge>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-2 bg-gray-700"
            />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{completedTotal} of {totalChapters} completed</span>
              {overallProgress === 100 && <Trophy className="w-4 h-4 text-yellow-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sections */}
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {course?.sections?.map((section, index) => {
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
  const sectionProgress_percentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const isCompleted = completedChapters === totalChapters && totalChapters > 0;

  return (
    <div className="chapters-sidebar__section border-b border-gray-700/30">
      {/* Enhanced Section Header */}
      <div
        onClick={() => toggleSection(section.sectionTitle)}
        className={cn(
          "chapters-sidebar__section-header p-4 cursor-pointer transition-all duration-300 hover:bg-gray-700/30",
          isExpanded && "bg-gray-700/20"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              isCompleted 
                ? "bg-green-600 text-white" 
                : "bg-gray-700 text-gray-300"
            )}>
              {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Section {index + 1}</p>
              <h3 className="text-white font-medium">{section.sectionTitle}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isCompleted 
                  ? "border-green-600 text-green-400" 
                  : "border-gray-600 text-gray-400"
              )}
            >
              {completedChapters}/{totalChapters}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
            )}
          </div>
        </div>
        
        {/* Section Progress Bar */}
        <div className="mt-3">
          <Progress 
            value={sectionProgress_percentage} 
            className="h-1.5 bg-gray-700"
          />
        </div>
      </div>

      {/* Enhanced Section Content */}
      {isExpanded && (
        <div className="chapters-sidebar__section-content bg-customgreys-primarybg/50 p-4">
          <ProgressVisuals
            chapters={section.chapters}
            sectionProgress={sectionProgress}
            completedChapters={completedChapters}
            totalChapters={totalChapters}
          />
          
          {/* Enhanced Chapter List */}
          <div className="space-y-1 mt-4">
            {section.chapters.map((chapter, idx) => {
              const chapterProgress = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId);
              const isChapterCompleted = chapterProgress?.completed ?? false;
              const isCurrentChapter = chapterId === chapter.chapterId;

              return (
                <div
                  key={chapter.chapterId}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300",
                    "hover:bg-gray-700/30",
                    isCurrentChapter && "bg-blue-600/20 border border-blue-600/30 shadow-lg",
                    isChapterCompleted && !isCurrentChapter && "bg-green-600/10"
                  )}
                  onClick={() => handleChapterClick(section.sectionId, chapter.chapterId)}
                >
                  {/* Chapter Status Icon */}
                  <div className="flex-shrink-0">
                    {isChapterCompleted ? (
                      <div
                        className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateChapterProgress(section.sectionId, chapter.chapterId, !isChapterCompleted);
                        }}
                        title="Mark as incomplete"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : isCurrentChapter ? (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-gray-400 hover:border-gray-500 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateChapterProgress(section.sectionId, chapter.chapterId, !isChapterCompleted);
                        }}
                        title="Mark as complete"
                      >
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Chapter Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium text-sm transition-colors",
                          isCurrentChapter && "text-blue-400",
                          isChapterCompleted && !isCurrentChapter && "text-green-400 line-through",
                          !isChapterCompleted && !isCurrentChapter && "text-gray-300 group-hover:text-white"
                        )}
                      >
                        {chapter.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {chapter.type === "Text" ? (
                        <div className="flex items-center gap-1 text-gray-500">
                          <FileText className="w-3 h-3" />
                          <span className="text-xs">Reading</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Play className="w-3 h-3" />
                          <span className="text-xs">Video</span>
                        </div>
                      )}
                      
                      {/* Estimated time */}
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">5 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Chapter Indicator */}
                  {isCurrentChapter && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  sectionProgress?: SectionProgress;
  completedChapters: number;
  totalChapters: number;
}) => {
  const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  
  return (
    <div className="space-y-3">
      {/* Enhanced Progress Dots */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-1">
          {chapters.map((chapter) => {
            const isCompleted = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId)?.completed ?? false;
            return (
              <div
                key={chapter.chapterId}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300",
                  isCompleted 
                    ? "bg-green-500 shadow-lg shadow-green-500/30" 
                    : "bg-gray-700"
                )}
              />
            );
          })}
        </div>
        
        {/* Trophy for completed sections */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          progressPercentage === 100 
            ? "bg-yellow-500 shadow-lg shadow-yellow-500/30" 
            : "bg-gray-700"
        )}>
          <Trophy className={cn(
            "w-4 h-4 transition-colors",
            progressPercentage === 100 ? "text-white" : "text-gray-500"
          )} />
        </div>
      </div>
      
      {/* Progress Text with Enhanced Styling */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs font-medium uppercase tracking-wide",
          progressPercentage === 100 ? "text-green-400" : "text-gray-400"
        )}>
          {completedChapters}/{totalChapters} COMPLETED
        </span>
        <span className={cn(
          "text-xs font-semibold",
          progressPercentage === 100 ? "text-green-400" : "text-gray-400"
        )}>
          {Math.round(progressPercentage)}%
        </span>
      </div>
    </div>
  );
};

export default ChaptersSidebar;
