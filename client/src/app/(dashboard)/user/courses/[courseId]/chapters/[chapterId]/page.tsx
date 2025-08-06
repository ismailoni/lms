"use client";

import { useState, useEffect, useCallback } from "react";
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

  // Enhanced navigation functions
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
    <div className="course min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="course__container max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Breadcrumb with Progress */}
        <div className="course__breadcrumb mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="course__path text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                {course.title}
              </span>
              <span className="mx-2">/</span>
              <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                {currentSection?.sectionTitle}
              </span>
              <span className="mx-2">/</span>
              <span className="course__current-chapter text-blue-600 dark:text-blue-400 font-semibold">
                {currentChapter?.title}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className={`transition-all ${isBookmarked ? 'text-yellow-600 border-yellow-300' : ''}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleMarkComplete}
                className={`transition-all ${
                  isChapterCompleted() 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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
            <h1 className="course__title text-3xl font-bold text-gray-900 dark:text-white">
              {currentChapter?.title}
            </h1>
            
            {/* Course Progress */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Course Progress
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={completionProgress} className="w-24 h-2" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {completionProgress}%
                  </span>
                  {completionProgress === 100 && (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Instructor Info */}
          <div className="course__header mt-6 flex items-center justify-between">
            <div className="course__instructor flex items-center gap-3">
              <Avatar className="course__avatar h-12 w-12 border-2 border-blue-200 dark:border-blue-700">
                <AvatarImage alt={course.teacherName} />
                <AvatarFallback className="course__avatar-fallback bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
                  {course.teacherName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="course__instructor-name font-semibold text-gray-900 dark:text-white">
                    {course.teacherName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Instructor
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Senior UX Designer</p>
              </div>
            </div>

            {/* Chapter Meta */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                {currentChapter?.type === "Text" ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{currentChapter?.type === "Text" ? "Reading" : "Video"}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>5 min</span>
              </div>

              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>Chapter {getCurrentChapterIndex().chapterIndex + 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Video Section */}
        <Card className="course__video mb-8 overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardContent className="course__video-container p-0 relative">
            {currentChapter?.video ? (
              <div className="relative group">
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
                  className="rounded-lg overflow-hidden"
                />
              </div>
            ) : (
              <div className="course__no-video h-64 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500">
                <Play className="w-16 h-16 mb-4 text-gray-400" />
                <p className="text-lg font-medium">No video available for this chapter.</p>
                <p className="text-sm text-gray-400 mt-1">Check the notes section for content.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Tabs Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="course__tabs">
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                    <TabsList className="course__tabs-list h-14 bg-transparent p-0 space-x-8">
                      <TabsTrigger 
                        className="course__tab relative px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-semibold" 
                        value="Notes"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger 
                        className="course__tab relative px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-semibold" 
                        value="Resources"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Resources
                      </TabsTrigger>
                      <TabsTrigger 
                        className="course__tab relative px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-semibold" 
                        value="Quiz"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Quiz
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent className="course__tab-content mt-0" value="Notes">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Chapter Notes
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Study Material
                          </Badge>
                        </div>
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          {currentChapter?.content ? (
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {currentChapter.content}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p>No notes available for this chapter.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent className="course__tab-content mt-0" value="Resources">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Learning Resources
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Downloadable
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {/* Sample Resources */}
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Chapter Slides</p>
                                  <p className="text-sm text-gray-500">PDF • 2.4 MB</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Exercise Files</p>
                                  <p className="text-sm text-gray-500">ZIP • 5.1 MB</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent className="course__tab-content mt-0" value="Quiz">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Knowledge Check
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        </div>
                        <div className="text-center py-12 text-gray-500">
                          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>Quiz content coming soon!</p>
                          <p className="text-sm text-gray-400 mt-1">Test your knowledge with interactive questions.</p>
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
            <Card className="course__instructor-card bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="course__instructor-info p-6">
                <div className="course__instructor-header flex items-start gap-4 mb-4">
                  <Avatar className="course__instructor-avatar h-16 w-16 border-2 border-blue-200 dark:border-blue-700">
                    <AvatarImage alt={course.teacherName} />
                    <AvatarFallback className="course__instructor-avatar-fallback bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xl font-bold">
                      {course.teacherName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="course__instructor-name text-lg font-semibold text-gray-900 dark:text-white">
                        {course.teacherName}
                      </h4>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <User className="w-3 h-3 mr-1" />
                        Instructor
                      </Badge>
                    </div>
                    <p className="course__instructor-title text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Senior UX Designer
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                        <span>4.9 rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>15+ courses</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="course__instructor-bio">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    A seasoned Senior UX Designer with over 15 years of experience
                    in creating intuitive and engaging digital experiences.
                    Expertise in leading UX design projects.
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chapter Navigation */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Chapter Navigation
                </h4>
                
                <div className="space-y-3">
                  {getPreviousChapter() && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const prev = getPreviousChapter();
                        if (prev?.chapter) {
                          window.location.href = `/user/courses/${course.courseId}/chapters/${prev.chapter.chapterId}`;
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Previous</div>
                        <div className="text-xs text-gray-500 truncate">
                          {getPreviousChapter()?.chapter?.title || 'Previous Chapter'}
                        </div>
                      </div>
                    </Button>
                  )}
                  
                  {getNextChapter() && (
                    <Button 
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        const next = getNextChapter();
                        if (next?.chapter) {
                          window.location.href = `/user/courses/${course.courseId}/chapters/${next.chapter.chapterId}`;
                        }
                      }}
                    >
                      <div className="text-left flex-1">
                        <div className="font-medium">Next Chapter</div>
                        <div className="text-xs text-blue-100 truncate">
                          {getNextChapter()?.chapter?.title || 'Next Chapter'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  
                  {!getNextChapter() && (
                    <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className="font-medium">Course Complete!</p>
                      <p className="text-xs">You&apos;ve finished all chapters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Progress */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Your Progress
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Course Completion</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {completionProgress}%
                      </span>
                    </div>
                    <Progress value={completionProgress} className="h-3" />
                  </div>
                  
                  {completionProgress === 100 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold text-sm">Congratulations!</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        You&apos;ve completed this course!
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = `/user/courses/${course.courseId}`}
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