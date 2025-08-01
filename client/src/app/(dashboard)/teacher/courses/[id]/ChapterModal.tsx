import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChapterFormData, chapterSchema } from "@/lib/schemas";
import { addChapter, closeChapterModal, editChapter } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  BookOpen,
  FileText,
  Video,
  Upload,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Play,
  FileVideo,
  Lightbulb,
  Target,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const {
    isChapterModalOpen,
    selectedSectionIndex,
    selectedChapterIndex,
    sections,
  } = useAppSelector((state) => state.global.courseEditor);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const sectionTitle = selectedSectionIndex !== null
    ? sections[selectedSectionIndex]?.sectionTitle
    : "Unknown Section";

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
    },
  });

  // Watch for form changes
  const watchedValues = methods.watch();

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      watchedValues.title,
      watchedValues.content,
      watchedValues.video
    ];
    const filledFields = fields.filter(field => {
      if (typeof field === 'string') return field.trim();
      return field;
    }).length;
    return Math.round((filledFields / 3) * 100);
  }, [watchedValues]);

  const isFormValid = Boolean(watchedValues.title?.trim());
  const chapterType = watchedValues.video ? "Video" : "Text";

  useEffect(() => {
    if (chapter) {
      const hasChanges =
        watchedValues.title !== chapter.title ||
        watchedValues.content !== chapter.content ||
        watchedValues.video !== (chapter.video || "");
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(
        Boolean(watchedValues.title) ||
        Boolean(watchedValues.content) ||
        Boolean(watchedValues.video)
      );
    }
  }, [watchedValues, chapter]);

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
      });
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
      });
    }
    setHasUnsavedChanges(false);
  }, [chapter, methods]);

  const onClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        dispatch(closeChapterModal());
        setHasUnsavedChanges(false);
      }
    } else {
      dispatch(closeChapterModal());
    }
  };

  const onSubmit = async (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    setIsSubmitting(true);

    try {
      const newChapter: Chapter = {
        chapterId: chapter?.chapterId || uuidv4(),
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.video ? "Video" : "Text",
        video: data.video,
      };

      if (selectedChapterIndex === null) {
        dispatch(
          addChapter({
            sectionIndex: selectedSectionIndex,
            chapter: newChapter,
          })
        );
        toast.success("Chapter added successfully! 🎉", {
          description: `"${newChapter.title}" has been added to ${sectionTitle}`,
        });
      } else {
        dispatch(
          editChapter({
            sectionIndex: selectedSectionIndex,
            chapterIndex: selectedChapterIndex,
            chapter: newChapter,
          })
        );
        toast.success("Chapter updated successfully! ✨", {
          description: "Your changes have been saved.",
        });
      }

      setHasUnsavedChanges(false);
      dispatch(closeChapterModal());
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="chapter-modal max-w-4xl mx-auto bg-gray-900 text-gray-100">
        {/* Header */}
        <div className="chapter-modal__header border-b border-gray-700 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                {chapterType === "Video" ? (
                  <Video className="w-5 h-5 text-blue-400" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="chapter-modal__title text-xl font-semibold text-gray-100">
                  {chapter ? "Edit Chapter" : "Create New Chapter"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{sectionTitle}</span>
                  {chapter && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                        {chapter.type}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Completion Badge */}
              <Badge
                variant={isFormValid ? "default" : "secondary"}
                className={`gap-1 ${
                  isFormValid 
                    ? 'bg-green-600 text-white border-green-500' 
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {isFormValid ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {completionPercentage}%
              </Badge>

              {/* Chapter Type Badge */}
              <Badge
                variant="outline"
                className={`gap-1 ${
                  chapterType === "Video" 
                    ? "border-purple-500 text-purple-400 bg-purple-900/20" 
                    : "border-blue-500 text-blue-400 bg-blue-900/20"
                }`}
              >
                {chapterType === "Video" ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                {chapterType}
              </Badge>

              <button
                className="chapter-modal__close p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Chapter Setup Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="mb-6 border-yellow-600 bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              You have unsaved changes. Don&apos;t forget to save your progress!
            </AlertDescription>
          </Alert>
        )}

        <Form {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="chapter-modal__form"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="content" 
                  className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  <FileText className="w-4 h-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  <Video className="w-4 h-4" />
                  Media
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Chapter Content
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Create the main content for your chapter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CustomFormField
                      name="title"
                      label="Chapter Title"
                      type="text"
                      placeholder="e.g., Introduction to Variables and Data Types"
                      helperText="Choose a clear, descriptive title for this chapter"
                    />

                    <CustomFormField
                      name="content"
                      label="Chapter Content"
                      type="textarea"
                      placeholder="Write your chapter content here. You can include explanations, code examples, exercises, and more..."
                      rows={8}
                      helperText="Provide detailed content that helps students understand the topic"
                    />
                  </CardContent>
                </Card>

                {/* Content Guidelines */}
                <Card className="border-blue-600 bg-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">
                          Content Writing Tips
                        </h4>
                        <ul className="text-sm text-blue-200 space-y-1">
                          <li>• Start with clear learning objectives</li>
                          <li>• Use examples and practical exercises</li>
                          <li>• Break complex topics into digestible parts</li>
                          <li>• Include code snippets or visual aids when relevant</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Video className="w-5 h-5 text-blue-400" />
                      Chapter Video
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload a video to accompany your chapter content (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={methods.control}
                      name="video"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-200">
                            Video File
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {/* File Upload Area */}
                              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-800/50">
                                <Input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      onChange(file);
                                    }
                                  }}
                                  className="hidden"
                                  id="video-upload"
                                />
                                <label htmlFor="video-upload" className="cursor-pointer">
                                  <div className="space-y-2">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">Click to upload video</p>
                                      <p className="text-xs text-gray-400">MP4, WebM, or OGV up to 100MB</p>
                                    </div>
                                  </div>
                                </label>
                              </div>

                              {/* Current/Selected Video Display */}
                              {typeof value === "string" && value && (
                                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                                  <FileVideo className="w-5 h-5 text-purple-400" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-200">Current Video</p>
                                    <p className="text-xs text-gray-400">{value.split("/").pop()}</p>
                                  </div>
                                  <Badge variant="secondary" className="bg-gray-600 text-gray-300">Current</Badge>
                                </div>
                              )}

                              {value instanceof File && (
                                <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                                  <FileVideo className="w-5 h-5 text-green-400" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-200">Selected Video</p>
                                    <p className="text-xs text-gray-400">
                                      {value.name} • {formatFileSize(value.size)}
                                    </p>
                                  </div>
                                  <Badge className="bg-green-600 text-white">New</Badge>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Target className="w-5 h-5 text-blue-400" />
                      Chapter Preview
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      See how your chapter will appear to students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chapter Header */}
                      <div className="border-b border-gray-700 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          {chapterType === "Video" ? (
                            <Play className="w-5 h-5 text-purple-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-400" />
                          )}
                          <Badge 
                            variant="outline" 
                            className={`${
                              chapterType === "Video" 
                                ? "border-purple-500 text-purple-400 bg-purple-900/20" 
                                : "border-blue-500 text-blue-400 bg-blue-900/20"
                            }`}
                          >
                            {chapterType}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-100">
                          {watchedValues.title || "Chapter Title"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Estimated reading time: {Math.max(1, Math.ceil((watchedValues.content?.length || 0) / 200))} min</span>
                        </div>
                      </div>

                      {/* Chapter Content */}
                      <div className="prose prose-sm max-w-none prose-invert">
                        {watchedValues.content ? (
                          <div className="whitespace-pre-wrap text-gray-300">
                            {watchedValues.content}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            Chapter content will appear here...
                          </p>
                        )}
                      </div>

                      {/* Video Section */}
                      {watchedValues.video && (
                        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-gray-200">Video Content</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {typeof watchedValues.video === 'string'
                              ? `Current: ${watchedValues.video.split("/").pop()}`
                              : `New video: ${watchedValues.video.name}`
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="chapter-modal__actions flex items-center justify-between pt-6 border-t border-gray-700 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {isFormValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Ready to save</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span>Title is required</span>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 gap-2 min-w-[140px] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {chapter ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {chapter ? "Update Chapter" : "Create Chapter"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;