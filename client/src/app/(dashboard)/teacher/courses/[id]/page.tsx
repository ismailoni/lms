"use client";

import { CustomFormField } from "@/components/CustomFormField";
import { CourseImageUpload } from "@/components/CourseImageUpload";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { courseSchema } from "@/lib/schemas";
import {
  centsToDollars,
  createCourseFormData,
  uploadAllVideos,
} from "@/lib/utils";
import { openSectionModal, setSections } from "@/state";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useGetUploadVideoUrlMutation,
} from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  Target,
  Info,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ChapterModal from "./ChapterModal";
import SectionModal from "./SectionModal";
import DroppableComponent from "@/components/Droppable";

const CATEGORY_OPTIONS = [
  // Technology & Programming
  { value: "web-development", label: "Web Development", icon: "💻" },
  { value: "mobile-development", label: "Mobile Development", icon: "📱" },
  { value: "software-engineering", label: "Software Engineering", icon: "⚙️" },
  { value: "data-science", label: "Data Science", icon: "📊" },
  { value: "machine-learning", label: "Machine Learning", icon: "🤖" },
  { value: "artificial-intelligence", label: "Artificial Intelligence", icon: "🧠" },
  { value: "cybersecurity", label: "Cybersecurity", icon: "🔒" },
  { value: "cloud-computing", label: "Cloud Computing", icon: "☁️" },
  { value: "devops", label: "DevOps", icon: "🔄" },
  { value: "blockchain", label: "Blockchain", icon: "⛓️" },

  // Business & Finance
  { value: "business-management", label: "Business Management", icon: "💼" },
  { value: "entrepreneurship", label: "Entrepreneurship", icon: "🚀" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "marketing", label: "Marketing", icon: "📈" },
  { value: "digital-marketing", label: "Digital Marketing", icon: "📱" },
  { value: "project-management", label: "Project Management", icon: "📋" },

  // Design & Creative
  { value: "graphic-design", label: "Graphic Design", icon: "🎨" },
  { value: "ui-ux-design", label: "UI/UX Design", icon: "🖌️" },
  { value: "photography", label: "Photography", icon: "📸" },
  { value: "video-editing", label: "Video Editing", icon: "🎬" },

  // Education & Personal Development
  { value: "teaching", label: "Teaching", icon: "👨‍🏫" },
  { value: "leadership", label: "Leadership", icon: "👑" },
  { value: "productivity", label: "Productivity", icon: "⚡" },
  { value: "communication", label: "Communication", icon: "💬" },

  // Health & Wellness
  { value: "fitness", label: "Fitness", icon: "💪" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "mental-health", label: "Mental Health", icon: "🧘" },

  // Other
  { value: "other", label: "Other", icon: "📚" },
];

