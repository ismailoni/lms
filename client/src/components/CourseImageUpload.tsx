"use client";

import React, { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface CourseImageUploadProps {
  name: string;
  label: string;
  currentImageUrl?: string;
  className?: string;
}

export const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  name,
  label,
  currentImageUrl,
  className,
}) => {
  const { control, setValue } = useFormContext();
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("File type must be .jpg, .jpeg, .png, or .webp");
        resolve(false);
        return;
      }

      // Check file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setError("File size must be less than 2MB");
        resolve(false);
        return;
      }

      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;

        // Check minimum dimensions
        if (width < 640 || height < 360) {
          setError("Image must be at least 640 × 360 pixels");
          resolve(false);
          return;
        }

        // Check aspect ratio (16:9 with some tolerance)
        const targetRatio = 16 / 9;
        const tolerance = 0.1;
        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
          setError("Image must have a 16:9 aspect ratio (recommended: 1280 × 720 px)");
          resolve(false);
          return;
        }

        setError(null);
        resolve(true);
      };

      img.onerror = () => {
        setError("Invalid image file");
        resolve(false);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = await validateImage(file);
    if (isValid) {
      setValue(name, file, { shouldValidate: true });
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setValue(name, undefined, { shouldValidate: true });
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className={`space-y-2 ${className}`}>
          <FormLabel className="text-customgreys-dirtyGrey text-sm">
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-customgreys-dirtyGrey rounded-lg p-6 text-center bg-customgreys-darkGrey">
                {preview ? (
                  <div className="relative">
                    <div className="relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden bg-customgreys-primarybg">
                      <Image
                        src={preview}
                        alt="Course thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemove}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-customgreys-primarybg rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-customgreys-dirtyGrey" />
                    </div>
                    <div>
                      <p className="text-customgreys-dirtyGrey mb-2">
                        Upload course thumbnail
                      </p>
                      <p className="text-sm text-customgreys-dirtyGrey opacity-70">
                        16:9 aspect ratio • 1280 × 720 px recommended • Max 2MB
                      </p>
                      <p className="text-xs text-customgreys-dirtyGrey opacity-50 mt-1">
                        Supports .jpg, .jpeg, .png, .webp
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFileSelect}
                      className="border-customgreys-dirtyGrey text-customgreys-dirtyGrey hover:bg-customgreys-primarybg"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Error message */}
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {/* Change button when image is uploaded */}
              {preview && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerFileSelect}
                    className="border-customgreys-dirtyGrey text-customgreys-dirtyGrey hover:bg-customgreys-primarybg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-400" />
        </FormItem>
      )}
    />
  );
};