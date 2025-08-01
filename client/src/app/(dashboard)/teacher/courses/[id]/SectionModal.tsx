import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SectionFormData, sectionSchema } from "@/lib/schemas";
import { addSection, closeSectionModal, editSection } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  BookOpen, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  FileText,
  Target,
  Lightbulb,
  Clock
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const SectionModal = () => {
  const dispatch = useAppDispatch();
  const { isSectionModalOpen, selectedSectionIndex, sections } = useAppSelector(
    (state) => state.global.courseEditor
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const section =
    selectedSectionIndex !== null ? sections[selectedSectionIndex] : null;

  const methods = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Watch for form changes to detect unsaved changes
  const watchedValues = methods.watch();

  useEffect(() => {
    if (section) {
      const hasChanges = 
        watchedValues.title !== section.sectionTitle ||
        watchedValues.description !== section.sectionDescription;
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(
        Boolean(watchedValues.title) || Boolean(watchedValues.description)
      );
    }
  }, [watchedValues, section]);

  useEffect(() => {
    if (section) {
      methods.reset({
        title: section.sectionTitle,
        description: section.sectionDescription,
      });
    } else {
      methods.reset({
        title: "",
        description: "",
      });
    }
    setHasUnsavedChanges(false);
  }, [section, methods]);

  // Calculate completion
  const completionPercentage = React.useMemo(() => {
    const fields = [watchedValues.title, watchedValues.description];
    const filledFields = fields.filter(field => field && field.trim()).length;
    return Math.round((filledFields / fields.length) * 100);
  }, [watchedValues]);

  const isFormValid = completionPercentage >= 50; // At least title is required

  const onClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        dispatch(closeSectionModal());
        setHasUnsavedChanges(false);
      }
    } else {
      dispatch(closeSectionModal());
    }
  };

  const onSubmit = async (data: SectionFormData) => {
    if (!data.title.trim()) {
      toast.error("Section title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const newSection: Section = {
        sectionId: section?.sectionId || uuidv4(),
        sectionTitle: data.title.trim(),
        sectionDescription: data.description?.trim() || "",
        chapters: section?.chapters || [],
      };

      if (selectedSectionIndex === null) {
        dispatch(addSection(newSection));
        toast.success("Section added successfully! 🎉", {
          description: "You can now add chapters to this section."
        });
      } else {
        dispatch(
          editSection({
            index: selectedSectionIndex,
            section: newSection,
          })
        );
        toast.success("Section updated successfully! ✨", {
          description: "Your changes have been saved."
        });
      }

      setHasUnsavedChanges(false);
      dispatch(closeSectionModal());
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal isOpen={isSectionModalOpen} onClose={onClose}>
      <div className="section-modal max-w-2xl mx-auto">
        {/* Header */}
        <div className="section-modal__header border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="section-modal__title text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {section ? "Edit Section" : "Create New Section"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {section 
                    ? "Update your section details" 
                    : "Add a new section to organize your course content"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Completion Badge */}
              <Badge 
                variant={isFormValid ? "default" : "secondary"}
                className="gap-1"
              >
                {isFormValid ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {completionPercentage}%
              </Badge>

              <button 
                className="section-modal__close p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span>Section Setup Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              You have unsaved changes. Don&apos;t forget to save your progress!
            </AlertDescription>
          </Alert>
        )}

        <Form {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="section-modal__form space-y-6"
          >
            {/* Main Content Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Section Information
                </CardTitle>
                <CardDescription>
                  Provide details about this section to help students understand what they&apos;ll learn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CustomFormField
                  name="title"
                  label="Section Title"
                  type="text"
                  placeholder="e.g., Introduction to JavaScript Fundamentals"
                  helperText="Choose a clear, descriptive title for this section"
                />
                
                <CustomFormField
                  name="description"
                  label="Section Description"
                  type="textarea"
                  placeholder="Describe what students will learn in this section..."
                  rows={4}
                  helperText="Explain the learning objectives and key topics covered"
                />
              </CardContent>
            </Card>

            {/* Section Preview */}
            {(watchedValues.title || watchedValues.description) && (
              <Card className="bg-gray-50 dark:bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-primary-600" />
                    Section Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {watchedValues.title || "Section Title"}
                      </h4>
                      {watchedValues.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {watchedValues.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{section?.chapters?.length || 0} Chapters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Section {(selectedSectionIndex || 0) + 1}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Section Best Practices
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Keep section titles clear and descriptive</li>
                      <li>• Aim for 3-7 chapters per section for optimal learning</li>
                      <li>• Use action-oriented language in descriptions</li>
                      <li>• Consider the logical flow between sections</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="section-modal__actions flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isFormValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Ready to save</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
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
                  className="gap-2"
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isSubmitting}
                  className="bg-primary-600 hover:bg-primary-700 gap-2 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {section ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {section ? "Update Section" : "Create Section"}
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

export default SectionModal;
