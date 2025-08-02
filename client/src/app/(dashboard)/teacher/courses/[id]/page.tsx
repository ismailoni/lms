"use client";

import { CustomFormField } from "@/components/CustomFormField";
import { CourseImageUpload } from "@/components/CourseImageUpload";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
    mode: "onChange", // Enable real-time validation
  });

  // Watch for form changes
  const watchedValues = methods.watch();

  useEffect(() => {
    console.log("Form values changed:", watchedValues);
    setHasUnsavedChanges(true);
  }, [watchedValues, sections]);

  useEffect(() => {
    if (course) {
      console.log("Setting form values from course:", course);
      methods.reset({
        courseTitle: course.title || "",
        courseDescription: course.description || "",
        courseCategory: course.category || "",
        coursePrice: (course.price || 0).toString(), // Price is already in dollars
        courseStatus: course.status === "Published",
        courseImage: course.image || undefined,
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
    const filledFields = fields.filter((field) => {
      if (typeof field === 'string') {
        return field.trim() !== "" && field !== "0";
      }
      return field !== undefined && field !== null;
    }).length;
    
    const sectionsScore = sections.length > 0 ? 1 : 0;
    const chaptersScore = sections.some((section) => section.chapters.length > 0)
      ? 1
      : 0;

    const percentage = Math.round(
      ((filledFields + sectionsScore + chaptersScore) / 7) * 100
    );
    
    console.log("Completion calculation:", {
      fields,
      filledFields,
      sectionsScore,
      chaptersScore,
      percentage
    });

    return percentage;
  }, [watchedValues, sections]);

  // Get completion status
  const isReadyToPublish = completionPercentage >= 80;

  const onSubmit = async (data: CourseFormData) => {
    try {
      toast.loading("Saving course...", { id: "save-course" });

      // Validate form data before submission
      console.log("Submitting course data:", data);
      console.log("Sections data:", sections);

      const updatedSections = await uploadAllVideos(
        sections,
        id,
        getUploadVideoUrl
      );

      const formData = createCourseFormData(data, updatedSections);

      // Log the FormData contents for debugging
      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      const result = await updateCourse({
        courseId: id,
        formData,
      }).unwrap();

      console.log("Course update result:", result);

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success("Course saved successfully!", { id: "save-course" });
      
      // Refetch will update the course data and trigger the useEffect
      // that calls dispatch(setSections(course.sections || []))
      await refetch();
    } catch (error) {
      console.error("Failed to update course:", error);
      
      // Extract error message from the API response
      let errorMessage = "Failed to save course. Please try again.";
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { message?: string } };
        if (apiError.data?.message) {
          errorMessage = apiError.data.message;
        }
      }
      
      toast.error(errorMessage, { id: "save-course" });
    }
  };

  const handleQuickSave = async () => {
    // Force validation to pass for draft courses
    const formValues = methods.getValues();
    console.log("Quick save - form values:", formValues);
    
    // Check if form is valid or if it's a draft
    const isFormValid = methods.formState.isValid;
    const isDraft = !formValues.courseStatus;
    
    if (isFormValid || isDraft) {
      await onSubmit(formValues);
    } else {
      // For published courses, trigger validation
      const result = await methods.trigger();
      if (result) {
        await onSubmit(formValues);
      } else {
        toast.error("Please fix validation errors before saving");
      }
    }
  };

  const previewCourse = () => {
    if (isReadyToPublish) {
      router.push(`/user/courses/${id}`);
    } else {
      toast.warning("Please complete more course details before previewing");
    }
  };

  // Handle status toggle outside of form context
  const handleStatusToggle = (checked: boolean) => {
    methods.setValue("courseStatus", checked);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Dark Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher/courses", { scroll: false })}
              className="gap-2 text-gray-300 hover:text-gray-100 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>

            <Separator orientation="vertical" className="h-6 bg-gray-600" />

            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <div>
                <h1 className="text-lg font-semibold text-gray-100">
                  {course?.title || "New Course"}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
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
            {/* Enhanced Completion Badge */}
            <Badge
              variant={isReadyToPublish ? "default" : "secondary"}
              className={`gap-1 ${
                isReadyToPublish 
                  ? 'bg-green-600 text-white border-green-500' 
                  : 'bg-gray-700 text-gray-300 border-gray-600'
              }`}
            >
              {isReadyToPublish ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {completionPercentage}% Complete
            </Badge>

            {/* Enhanced Status Toggle - FIXED: Use Switch directly instead of CustomFormField */}
            <div className="flex items-center gap-2">
              <Switch
                checked={methods.watch("courseStatus")}
                onCheckedChange={handleStatusToggle}
                className={`${
                  methods.watch("courseStatus")
                    ? "data-[state=checked]:bg-green-500"
                    : "bg-gray-600"
                }`}
              />
              <span className={`text-sm font-medium ${
                methods.watch("courseStatus")
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}>
                {methods.watch("courseStatus") ? "Published" : "Draft"}
              </span>
            </div>

            {/* Enhanced Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={previewCourse}
              disabled={!isReadyToPublish}
              className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed group"
            >
              <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Preview
            </Button>

            <div className="relative group">
              <Button
                onClick={handleQuickSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`gap-2 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden ${
                  isSaving 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : hasUnsavedChanges 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                {/* Animated background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {methods.watch("courseStatus") ? "Update Course" : "Save Draft"}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Saved
                  </>
                )}
              </Button>
              
              {/* Enhanced success animation */}
              {!hasUnsavedChanges && !isSaving && lastSaved && (
                <>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                </>
              )}
              
              {/* Progress indicator for unsaved changes */}
              {hasUnsavedChanges && !isSaving && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-yellow-400 w-full animate-pulse" />
              )}
            </div>
            
            {/* Debug Save Button - Remove this after testing */}
            <Button
              onClick={async () => {
                console.log("Debug save clicked");
                const values = methods.getValues();
                console.log("Current form values:", values);
                try {
                  const formData = createCourseFormData(values, sections);
                  console.log("Created form data");
                  for (const [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                  }
                  const result = await updateCourse({ courseId: id, formData }).unwrap();
                  console.log("Save result:", result);
                  toast.success("Debug save successful!");
                } catch (error) {
                  console.error("Debug save error:", error);
                  toast.error("Debug save failed");
                }
              }}
              variant="outline"
              size="sm"
              className="border-yellow-600 text-yellow-300 hover:bg-yellow-600 hover:text-white"
            >
              Debug Save
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-medium">Course Completion</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">{completionPercentage}%</span>
              {isReadyToPublish && (
                <Badge variant="default" className="bg-green-600 text-white animate-pulse">
                  Ready to Publish!
                </Badge>
              )}
            </div>
          </div>
          <div className="relative w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                isReadyToPublish 
                  ? 'bg-gradient-to-r from-green-500 to-green-400' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
            
            {/* Milestone markers */}
            <div className="absolute inset-0 flex justify-between items-center px-1">
              {[20, 40, 60, 80].map((milestone) => (
                <div
                  key={milestone}
                  className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                    completionPercentage >= milestone 
                      ? 'bg-white' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Basic Info</span>
            <span>Content</span>
            <span>Settings</span>
            <span>Ready!</span>
          </div>
        </div>
      </div>

      {/* Enhanced Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert className="mx-6 mt-4 w-fit border-yellow-600 bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            You have unsaved changes. Don&apos;t forget to save your progress!
          </AlertDescription>
        </Alert>
      )}

      {/* FIXED: Wrap the entire form content with Form provider */}
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="basic" 
                className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
              >
                <FileText className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
              >
                <BookOpen className="w-4 h-4" />
                Course Content
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
              >
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Course Details
                    </CardTitle>
                    <CardDescription className="text-gray-400">
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

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                      Course Appearance
                    </CardTitle>
                    <CardDescription className="text-gray-400">
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

                    {/* Enhanced Course Stats Preview */}
                    <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <h4 className="font-medium mb-3 text-gray-200 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        Course Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">0 Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            {sections.reduce(
                              (acc, section) => acc + section.chapters.length,
                              0
                            )}{" "}
                            Chapters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">${watchedValues.coursePrice || "0"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{sections.length} Sections</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Course Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-gray-100">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Course Content
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Organize your course into sections and chapters
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
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
                        <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
                        <p className="text-gray-400">Loading course content...</p>
                      </div>
                    </div>
                  ) : sections.length > 0 ? (
                    <DroppableComponent />
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-100 mb-2">
                        No content yet
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Start building your course by adding your first section
                      </p>
                      <Button
                        type="button"
                        onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Section
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Content Guidelines */}
              <Alert className="border-blue-600 bg-blue-900/20">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  <strong>Content Tips:</strong> Break your course into logical
                  sections (3-8 sections recommended). Each section should contain
                  3-7 chapters for optimal learning experience.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <Settings className="w-5 h-5 text-blue-400" />
                    Course Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how your course appears and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-200">
                        Publishing Status
                      </label>
                      <div className="mt-2 p-4 border border-gray-600 rounded-lg bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-100">
                              {methods.watch("courseStatus")
                                ? "Published"
                                : "Draft"}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {methods.watch("courseStatus")
                                ? "Your course is live and visible to students"
                                : "Your course is saved as draft and not visible to students"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* FIXED: Use CustomFormField properly within Form context */}
                            <CustomFormField
                              name="courseStatus"
                              label=""
                              type="switch"
                              inputClassName="data-[state=checked]:bg-green-500"
                            />
                            <Badge
                              variant={methods.watch("courseStatus") ? "default" : "secondary"}
                              className={`${
                                methods.watch("courseStatus")
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-600 text-gray-300"
                              }`}
                            >
                              {methods.watch("courseStatus") ? "Live" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isReadyToPublish && (
                      <Alert className="border-yellow-600 bg-yellow-900/20">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-200">
                          Complete at least 80% of your course details to enable
                          publishing. Current completion: {completionPercentage}%
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Additional Settings Placeholder */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        Additional Options
                      </h4>
                      <div className="p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                        <p className="text-sm text-gray-400 text-center py-4">
                          More settings will be available soon...
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      {/* Modals - These are already correctly implemented */}
      <ChapterModal />
      <SectionModal />
    </div>
  );
};

export default CourseEditor;