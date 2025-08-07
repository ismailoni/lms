"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  BookOpen, 
  Clock, 
  Play,
  FileText,
  Download,
  Share2,
  Bookmark,
  Star,
  User,
  Trophy,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import VideoPlayer from "@/components/VideoPlayer";

// Type imports
type SectionProgress = {
  sectionId: string;
  chapters: ChapterProgress[];
};

type ChapterProgress = {
  chapterId: string;
  completed: boolean;
  lastAccessedAt?: string | null;
  timeSpent?: number;
};

const Course = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Notes");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  
  const {
    user,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    courseError,
    progressError,
    isChapterCompleted,
    updateChapterProgress,
  } = useCourseProgressData();

  // Enhanced navigation functions with router
  const navigateToChapter = (chapterId: string) => {
    router.push(`/user/courses/${course?.courseId}/chapters/${chapterId}`);
  };

  const getCurrentChapterIndex = () => {
    if (!course?.sections || !currentChapter) return { sectionIndex: -1, chapterIndex: -1 };
    
    for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex++) {
      const section = course.sections[sectionIndex];
      const chapterIndex = section.chapters.findIndex(ch => ch.chapterId === currentChapter.chapterId);
      if (chapterIndex !== -1) {
        return { sectionIndex, chapterIndex };
      }
    }
    return { sectionIndex: -1, chapterIndex: -1 };
  };

  const getNextChapter = () => {
    const { sectionIndex, chapterIndex } = getCurrentChapterIndex();
    if (sectionIndex === -1 || chapterIndex === -1) return null;

    const currentSectionChapters = course?.sections[sectionIndex]?.chapters;
    if (!currentSectionChapters) return null;

    // Try next chapter in current section
    if (chapterIndex < currentSectionChapters.length - 1) {
      return {
        section: course.sections[sectionIndex],
        chapter: currentSectionChapters[chapterIndex + 1]
      };
    }

    // Try first chapter of next section
    if (sectionIndex < course.sections.length - 1) {
      const nextSection = course.sections[sectionIndex + 1];
      return {
        section: nextSection,
        chapter: nextSection.chapters[0]
      };
    }

    return null;
  };

  const getPreviousChapter = () => {
    const { sectionIndex, chapterIndex } = getCurrentChapterIndex();
    if (sectionIndex === -1 || chapterIndex === -1) return null;

    // Try previous chapter in current section
    if (chapterIndex > 0) {
      return {
        section: course?.sections[sectionIndex],
        chapter: course?.sections[sectionIndex]?.chapters[chapterIndex - 1]
      };
    }

    // Try last chapter of previous section
    if (sectionIndex > 0) {
      const prevSection = course?.sections[sectionIndex - 1];
      return {
        section: prevSection,
        chapter: prevSection?.chapters[prevSection.chapters.length - 1]
      };
    }

    return null;
  };

  const handleMarkComplete = async () => {
    if (!currentSection || !currentChapter) return;
    
    const isCompleted = isChapterCompleted();
    await updateChapterProgress(
      currentSection.sectionId,
      currentChapter.chapterId,
      !isCompleted
    );
    
    toast.success(
      isCompleted ? "Chapter marked as incomplete" : "Chapter completed! 🎉",
      { duration: 2000 }
    );
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(
      isBookmarked ? "Bookmark removed" : "Chapter bookmarked!",
      { duration: 1500 }
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${course?.title} - ${currentChapter?.title}`,
        text: `Check out this chapter: ${currentChapter?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!", { duration: 1500 });
    }
  };

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    if (!course?.sections || !userProgress?.progressData?.sections) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;
    
    course.sections.forEach(section => {
      const sectionProgress = userProgress.progressData.sections.find((sp: SectionProgress) => sp.sectionId === section.sectionId);
      totalChapters += section.chapters.length;
      
      if (sectionProgress) {
        completedChapters += sectionProgress.chapters.filter((ch: ChapterProgress) => ch.completed).length;
      }
    });
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  }, [course?.sections, userProgress?.progressData?.sections]);

  useEffect(() => {
    setCompletionProgress(calculateProgress());
  }, [userProgress, course, calculateProgress]);

  console.log("currentChapter.video:", currentChapter);

  // interface PlayerRef {
  //   seekTo: (fraction: number, type?: 'seconds' | 'fraction') => void;
  //   getInternalPlayer: () => HTMLVideoElement | null;
  //   // Add other methods if needed
  // }

  // type Player = typeof ReactPlayer; // The component instance type

  // const playerRef = useRef<Player | null>(null);

  // const setPlayerRef = (player: Player | null) => {
  //   playerRef.current = player;
  // };

  


  // const handleProgress = ({ played }: { played: number }) => {
  //   if (
  //     played >= 0.8 &&
  //     !hasMarkedComplete &&
  //     currentChapter &&
  //     currentSection &&
  //     userProgress?.sections &&
  //     !isChapterCompleted()
  //   ) {
  //     setHasMarkedComplete(true);
  //     updateChapterProgress(
  //       currentSection.sectionId,
  //       currentChapter.chapterId,
  //       true
  //     );
  //   }
  // };

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view this course.</div>;
  
  if (courseError) {
    console.error("Course loading error:", courseError);
    return <div>Error loading course: {JSON.stringify(courseError)}</div>;
  }
  
  if (!course) return <div>Course not found</div>;

  // If userProgress has an error, log it but continue
  if (progressError) {
    console.error("Progress loading error:", progressError);
  }

  // If userProgress is not available, we can still show the course content
  // The progress functionality just won't be available until it loads
  console.log("Course loaded:", course);
  console.log("User progress:", userProgress);

  return (
    <div className="course min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-800">
      <div className="course__container max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Breadcrumb with Progress */}
        <div className="course__breadcrumb mb-8 bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-600/30 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="course__path text-sm text-gray-300 font-medium flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-full">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="hover:text-blue-400 cursor-pointer transition-colors">
                    {course.title}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="hover:text-blue-400 cursor-pointer transition-colors bg-gray-700/30 px-3 py-1.5 rounded-full">
                  {currentSection?.sectionTitle}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="course__current-chapter text-blue-400 font-semibold bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                  {currentChapter?.title}
                </span>
              </div>
              
              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className={`transition-all duration-300 hover:scale-105 ${
                    isBookmarked 
                      ? 'text-yellow-400 border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25' 
                      : 'border-gray-600 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="border-gray-600 hover:border-blue-400 hover:text-blue-400 transition-all duration-300 hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={handleMarkComplete}
                  className={`transition-all duration-300 hover:scale-105 shadow-lg ${
                    isChapterCompleted() 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/25' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                  }`}
                >
                  {isChapterCompleted() ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h1 className="course__title text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {currentChapter?.title}
              </h1>
              
              {/* Enhanced Course Progress */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    Course Progress
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Progress 
                        value={completionProgress} 
                        className="w-32 h-3 bg-gray-700 border border-gray-600" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {completionProgress}%
                    </span>
                    {completionProgress === 100 && (
                      <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Instructor Info */}
            <div className="course__header mt-8 flex items-center justify-between bg-gray-800/50 rounded-2xl p-6 border border-gray-600/30">
              <div className="course__instructor flex items-center gap-4">
                <div className="relative">
                  <Avatar className="course__avatar h-14 w-14 border-3 border-blue-400 shadow-lg shadow-blue-400/25">
                    <AvatarImage alt={course.teacherName} />
                    <AvatarFallback className="course__avatar-fallback bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {course.teacherName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="course__instructor-name font-bold text-xl text-white">
                      {course.teacherName}
                    </span>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                      <User className="w-3 h-3 mr-1" />
                      Instructor
                    </Badge>
                  </div>
                  <p className="text-gray-400 font-medium">Senior UX Designer</p>
                </div>
              </div>

              {/* Enhanced Chapter Meta */}
              <div className="flex items-center gap-8 text-sm text-gray-300">
                <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                  {currentChapter?.type === "Text" ? (
                    <FileText className="w-4 h-4 text-green-400" />
                  ) : (
                    <Play className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="font-medium">{currentChapter?.type === "Text" ? "Reading" : "Video"}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="font-medium">5 min</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">Chapter {getCurrentChapterIndex().chapterIndex + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Video Section */}
        <Card className="course__video mb-8 overflow-hidden bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg border-0 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <CardContent className="course__video-container p-0 relative z-10">
            {currentChapter?.video ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"></div>
                <VideoPlayer
                  src={currentChapter.video as string}
                  onProgress={(progress) => {
                    // Auto-mark complete when 90% watched
                    if (progress >= 0.9 && !isChapterCompleted()) {
                      handleMarkComplete();
                    }
                  }}
                  onComplete={() => {
                    // Mark as complete when video ends
                    if (!isChapterCompleted()) {
                      handleMarkComplete();
                    }
                  }}
                  className="rounded-lg overflow-hidden shadow-2xl"
                />
                {/* Video Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 rounded-lg pointer-events-none"></div>
              </div>
            ) : (
              <div className="course__no-video h-80 flex flex-col items-center justify-center bg-gradient-to-br from-gray-700/50 to-gray-600/50 text-gray-300 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Play className="w-12 h-12 text-blue-400" />
                  </div>
                  <p className="text-xl font-semibold mb-2">No video available for this chapter.</p>
                  <p className="text-gray-400">Check the notes section for content.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Tabs Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg border border-gray-600/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
              <CardContent className="p-0 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="course__tabs">
                  <div className="border-b border-gray-600/50 bg-gray-800/50 backdrop-blur-sm">
                    <TabsList className="course__tabs-list h-16 bg-transparent p-0 px-6 gap-8 w-full justify-start">
                      <TabsTrigger 
                        className="course__tab relative px-4 py-4 bg-transparent border-b-3 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 font-semibold transition-all duration-300 hover:text-blue-400 data-[state=active]:bg-blue-500/10 rounded-t-lg" 
                        value="Notes"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger 
                        className="course__tab relative px-4 py-4 bg-transparent border-b-3 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-400 font-semibold transition-all duration-300 hover:text-green-400 data-[state=active]:bg-green-500/10 rounded-t-lg" 
                        value="Resources"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Resources
                      </TabsTrigger>
                      <TabsTrigger 
                        className="course__tab relative px-4 py-4 bg-transparent border-b-3 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 font-semibold transition-all duration-300 hover:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-t-lg" 
                        value="Quiz"
                      >
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Quiz
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-8">
                    <TabsContent className="course__tab-content mt-0" value="Notes">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Chapter Notes
                          </h3>
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1">
                            <FileText className="w-3 h-3 mr-1" />
                            Study Material
                          </Badge>
                        </div>
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          {currentChapter?.content ? (
                            <div className="text-gray-300 leading-relaxed bg-gray-800/30 rounded-xl p-6 border border-gray-600/30">
                              {currentChapter.content}
                            </div>
                          ) : (
                            <div className="text-center py-16 text-gray-400">
                              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                <FileText className="w-10 h-10 text-blue-400" />
                              </div>
                              <p className="text-lg font-medium">No notes available for this chapter.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent className="course__tab-content mt-0" value="Resources">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                            Learning Resources
                          </h3>
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1">
                            <Download className="w-3 h-3 mr-1" />
                            Downloadable
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          {/* Enhanced Sample Resources */}
                          <div className="border border-gray-600/50 rounded-xl p-6 hover:bg-gray-700/20 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <FileText className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-lg">Chapter Slides</p>
                                  <p className="text-sm text-gray-400">PDF • 2.4 MB • High Quality</p>
                                </div>
                              </div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border border-gray-600/50 rounded-xl p-6 hover:bg-gray-700/20 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <FileText className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-lg">Exercise Files</p>
                                  <p className="text-sm text-gray-400">ZIP • 5.1 MB • Practice Materials</p>
                                </div>
                              </div>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent className="course__tab-content mt-0" value="Quiz">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Knowledge Check
                          </h3>
                          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Optional
                          </Badge>
                        </div>
                        <div className="text-center py-16 text-gray-400">
                          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                            <Lightbulb className="w-10 h-10 text-purple-400" />
                          </div>
                          <p className="text-lg font-medium mb-2">Quiz content coming soon!</p>
                          <p className="text-gray-500">Test your knowledge with interactive questions.</p>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Instructor Card */}
            <Card className="course__instructor-card bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg border border-gray-600/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
              <CardContent className="course__instructor-info p-8 relative z-10">
                <div className="course__instructor-header flex items-start gap-4 mb-6">
                  <div className="relative">
                    <Avatar className="course__instructor-avatar h-20 w-20 border-3 border-blue-400 shadow-xl shadow-blue-400/25">
                      <AvatarImage alt={course.teacherName} />
                      <AvatarFallback className="course__instructor-avatar-fallback bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {course.teacherName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-gray-800 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="course__instructor-name text-xl font-bold text-white">
                        {course.teacherName}
                      </h4>
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                        <User className="w-3 h-3 mr-1" />
                        Instructor
                      </Badge>
                    </div>
                    <p className="course__instructor-title text-gray-300 font-semibold mb-3">
                      Senior UX Designer
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-current text-yellow-500" />
                        <span className="font-medium">4.9 rating</span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">15+ courses</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="course__instructor-bio">
                  <p className="text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    A seasoned Senior UX Designer with over 15 years of experience
                    in creating intuitive and engaging digital experiences.
                    Expertise in leading UX design projects.
                  </p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-600/50">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Chapter Navigation */}
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg border border-gray-600/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
              <CardContent className="p-8 relative z-10">
                <h4 className="font-bold text-xl text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  Chapter Navigation
                </h4>
                
                <div className="space-y-4">
                  {getPreviousChapter() && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start p-4 h-auto border-gray-600/50 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 group"
                      onClick={() => {
                        const prev = getPreviousChapter();
                        if (prev?.chapter) {
                          navigateToChapter(prev.chapter.chapterId);
                        }
                      }}
                    >
                      <ChevronLeft className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                      <div className="text-left">
                        <div className="font-semibold text-white">Previous</div>
                        <div className="text-sm text-gray-400 truncate">
                          {getPreviousChapter()?.chapter?.title || 'Previous Chapter'}
                        </div>
                      </div>
                    </Button>
                  )}
                  
                  {getNextChapter() && (
                    <Button 
                      className="w-full justify-start p-4 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                      onClick={() => {
                        const next = getNextChapter();
                        if (next?.chapter) {
                          navigateToChapter(next.chapter.chapterId);
                        }
                      }}
                    >
                      <div className="text-left flex-1">
                        <div className="font-semibold">Next Chapter</div>
                        <div className="text-sm text-blue-100 truncate">
                          {getNextChapter()?.chapter?.title || 'Next Chapter'}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform duration-300" />
                    </Button>
                  )}
                  
                  {!getNextChapter() && (
                    <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-600/50 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500 animate-bounce" />
                      <p className="font-bold text-lg text-yellow-400">Course Complete!</p>
                      <p className="text-sm text-gray-300">You've finished all chapters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Study Progress */}
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg border border-gray-600/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
              <CardContent className="p-8 relative z-10">
                <h4 className="font-bold text-xl text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-400" />
                  </div>
                  Your Progress
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-300 font-medium">Course Completion</span>
                      <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {completionProgress}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={completionProgress} className="h-4 bg-gray-700 border border-gray-600" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
                    </div>
                  </div>
                  
                  {completionProgress === 100 && (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-3 text-green-300 mb-2">
                        <Trophy className="w-6 h-6 text-green-400" />
                        <span className="font-bold text-lg">Congratulations!</span>
                      </div>
                      <p className="text-sm text-green-200">
                        You've completed this course!
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600/50 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 hover:scale-105"
                    onClick={() => router.push(`/user/courses/${course.courseId}`)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Course Overview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;