const CourseEditor = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: course, isLoading, refetch } = useGetCourseQuery(id);
  const [updateCourse, { isLoading: isSaving }] = useUpdateCourseMutation();
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation();

  const dispatch = useAppDispatch();
  const { sections } = useAppSelector((state) => state.global.courseEditor);

  const [activeTab, setActiveTab] = useState("basic");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "",
      courseDescription: "",
      courseCategory: "",
      coursePrice: "0",
      courseStatus: false,
      courseImage: undefined,
    },
  });

  // Watch for form changes
  const watchedValues = methods.watch();

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [watchedValues, sections]);

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        courseCategory: course.category,
        coursePrice: centsToDollars(course.price),
        courseStatus: course.status === "Published",
        courseImage: course.image,
      });
      dispatch(setSections(course.sections || []));
      setHasUnsavedChanges(false);
    }
  }, [course, methods, dispatch]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      watchedValues.courseTitle,
      watchedValues.courseDescription,
      watchedValues.courseCategory,
      watchedValues.coursePrice,
      watchedValues.courseImage,
    ];
    const filledFields = fields.filter((field) => field && field !== "0").length;
    const sectionsScore = sections.length > 0 ? 1 : 0;
    const chaptersScore = sections.some((section) => section.chapters.length > 0)
      ? 1
      : 0;

    return Math.round(
      ((filledFields + sectionsScore + chaptersScore) / 7) * 100
    );
  }, [watchedValues, sections]);

  // Get completion status
  const isReadyToPublish = completionPercentage >= 80;

  const onSubmit = async (data: CourseFormData) => {
    try {
      toast.loading("Saving course...", { id: "save-course" });

      const updatedSections = await uploadAllVideos(
        sections,
        id,
        getUploadVideoUrl
      );

      const formData = createCourseFormData(data, updatedSections);

      await updateCourse({
        courseId: id,
        formData,
      }).unwrap();

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success("Course saved successfully!", { id: "save-course" });
      refetch();
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("Failed to save course. Please try again.", { id: "save-course" });
    }
  };

  const handleQuickSave = async () => {
    await methods.handleSubmit(onSubmit)();
  };

  const previewCourse = () => {
    if (isReadyToPublish) {
      router.push(`/user/courses/${id}`);
    } else {
      toast.warning("Please complete more course details before previewing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher/courses", { scroll: false })}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <div>
                <h1 className="text-lg font-semibold">
                  {course?.title || "New Course"}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Course Editor</span>
                  {lastSaved && (
                    <>
                      <span>•</span>
                      <span>Last saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion Badge */}
            <Badge
              variant={isReadyToPublish ? "default" : "secondary"}
              className="gap-1"
            >
              {isReadyToPublish ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {completionPercentage}% Complete
            </Badge>

            {/* Status Toggle */}
            <CustomFormField
              name="courseStatus"
              label={methods.watch("courseStatus") ? "Published" : "Draft"}
              type="switch"
              className="flex items-center space-x-2"
              labelClassName={`text-sm font-medium ${
                methods.watch("courseStatus")
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
              inputClassName="data-[state=checked]:bg-green-500"
            />

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={previewCourse}
              disabled={!isReadyToPublish}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>

            <Button
              onClick={handleQuickSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="gap-2 bg-primary-600 hover:bg-primary-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {methods.watch("courseStatus") ? "Update Course" : "Save Draft"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Course Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert className="mx-6 mt-4 border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your progress!
          </AlertDescription>
        </Alert>
      )}

      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="gap-2">
                <FileText className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Course Content
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      Course Details
                    </CardTitle>
                    <CardDescription>
                      Basic information about your course that students will see
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CustomFormField
                      name="courseTitle"
                      label="Course Title"
                      type="text"
                      placeholder="e.g., Complete Web Development Bootcamp"
                      initialValue={course?.title}
                    />

                    <CustomFormField
                      name="courseDescription"
                      label="Course Description"
                      type="textarea"
                      placeholder="Describe what students will learn in this course..."
                      initialValue={course?.description}
                      rows={6}
                    />

                    <CustomFormField
                      name="courseCategory"
                      label="Course Category"
                      type="select"
                      placeholder="Select category"
                      options={CATEGORY_OPTIONS.map((cat) => ({
                        value: cat.value,
                        label: `${cat.icon} ${cat.label}`,
                      }))}
                      initialValue={course?.category}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary-600" />
                      Course Appearance
                    </CardTitle>
                    <CardDescription>
                      Visual elements that represent your course
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CourseImageUpload
                      name="courseImage"
                      label="Course Thumbnail"
                      currentImageUrl={course?.image}
                    />

                    <CustomFormField
                      name="coursePrice"
                      label="Course Price (USD)"
                      type="number"
                      placeholder="0"
                      initialValue={course?.price}
                      helperText="Set to 0 for a free course"
                    />

                    {/* Course Stats Preview */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-3">Course Preview</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>0 Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>
                            {sections.reduce(
                              (acc, section) => acc + section.chapters.length,
                              0
                            )}{" "}
                            Chapters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>${watchedValues.coursePrice || "0"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span>{sections.length} Sections</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Course Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                        Course Content
                      </CardTitle>
                      <CardDescription>
                        Organize your course into sections and chapters
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mx-auto mb-2" />
                        <p>Loading course content...</p>
                      </div>
                    </div>
                  ) : sections.length > 0 ? (
                    <DroppableComponent />
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No content yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start building your course by adding your first section
                      </p>
                      <Button
                        type="button"
                        onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Section
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Guidelines */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Content Tips:</strong> Break your course into logical
                  sections (3-8 sections recommended). Each section should contain
                  3-7 chapters for optimal learning experience.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-600" />
                    Course Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how your course appears and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Publishing Status
                      </label>
                      <div className="mt-2 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {methods.watch("courseStatus")
                                ? "Published"
                                : "Draft"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {methods.watch("courseStatus")
                                ? "Your course is live and visible to students"
                                : "Your course is saved as draft and not visible to students"}
                            </p>
                          </div>
                          <CustomFormField
                            name="courseStatus"
                            label={methods.watch("courseStatus") ? "Published" : "Draft"}
                            type="switch"
                            inputClassName="data-[state=checked]:bg-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {!isReadyToPublish && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Complete at least 80% of your course details to enable
                          publishing. Current completion: {completionPercentage}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      <ChapterModal />
      <SectionModal />
    </div>
  );
};

export default CourseEditor;