"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, CourseFormData } from '../../lib/schemas';
import { CustomFormField } from '../../components/CustomFormField';
import { Form } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { createCourseFormData } from '../../lib/utils';

// Test page to verify image upload functionality
export default function TestImageUploadPage() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "Test Course",
      courseDescription: "This is a test course description",
      courseCategory: "technology",
      coursePrice: "49.99",
      courseStatus: false,
      courseImage: undefined,
    },
  });

  const onSubmit = (data: CourseFormData) => {
    console.log("Form submitted with data:", data);
    
    // Create FormData as it would be sent to the backend
    const formData = createCourseFormData(data, []);
    
    // Convert FormData to object for display
    const formDataObj: any = {};
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }
    
    setSubmittedData(formDataObj);
    
    if (data.courseImage instanceof File) {
      console.log("Image file selected:", data.courseImage.name, data.courseImage.size);
      // Create preview URL
      const url = URL.createObjectURL(data.courseImage);
      setPreviewImage(url);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Course Image Upload Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Course Form</h2>
          <Form {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <CustomFormField
                name="courseTitle"
                label="Course Title"
                type="text"
                placeholder="Enter course title"
              />
              
              <CustomFormField
                name="courseDescription"
                label="Course Description"
                type="textarea"
                placeholder="Enter course description"
              />
              
              <CustomFormField
                name="courseCategory"
                label="Course Category"
                type="select"
                placeholder="Select category"
                options={[
                  { value: "technology", label: "Technology" },
                  { value: "science", label: "Science" },
                  { value: "mathematics", label: "Mathematics" },
                  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
                ]}
              />
              
              <CustomFormField
                name="coursePrice"
                label="Course Price"
                type="number"
                placeholder="0"
              />
              
              <CustomFormField
                name="courseImage"
                label="Course Image"
                type="file"
                accept="image/*"
                placeholder="Upload course image"
              />
              
              <Button type="submit" className="w-full">
                Submit Course
              </Button>
            </form>
          </Form>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Preview & Results</h2>
          
          {previewImage && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Image Preview:</h3>
              <img 
                src={previewImage} 
                alt="Course preview" 
                className="max-w-full h-48 object-cover rounded-lg border"
              />
            </div>
          )}
          
          {submittedData && (
            <div>
              <h3 className="text-lg font-medium mb-2">Submitted Data:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}