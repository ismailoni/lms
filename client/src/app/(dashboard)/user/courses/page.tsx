"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useGetUserEnrolledCoursesQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  Clock,
  Play,
  CheckCircle2,
  Trophy,
  ExternalLink,
  Sparkles,
  AlertCircle,
  BarChart3,
  BookmarkCheck,
  Flame,
  Plus,
} from "lucide-react";
import Loading from "@/components/Loading";
import Image from "next/image";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "progress" | "alphabetical" | "newest";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories", icon: "📚" },
  { value: "web-development", label: "Web Development", icon: "💻" },
  { value: "mobile-development", label: "Mobile Development", icon: "📱" },
  { value: "data-science", label: "Data Science", icon: "📊" },
  { value: "design", label: "Design", icon: "🎨" },
  { value: "business", label: "Business", icon: "💼" },
  { value: "marketing", label: "Marketing", icon: "📈" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Accessed" },
  { value: "progress", label: "By Progress" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "newest", label: "Newest First" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
  }),
};

const Courses = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [progressData, setProgressData] = useState<Record<string, UserCourseProgress>>({});
  const [progressLoading, setProgressLoading] = useState(false);

  const {
    data: courses,
    isLoading,
    isError,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  });

  // Fetch progress data for all enrolled courses
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!courses || !user?.id || courses.length === 0) {
        setProgressData({});
        return;
      }

      setProgressLoading(true);
      const progressPromises = courses.map(async (course) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001"}/${user.id}/courses/${course.courseId}`,
            {
              headers: {
                'Authorization': `Bearer ${await window.Clerk?.session?.getToken()}`,
              },
            }
          );
          
          if (response.ok) {
            const progressResult = await response.json();
            // Handle the API response structure: {success, message, data}
            const actualProgress = progressResult.data || progressResult;
            console.log(`Progress for ${course.title}:`, actualProgress);
            return {
              courseId: course.courseId,
              progress: actualProgress,
            };
          } else {
            console.warn(`Failed to fetch progress for course ${course.courseId}: ${response.status}`);
          }
          return {
            courseId: course.courseId,
            progress: null,
          };
        } catch (error) {
          console.error(`Failed to fetch progress for course ${course.courseId}:`, error);
          return {
            courseId: course.courseId,
            progress: null,
          };
        }
      });

      try {
        const results = await Promise.all(progressPromises);
        const newProgressData: Record<string, UserCourseProgress> = {};
        
        results.forEach(({ courseId, progress }) => {
          if (progress) {
            newProgressData[courseId] = progress;
          }
        });
        
        setProgressData(newProgressData);
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgressData();
  }, [courses, user?.id]);

  // Calculate actual course progress from progress data
  const getCourseProgress = useCallback((course: Course) => {
    const courseProgress = progressData[course.courseId];
    
    if (!courseProgress) return 0;
    
    // First try to calculate based on actual progress data
    if (courseProgress.progressData?.sections && course.sections) {
      let totalChapters = 0;
      let completedChapters = 0;
      
      course.sections.forEach(section => {
        if (section.chapters) {
          totalChapters += section.chapters.length;
          const sectionProgress = courseProgress.progressData?.sections?.find(
            (s: SectionProgress) => s.sectionId === section.sectionId
          );
          if (sectionProgress?.chapters) {
            completedChapters += sectionProgress.chapters.filter(
              (c: ChapterProgress) => c.completed
            ).length;
          }
        }
      });
      
      const calculatedProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
      
      // Use calculated progress if it's different from overallProgress or if overallProgress is 0
      if (calculatedProgress > 0 && (calculatedProgress !== courseProgress.overallProgress || courseProgress.overallProgress === 0)) {
        return calculatedProgress;
      }
    }
    
    // Fall back to overallProgress if available and non-zero
    if (typeof courseProgress.overallProgress === 'number' && courseProgress.overallProgress > 0) {
      return Math.round(courseProgress.overallProgress);
    }
    
    return 0;
  }, [progressData]);

  // Enhanced filtering and sorting
  const { filteredCourses, stats } = useMemo(() => {
    if (!courses) return { filteredCourses: [], stats: null };

    const filtered = courses.filter((course) => {
      const title = course.title || "";
      const category = course.category || "";

      const matchesSearch = title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || category === selectedCategory;

      // Tab filtering
      if (activeTab === "in-progress") {
        const progress = getCourseProgress(course);
        return (
          matchesSearch &&
          matchesCategory &&
          progress > 0 &&
          progress < 100
        );
      } else if (activeTab === "completed") {
        const progress = getCourseProgress(course);
        return matchesSearch && matchesCategory && progress >= 100;
      }

      return matchesSearch && matchesCategory;
    });

    // Calculate stats with real progress data
    const totalCourses = courses.length;
    
    const progressStats = courses.map(course => ({
      course,
      progress: getCourseProgress(course)
    }));
    
    const inProgressCourses = progressStats.filter(
      ({ progress }) => progress > 0 && progress < 100
    ).length;
    
    const completedCourses = progressStats.filter(
      ({ progress }) => progress >= 100
    ).length;
    
    const totalHours = courses.reduce((acc, course) => {
      // Calculate estimated hours based on course content
      const chaptersCount = course.sections?.reduce(
        (total, section) => total + (section.chapters?.length || 0), 0
      ) || 0;
      // Estimate: 0.5 hours per chapter
      return acc + (chaptersCount * 0.5);
    }, 0);

    return {
      filteredCourses: filtered,
      stats: {
        totalCourses,
        inProgressCourses,
        completedCourses,
        totalHours,
      },
    };
  }, [courses, searchTerm, selectedCategory, activeTab, getCourseProgress]);

  const handleGoToCourse = (course: Course) => {
    if (
      course.sections &&
      course.sections.length > 0 &&
      course.sections[0].chapters.length > 0
    ) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(
        `/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
        {
          scroll: false,
        }
      );
    } else {
      router.push(`/user/courses/${course.courseId}`, {
        scroll: false,
      });
    }
  };

  const renderCourseCard = (course: Course, index: number) => {
    const progress = getCourseProgress(course);
    const isCompleted = progress === 100;
    const chaptersCount =
      course.sections?.reduce(
        (acc, section) => acc + section.chapters.length,
        0
      ) || 0;

    // Get detailed progress info for better UX
    const courseProgressData = progressData[course.courseId];
    const completedChaptersCount = courseProgressData?.progressData?.sections?.reduce(
      (acc, section) => acc + (section.chapters?.filter(ch => ch.completed).length || 0), 0
    ) || 0;

    if (viewMode === "list") {
      return (
        <motion.div
          key={course.courseId}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-customgreys-primarybg border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Course Image */}
                <div className="relative flex-shrink-0">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={80}
                      height={60}
                      className="w-20 h-15 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-20 h-15 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg ring-2 ring-green-400/30">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {course.teacherName} • {chaptersCount} chapters
                      </p>
                    </div>
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className={`ml-2 ${
                        isCompleted 
                          ? 'bg-green-600 text-white border-green-500' 
                          : 'bg-gray-700 text-gray-300 border-gray-600'
                      }`}
                    >
                      {isCompleted ? "Completed" : `${progress}%`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Progress 
                      value={progress} 
                      className="h-2 bg-gray-700"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{progress}% completed</span>
                      <span>{completedChaptersCount}/{chaptersCount} chapters</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleGoToCourse(course)}
                  className={`gap-2 group-hover:shadow-lg transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <Trophy className="w-4 h-4" />
                      Review
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Continue
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    // Grid view
    return (
      <motion.div
        key={course.courseId}
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="group bg-customgreys-primarybg border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1">
          <div className="relative">
            {course.image ? (
              <Image
                src={course.image}
                alt={course.title}
                width={400}
                height={192}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-700 transition-colors duration-300">
                <BookOpen className="w-12 h-12 text-blue-400" />
              </div>
            )}

            {/* Enhanced Progress Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
              <Progress 
                value={progress} 
                className="h-2 bg-gray-600/50"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-200">
                <span>{progress}% complete</span>
                <span className="bg-black/50 px-2 py-1 rounded">{chaptersCount} chapters</span>
              </div>
            </div>

            {/* Enhanced Completion Badge */}
            {isCompleted && (
              <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2 shadow-lg ring-2 ring-green-400/30 animate-pulse">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <CardContent className="p-4 bg-customgreys-primarybg">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 text-white group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {course.teacherName}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>{chaptersCount} chapters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>~8h</span>
                  </div>
                </div>
                <Badge 
                  variant={isCompleted ? "default" : "secondary"}
                  className={`${
                    isCompleted 
                      ? 'bg-green-600 text-white border-green-500' 
                      : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {progress}%
                </Badge>
              </div>

              <Button
                onClick={() => handleGoToCourse(course)}
                className={`w-full gap-2 group-hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                variant={isCompleted ? "outline" : "default"}
              >
                {isCompleted ? (
                  <>
                    <Trophy className="w-4 h-4" />
                    Review Course
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Continue Learning
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Loading State
  if (!isLoaded || isLoading || progressLoading) {
    return (
      <Loading />
    );
  }

  // Error or No User State
  if (!user) {
    return (
      <div className="min-h-screen bg-customgreys-primarybg flex items-center justify-center">
        <Alert className="max-w-md bg-customgreys-secondarybg border-gray-700/50">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-gray-300">Please sign in to view your courses.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // No Courses State
  if (isError || !courses || courses.length === 0) {
    return (
      <div className="min-h-screen bg-customgreys-primarybg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="relative mb-8">
              <BookOpen className="w-24 h-24 text-gray-500 mx-auto" />
              <Sparkles className="w-8 h-8 text-blue-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Your Learning Journey
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven&apos;t enrolled in any courses yet. Explore our catalog and find
              courses that match your interests.
            </p>
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 transition-all duration-300">
              <ExternalLink className="w-5 h-5" />
              Browse Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-customgreys-primarybg">
      {/* Enhanced Header */}
      <div className="bg-customgreys-secondarybg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-400" />
                My Courses
              </h1>
              <p className="text-gray-400 mt-1">
                Continue your learning journey
              </p>
            </div>

            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
              <Plus className="w-4 h-4" />
              Browse More Courses
            </Button>
          </div>

          {/* Enhanced Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card className="bg-customgreys-primarybg border-gray-700/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalCourses}</p>
                      <p className="text-xs text-gray-400">Total Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-customgreys-primarybg border-gray-700/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {progressLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          stats.inProgressCourses
                        )}
                      </p>
                      <p className="text-xs text-gray-400">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-customgreys-primarybg border-gray-700/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {progressLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          stats.completedCourses
                        )}
                      </p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-customgreys-primarybg border-gray-700/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalHours}h</p>
                      <p className="text-xs text-gray-400">Total Hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progress Loading Indicator */}
          {progressLoading && (
            <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-blue-400">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <span className="text-sm font-medium">Loading course progress...</span>
                  <p className="text-xs text-blue-300 mt-1">
                    Fetching progress data for {courses?.length || 0} enrolled courses
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Data Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && Object.keys(progressData).length > 0 && (
            <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600/30 rounded-lg">
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer text-gray-300 hover:text-white">
                  Debug: Progress Data ({Object.keys(progressData).length} courses loaded)
                </summary>
                <pre className="mt-2 overflow-x-auto text-xs">
                  {JSON.stringify(
                    Object.fromEntries(
                      Object.entries(progressData).map(([courseId, data]) => [
                        courseId.slice(-8),
                        {
                          overallProgress: data.overallProgress,
                          sectionsCount: data.progressData?.sections?.length || 0,
                          completedChapters: data.progressData?.sections?.reduce(
                            (acc, section) => acc + (section.chapters?.filter(ch => ch.completed).length || 0), 0
                          ) || 0
                        }
                      ])
                    ),
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Filters */}
        <Card className="bg-customgreys-secondarybg border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-customgreys-primarybg border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px] bg-customgreys-primarybg border-gray-700/50 text-white">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-customgreys-primarybg border-gray-700/50">
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50"
                      >
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(value: SortOption) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[150px] bg-customgreys-primarybg border-gray-700/50 text-white">
                    <BarChart3 className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-customgreys-primarybg border-gray-700/50">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-700/50 rounded-lg p-1 bg-customgreys-primarybg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1 ${
                      viewMode === "grid" 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1 ${
                      viewMode === "list" 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Course Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 bg-customgreys-secondarybg border-gray-700/50">
            <TabsTrigger 
              value="all" 
              className="gap-2 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-blue-600"
            >
              <BookOpen className="w-4 h-4" />
              All Courses ({courses?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="in-progress" 
              className="gap-2 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-orange-600"
            >
              <Flame className="w-4 h-4" />
              In Progress ({stats?.inProgressCourses || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="gap-2 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-green-600"
            >
              <Trophy className="w-4 h-4" />
              Completed ({stats?.completedCourses || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm || selectedCategory !== "all" ? (
                  <div>
                    <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No courses found
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                      }}
                      className="bg-customgreys-primarybg border-gray-700/50 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <BookmarkCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No courses in this category yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Start exploring courses to build your learning library
                    </p>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                      <ExternalLink className="w-4 h-4" />
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">
                    {filteredCourses.length} course
                    {filteredCourses.length !== 1 ? "s" : ""}
                  </h2>
                  {(searchTerm || selectedCategory !== "all") && (
                    <Badge variant="outline" className="border-gray-600 text-gray-400">Filtered</Badge>
                  )}
                </div>

                {/* Course Grid/List */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredCourses.map((course, index) =>
                    renderCourseCard(course, index)
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Courses;
