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
  X,
  Menu,
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
  const [isHidden, setIsHidden] = useState(false);
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
      
      // Add keyboard shortcut for toggling sidebar (Ctrl+B)
      if (e.key === 'b' && e.ctrlKey) {
        e.preventDefault();
        setIsHidden(prev => !prev);
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
    <div className="relative">
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsHidden(!isHidden)}
        className={cn(
          "fixed top-4 z-50 p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-xl hover:scale-110 transition-all duration-300 border border-blue-500/30",
          isHidden ? "left-4" : "left-[20rem]"
        )}
        title={isHidden ? "Show sidebar (Ctrl+B)" : "Hide sidebar (Ctrl+B)"}
      >
        {isHidden ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <div className={cn(
        "transition-transform duration-500 ease-in-out",
        isHidden && "-translate-x-full"
      )}>
        <Sidebar 
          collapsible="none" 
          className="chapters-sidebar border-r border-gray-600/30 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl shadow-2xl"
          style={
            {
              "--sidebar-width": "22rem",
            } as React.CSSProperties
          }
        >
      {/* Enhanced Header with Glass Morphism */}
      <SidebarHeader className="p-8 bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-lg border-b border-gray-600/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30 shadow-lg">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent line-clamp-2">
                {course?.title}
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-medium">
                {course?.sections?.length || 0} sections • {totalChapters} chapters
              </p>
            </div>
          </div>
          
          {/* Enhanced Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Course Progress</span>
              <Badge 
                className={`px-3 py-1 font-bold transition-all duration-300 ${
                  overallProgress === 100 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-200'
                }`}
              >
                {Math.round(overallProgress)}%
              </Badge>
            </div>
            <div className="relative">
              <Progress 
                value={overallProgress} 
                className="h-3 bg-gray-700 border border-gray-600/50 shadow-inner"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">{completedTotal} of {totalChapters} completed</span>
              {overallProgress === 100 && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
                  <span className="text-yellow-400 font-bold">Complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>      {/* Enhanced Course Sections */}
      <SidebarContent className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-300 font-semibold text-sm uppercase tracking-wider px-6 py-4">
            Course Content
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <SidebarMenu className="space-y-3">
              {course?.sections?.map((section, index) => {
                const sectionProgress = userProgress?.progressData?.sections.find(s => s.sectionId === section.sectionId);
                const completedChapters = sectionProgress?.chapters.filter(c => c.completed).length ?? 0;
                const isExpanded = expandedSections.includes(section.sectionTitle);
                const isCompleted = completedChapters === section.chapters.length && section.chapters.length > 0;
                const sectionProgressPercentage = section.chapters.length > 0 ? (completedChapters / section.chapters.length) * 100 : 0;

                return (
                  <SidebarMenuItem key={section.sectionId}>
                    {/* Enhanced Section Header */}
                    <SidebarMenuButton
                      onClick={() => toggleSection(section.sectionTitle)}
                      // tooltip={`Section ${index + 1}: ${section.sectionTitle}`}
                      className={cn(
                        "p-5 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-600/50",
                        "bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm",
                        "hover:from-gray-700/70 hover:to-gray-600/70 hover:shadow-lg hover:scale-[1.02]",
                        isExpanded && "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 shadow-lg shadow-blue-500/10"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg",
                        isCompleted 
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/25" 
                          : "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-200"
                      )}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Section {index + 1}</p>
                          <span className="text-white font-semibold truncate text-base mt-1">{section.sectionTitle}</span>
                        </div>
                        <div className="mt-3 w-full">
                          <div className="relative">
                            <Progress 
                              value={sectionProgressPercentage} 
                              className="h-2 bg-gray-700 border border-gray-600/50 shadow-inner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <Badge 
                          className={cn(
                            "text-xs font-bold px-2 py-1 transition-all duration-300",
                            isCompleted 
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/25" 
                              : "bg-gradient-to-r from-gray-600 to-gray-500 text-gray-200 border-0"
                          )}
                        >
                          {completedChapters}/{section.chapters.length}
                        </Badge>
                        <div className="w-6 h-6 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-blue-400 transition-transform duration-300" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300 hover:text-blue-400" />
                          )}
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Enhanced Section Content - Chapters */}
                    {isExpanded && (
                      <SidebarMenuSub className="mt-4 mb-2">
                        {/* Enhanced Progress Visuals */}
                        <div className="px-4 py-4 space-y-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg mx-2 border border-gray-600/30 backdrop-blur-sm">
                          {/* Enhanced Progress Dots */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 flex gap-1.5">
                              {section.chapters.map((chapter) => {
                                const isChapterCompleted = sectionProgress?.chapters.find(c => c.chapterId === chapter.chapterId)?.completed ?? false;
                                return (
                                  <div
                                    key={chapter.chapterId}
                                    className={cn(
                                      "h-2.5 flex-1 rounded-full transition-all duration-500 relative overflow-hidden",
                                      isChapterCompleted 
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30" 
                                        : "bg-gray-700"
                                    )}
                                  >
                                    {isChapterCompleted && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Enhanced Trophy for completed sections */}
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden",
                              sectionProgressPercentage === 100 
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl shadow-yellow-500/40" 
                                : "bg-gray-700"
                            )}>
                              <Trophy className={cn(
                                "w-5 h-5 transition-all duration-300",
                                sectionProgressPercentage === 100 ? "text-white animate-bounce" : "text-gray-500"
                              )} />
                              {sectionProgressPercentage === 100 && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* Enhanced Progress Text */}
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              sectionProgressPercentage === 100 ? "text-green-400" : "text-gray-400"
                            )}>
                              {completedChapters}/{section.chapters.length} COMPLETED
                            </span>
                            <span className={cn(
                              "text-sm font-bold px-2 py-1 rounded-lg",
                              sectionProgressPercentage === 100 
                                ? "text-green-400 bg-green-400/10 border border-green-400/20" 
                                : "text-gray-400 bg-gray-700/50"
                            )}>
                              {Math.round(sectionProgressPercentage)}%
                            </span>
                          </div>
                        </div>

                        {/* Enhanced Chapter List */}
                        <div className="space-y-2 px-2">
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
                                    "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden border",
                                    "hover:scale-[1.02] hover:shadow-lg",
                                    isCurrentChapter && "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500/50 shadow-xl shadow-blue-500/20",
                                    isChapterCompleted && !isCurrentChapter && "bg-gradient-to-r from-green-600/15 to-emerald-600/15 border-green-500/30",
                                    !isChapterCompleted && !isCurrentChapter && "bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/30 hover:border-gray-500/50"
                                  )}
                                >
                                  {/* Enhanced Chapter Status Icon */}
                                  <div className="flex-shrink-0 relative">
                                    {isChapterCompleted ? (
                                      <div
                                        className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg shadow-green-500/25 group/icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChapterProgressUpdate(section.sectionId, chapter.chapterId, false, chapter.title);
                                        }}
                                        title="Mark as incomplete"
                                      >
                                        <CheckCircle className="w-5 h-5 text-white group-hover/icon:scale-110 transition-transform" />
                                      </div>
                                    ) : isCurrentChapter ? (
                                      <div 
                                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/25 group/icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChapterProgressUpdate(section.sectionId, chapter.chapterId, true, chapter.title);
                                        }}
                                        title="Mark as complete"
                                      >
                                        <Play className="w-4 h-4 text-white ml-0.5 group-hover/icon:scale-110 transition-transform" />
                                      </div>
                                    ) : (
                                      <div
                                        className="w-8 h-8 border-2 border-gray-600 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400 hover:border-green-500 hover:bg-green-500/10 hover:text-green-400 hover:scale-110 transition-all duration-300 cursor-pointer group/icon"
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
                                    {/* Pulse indicator for current chapter */}
                                    {isCurrentChapter && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                                    )}
                                  </div>

                                  {/* Enhanced Chapter Content */}
                                  <div className="flex-1 min-w-0 min-h-3">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "font-semibold text-sm transition-colors truncate",
                                          isCurrentChapter && "text-blue-400",
                                          isChapterCompleted && !isCurrentChapter && "text-green-400 line-through",
                                          !isChapterCompleted && !isCurrentChapter && "text-gray-200 group-hover:text-white"
                                        )}
                                      >
                                        {chapter.title}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                      {chapter.type === "Text" ? (
                                        <div className="flex items-center gap-1.5 text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                                          <FileText className="w-3 h-3 text-green-400" />
                                          <span className="text-xs font-medium">Reading</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                                          <Play className="w-3 h-3 text-blue-400" />
                                          <span className="text-xs font-medium">Video</span>
                                        </div>
                                      )}
                                      
                                      {/* Estimated time */}
                                      <div className="flex items-center gap-1.5 text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3 text-orange-400" />
                                        <span className="text-xs font-medium">5 min</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Enhanced Current Chapter Indicator */}
                                  {isCurrentChapter && (
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                      {/* Enhanced Quick Complete Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChapterProgressUpdate(section.sectionId, chapter.chapterId, !isChapterCompleted, chapter.title);
                                        }}
                                        className={cn(
                                          "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg",
                                          isChapterCompleted 
                                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-500/25" 
                                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/25"
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

                      </div>
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
      </div>
    </div>
  );
};

export default ChaptersSidebar;
