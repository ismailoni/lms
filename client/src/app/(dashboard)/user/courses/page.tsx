"use client";

import React, { useState, useMemo } from "react";
import { useGetUserEnrolledCoursesQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  TrendingUp,
  Star,
  Calendar,
  Users,
  Target,
  Award,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  BarChart3,
  BookmarkCheck,
  Flame,
  Plus,
} from "lucide-react";
import Loading from "@/components/Loading";

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

  const {
    data: courses,
    isLoading,
    isError,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  });

  // Enhanced filtering and sorting
  const { filteredCourses, stats } = useMemo(() => {
    if (!courses) return { filteredCourses: [], stats: null };

    let filtered = courses.filter((course) => {
      const title = course.title || "";
      const category = course.category || "";

      const matchesSearch = title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || category === selectedCategory;

      // Tab filtering
      if (activeTab === "in-progress") {
        // Mock progress - you'd calculate this from actual progress data
        const progress = Math.random() * 100;
        return (
          matchesSearch &&
          matchesCategory &&
          progress > 0 &&
          progress < 100
        );
      } else if (activeTab === "completed") {
        const progress = Math.random() * 100;
        return matchesSearch && matchesCategory && progress === 100;
      }

      return matchesSearch && matchesCategory;
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          // Mock last accessed - you'd use real data
          return Math.random() - 0.5;
        case "progress":
          // Mock progress comparison
          return Math.random() - 0.5;
        case "alphabetical":
          return (a.title || "").localeCompare(b.title || "");
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        default:
          return 0;
      }
    });

    // Calculate stats
    const totalCourses = courses.length;
    const inProgressCourses = Math.floor(totalCourses * 0.6); // Mock
    const completedCourses = Math.floor(totalCourses * 0.3); // Mock
    const totalHours = totalCourses * 8; // Mock: 8 hours per course
    const avgProgress = 65; // Mock average progress

    return {
      filteredCourses: filtered,
      stats: {
        totalCourses,
        inProgressCourses,
        completedCourses,
        totalHours,
        avgProgress,
      },
    };
  }, [courses, searchTerm, selectedCategory, sortBy, activeTab]);

  // Mock function to calculate course progress
  const getCourseProgress = (course: Course) => {
    // In a real app, this would calculate based on completed chapters
    return Math.floor(Math.random() * 100);
  };

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

    if (viewMode === "list") {
      return (
        <motion.div
          key={course.courseId}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Course Image */}
                <div className="relative flex-shrink-0">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-20 h-15 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-15 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {course.teacherName} • {chaptersCount} chapters
                      </p>
                    </div>
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {isCompleted ? "Completed" : `${progress}%`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{progress}% completed</span>
                      <span>{chaptersCount} chapters</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleGoToCourse(course)}
                  className="gap-2 group-hover:shadow-md transition-shadow"
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
        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
          <div className="relative">
            {course.image ? (
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary-600" />
              </div>
            )}

            {/* Progress Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <Progress value={progress} className="h-2 bg-white/20" />
            </div>

            {/* Completion Badge */}
            {isCompleted && (
              <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {course.teacherName}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{chaptersCount} chapters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>~8h</span>
                  </div>
                </div>
                <Badge variant={isCompleted ? "default" : "secondary"}>
                  {progress}%
                </Badge>
              </div>

              <Button
                onClick={() => handleGoToCourse(course)}
                className="w-full gap-2 group-hover:shadow-md transition-shadow"
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
  if (!isLoaded || isLoading) {
    return (
      <Loading />
    );
  }

  // Error or No User State
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please sign in to view your courses.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // No Courses State
  if (isError || !courses || courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="relative mb-8">
              <BookOpen className="w-24 h-24 text-gray-300 mx-auto" />
              <Sparkles className="w-8 h-8 text-primary-400 absolute -top-2 -right-2" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Start Your Learning Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              You haven't enrolled in any courses yet. Explore our catalog and find
              courses that match your interests.
            </p>
            <Button size="lg" className="gap-2">
              <ExternalLink className="w-5 h-5" />
              Browse Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary-600" />
                My Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Continue your learning journey
              </p>
            </div>

            <Button className="gap-2 bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4" />
              Browse More Courses
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalCourses}</p>
                      <p className="text-xs text-gray-500">Total Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.inProgressCourses}
                      </p>
                      <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedCourses}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalHours}h</p>
                      <p className="text-xs text-gray-500">Total Hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
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
                  <SelectTrigger className="w-[150px]">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-1"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="px-3 py-1"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="w-4 h-4" />
              All Courses ({courses?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="gap-2">
              <Flame className="w-4 h-4" />
              In Progress ({stats?.inProgressCourses || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Trophy className="w-4 h-4" />
              Completed ({stats?.completedCourses || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm || selectedCategory !== "all" ? (
                  <div>
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No courses found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <BookmarkCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No courses in this category yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start exploring courses to build your learning library
                    </p>
                    <Button className="gap-2">
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
                  <h2 className="text-lg font-medium">
                    {filteredCourses.length} course
                    {filteredCourses.length !== 1 ? "s" : ""}
                  </h2>
                  {(searchTerm || selectedCategory !== "all") && (
                    <Badge variant="outline">Filtered</Badge>
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
