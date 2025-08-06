import { useState, useEffect } from "react";
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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { toast } from "sonner";


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

  useEffect(() => {
    setOpen(false);
    
    // Add keyboard shortcut for marking current chapter as complete
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' && e.ctrlKey && course && userProgress) {
        e.preventDefault();
        const currentSection = course.sections.find((s) =>
          s.chapters.some((c) => c.chapterId === chapterId)
        );
        const currentChapter = currentSection?.chapters.find(
          (c) => c.chapterId === chapterId
        );
        
        if (currentSection && currentChapter) {
          const sectionProgress = userProgress.progressData?.sections.find(
            (s) => s.sectionId === currentSection.sectionId
          );
          const chapterProgress = sectionProgress?.chapters.find(
            (c) => c.chapterId === currentChapter.chapterId
          );
          const isCompleted = chapterProgress?.completed ?? false;
          
          handleChapterProgressUpdate(
            currentSection.sectionId, 
            currentChapter.chapterId, 
            !isCompleted, 
            currentChapter.title
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [chapterId, course, userProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view course progress.</div>;

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const handleChapterClick = (chapterId: string) => {
    router.push(`/user/courses/${courseId}/chapters/${chapterId}`, { scroll: false });
  };

  // Enhanced chapter progress handler with feedback
  const handleChapterProgressUpdate = (sectionId: string, chapterId: string, completed: boolean, chapterTitle?: string) => {
    updateChapterProgress(sectionId, chapterId, completed);
    
    // Show toast notification
    if (completed) {
      toast.success(`✓ Chapter completed: ${chapterTitle || 'Chapter'}`, {
        description: "Great progress! Keep it up!",
        duration: 3000,
      });
    } else {
      toast.info(`Chapter marked as incomplete: ${chapterTitle || 'Chapter'}`, {
        duration: 2000,
      });
    }
  };

  // Calculate overall course progress
  const totalChapters = course?.sections?.reduce((total, section) => total + section.chapters.length, 0) ?? 0;
  const completedTotal = userProgress?.progressData?.sections.reduce((total, section) => 
    total + section.chapters.filter(c => c.completed).length, 0
  );
  const overallProgress = totalChapters > 0 ? (completedTotal || 1 / totalChapters) * 100 : 0;

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-gray-700/50"
      style={
        {
          "--sidebar-width": "22rem",
        } as React.CSSProperties
      }
    >
      {/* Enhanced Header */}
      <SidebarHeader className="p-6 bg-customgreys-primarybg border-b border-gray-700/50">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <h2 className="text-lg font-semibold text-white line-clamp-2">
                {course?.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {course?.sections?.length || 0} sections • {totalChapters} chapters
              </p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2 group-data-[collapsible=icon]:hidden">
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

          {/* Collapsed Progress Indicator */}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2">
            <div className="w-8 h-1 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Course Sections */}
      <SidebarContent className="bg-customgreys-secondarybg">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 group-data-[collapsible=icon]:hidden">
            Course Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {course?.sections?.map((section, index) => {
                const sectionProgress = userProgress?.progressData?.sections.find(s => s.sectionId === section.sectionId);
                const completedChapters = sectionProgress?.chapters.filter(c => c.completed).length ?? 0;
                const isExpanded = expandedSections.includes(section.sectionTitle);
                const isCompleted = completedChapters === section.chapters.length && section.chapters.length > 0;
                const sectionProgressPercentage = section.chapters.length > 0 ? (completedChapters / section.chapters.length) * 100 : 0;

                return (
                  <SidebarMenuItem key={section.sectionId}>
                    {/* Section Header */}
                    <SidebarMenuButton
                      onClick={() => toggleSection(section.sectionTitle)}
                      tooltip={`Section ${index + 1}: ${section.sectionTitle}`}
                      className="p-4 hover:bg-gray-700/30 transition-all duration-300"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                        isCompleted 
                          ? "bg-green-600 text-white" 
                          : "bg-gray-700 text-gray-300"
                      )}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Section {index + 1}</p>
                          <span className="text-white font-medium truncate">{section.sectionTitle}</span>
                        </div>
                        <div className="mt-2 w-full">
                          <Progress 
                            value={sectionProgressPercentage} 
                            className="h-1.5 bg-gray-700"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            isCompleted 
                              ? "border-green-600 text-green-400" 
                              : "border-gray-600 text-gray-400"
                          )}
                        >
                          {completedChapters}/{section.chapters.length}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </SidebarMenuButton>

                    {/* Section Content - Chapters */}
                    {isExpanded && (
                      <SidebarMenuSub>
                        {/* Progress Visuals */}
                        <div className="px-2 py-3 space-y-3">
                          {/* Enhanced Progress Dots */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex gap-1">
                              {section.chapters.map((chapter) => {
                                const isChapterCompleted = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId)?.completed ?? false;
                                return (
                                  <div
                                    key={chapter.chapterId}
                                    className={cn(
                                      "h-2 flex-1 rounded-full transition-all duration-300",
                                      isChapterCompleted 
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
                              sectionProgressPercentage === 100 
                                ? "bg-yellow-500 shadow-lg shadow-yellow-500/30" 
                                : "bg-gray-700"
                            )}>
                              <Trophy className={cn(
                                "w-4 h-4 transition-colors",
                                sectionProgressPercentage === 100 ? "text-white" : "text-gray-500"
                              )} />
                            </div>
                          </div>
                          
                          {/* Progress Text */}
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs font-medium uppercase tracking-wide",
                              sectionProgressPercentage === 100 ? "text-green-400" : "text-gray-400"
                            )}>
                              {completedChapters}/{section.chapters.length} COMPLETED
                            </span>
                            <span className={cn(
                              "text-xs font-semibold",
                              sectionProgressPercentage === 100 ? "text-green-400" : "text-gray-400"
                            )}>
                              {Math.round(sectionProgressPercentage)}%
                            </span>
                          </div>
                        </div>

                        {/* Chapter List */}
                        {section.chapters.map((chapter, idx) => {
                          const chapterProgress = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId);
                          const isChapterCompleted = chapterProgress?.completed ?? false;
                          const isCurrentChapter = typeof chapterId === "string" 
                            ? chapterId === chapter.chapterId 
                            : Array.isArray(chapterId) 
                              ? chapterId[0] === chapter.chapterId 
                              : false;

                          return (
                            <SidebarMenuSubItem key={chapter.chapterId}>
                              <SidebarMenuSubButton
                                onClick={() => handleChapterClick(chapter.chapterId)}
                                isActive={isCurrentChapter}
                                className={cn(
                                  "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300",
                                  "hover:bg-gray-700/30",
                                  isCurrentChapter && "bg-blue-600/20 border border-blue-600/30 shadow-lg",
                                  isChapterCompleted && !isCurrentChapter && "bg-green-600/10"
                                )}
                              >
                                {/* Chapter Status Icon */}
                                <div className="flex-shrink-0">
                                  {isChapterCompleted ? (
                                    <div
                                      className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors group/icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChapterProgressUpdate(section.sectionId, chapter.chapterId, false, chapter.title);
                                      }}
                                      title="Mark as incomplete"
                                    >
                                      <CheckCircle className="w-4 h-4 text-white group-hover/icon:scale-110 transition-transform" />
                                    </div>
                                  ) : isCurrentChapter ? (
                                    <div 
                                      className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors group/icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChapterProgressUpdate(section.sectionId, chapter.chapterId, true, chapter.title);
                                      }}
                                      title="Mark as complete"
                                    >
                                      <Play className="w-3 h-3 text-white ml-0.5 group-hover/icon:scale-110 transition-transform" />
                                    </div>
                                  ) : (
                                    <div
                                      className="w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-gray-400 hover:border-green-500 hover:bg-green-500/10 hover:text-green-400 transition-all cursor-pointer group/icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChapterProgressUpdate(section.sectionId, chapter.chapterId, true, chapter.title);
                                      }}
                                      title="Mark as complete"
                                    >
                                      <span className="group-hover/icon:hidden">{idx + 1}</span>
                                      <CheckCircle className="w-4 h-4 hidden group-hover/icon:block" />
                                    </div>
                                  )}
                                </div>

                                {/* Chapter Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "font-medium text-sm transition-colors truncate",
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
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    {/* Quick Complete Button for Current Chapter */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChapterProgressUpdate(section.sectionId, chapter.chapterId, !isChapterCompleted, chapter.title);
                                      }}
                                      className={cn(
                                        "px-2 py-1 text-xs rounded-full transition-all hover:scale-105",
                                        isChapterCompleted 
                                          ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" 
                                          : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                                      )}
                                      title={isChapterCompleted ? "Mark as incomplete (Ctrl+C)" : "Mark as complete (Ctrl+C)"}
                                    >
                                      {isChapterCompleted ? "✓ Done" : "Mark Done"}
                                    </button>
                                  </div>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ChaptersSidebar;
