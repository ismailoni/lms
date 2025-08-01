'use client';

import TeacherCourseCard from '@/components/TeacherCourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertCircle,
  CheckCircle2,
  Clock,
  SortAsc,
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

    const filtered = courses.filter((course) => {
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
      <div className="min-h-screen bg-gray-900">
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !courses) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md bg-red-900/50 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-300" />
          <AlertDescription className="text-red-300">
            Error loading courses. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='teacher-courses min-h-screen bg-gray-900'>
      {/* Enhanced Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                My Courses
              </h1>
              <p className="text-gray-400 mt-1">
                Create and manage your educational content
              </p>
            </div>
            
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
                    <p className="text-xs text-gray-400">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">{stats.published}</p>
                    <p className="text-xs text-gray-400">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">{stats.draft}</p>
                    <p className="text-xs text-gray-400">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-400">Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">${stats.totalRevenue}</p>
                    <p className="text-xs text-gray-400">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-gray-100">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
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
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[150px] bg-gray-700 border-gray-600 text-gray-100">
                <SortAsc className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-400">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1 bg-gray-700 text-gray-300 border-gray-600">
                Search: &quot;{searchTerm}&quot;
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="ml-1 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1 bg-gray-700 text-gray-300 border-gray-600">
                Category: {CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}
                <button 
                  onClick={() => setSelectedCategory('all')} 
                  className="ml-1 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200"
                >
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
                <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-100 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-400 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-100 mb-2">
                  Start your teaching journey
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first course and share your knowledge with the world
                </p>
                <Button 
                  onClick={handleCreateCourse} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
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
                <h2 className="text-lg font-medium text-gray-100">
                  {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''}
                </h2>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Badge variant="outline" className="border-blue-400 text-blue-400">
                    Filtered
                  </Badge>
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