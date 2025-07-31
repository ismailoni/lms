'use client';

import Header from '@/components/Header';
import Loading from '@/components/Loading';
import TeacherCourseCard from '@/components/TeacherCourseCard';
import Toolbar from '@/components/Toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateCourseMutation, useDeleteCourseMutation, useGetCoursesQuery } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'students' | 'revenue';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories', icon: '📚' },
  { value: 'web-development', label: 'Web Development', icon: '💻' },
  { value: 'mobile-development', label: 'Mobile Development', icon: '📱' },
  { value: 'data-science', label: 'Data Science', icon: '📊' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'students', label: 'Most Students' },
  { value: 'revenue', label: 'Highest Revenue' },
];

const Courses = () => {
  const router = useRouter();
  const { user } = useUser();
  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useGetCoursesQuery({ category: 'all' });

  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const isOwner = course.teacherId === user?.id;
      return matchesSearch && matchesCategory && isOwner;
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'students':
          return (b.enrollments?.length || 0) - (a.enrollments?.length || 0);
        case 'revenue':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, selectedCategory, sortBy, user?.id]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!courses) return { total: 0, published: 0, draft: 0, totalStudents: 0, totalRevenue: 0 };
    
    const userCourses = courses.filter(course => course.teacherId === user?.id);
    
    return {
      total: userCourses.length,
      published: userCourses.filter(course => course.status === 'Published').length,
      draft: userCourses.filter(course => course.status === 'Draft').length,
      totalStudents: userCourses.reduce((acc, course) => acc + (course.enrollments?.length || 0), 0),
      totalRevenue: userCourses.reduce((acc, course) => acc + ((course.price || 0) * (course.enrollments?.length || 0)), 0),
    };
  }, [courses, user?.id]);

  const handleEdit = (course: Course) => {
    router.push(`/teacher/courses/${course.courseId}`, {
      scroll: false,
    });
  };

  const handleDelete = async (course: Course) => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      try {
        await deleteCourse(course.courseId).unwrap();
        toast.success('Course deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete course');
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!user) {
      toast.error('Please sign in to create a course');
      return;
    }
    
    try {
      toast.loading('Creating new course...', { id: 'create-course' });
      
      const result = await createCourse({ 
        teacherId: user.id, 
        teacherName: user.fullName || "Unknown Teacher" 
      }).unwrap();
      
      toast.success('Course created successfully!', { id: 'create-course' });
      
      router.push(`/teacher/courses/${result.courseId}`, {
        scroll: false,
      });
    } catch (error) {
      toast.error('Failed to create course', { id: 'create-course' });
    }
  };

  if (isLoading) {
    return (
      <Loading />
    );
  }

  if (isError || !courses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading courses. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='teacher-courses min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary-600" />
                My Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage your educational content
              </p>
            </div>
            
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating}
              className="bg-primary-600 hover:bg-primary-700 gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.published}</p>
                    <p className="text-xs text-gray-500">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.draft}</p>
                    <p className="text-xs text-gray-500">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="w-4 h-4 mr-2" />
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
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 py-1"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 py-1"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-gray-200 rounded">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category: {CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:bg-gray-200 rounded">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-6">
        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm || selectedCategory !== 'all' ? (
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
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Start your teaching journey
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first course and share your knowledge with the world
                </p>
                <Button onClick={handleCreateCourse} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Course
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">
                  {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''}
                </h2>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Badge variant="outline">Filtered</Badge>
                )}
              </div>
            </div>

            {/* Course Grid/List */}
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredAndSortedCourses.map((course) => (
                <TeacherCourseCard
                  key={course.courseId}
                  course={course}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={course.teacherId === user?.id}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;