"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  overlay?: boolean;
}

export function Loading({ className, size = "md", text, overlay = false }: LoadingProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      overlay && "fixed inset-0 bg-black/50 backdrop-blur-sm z-50",
      !overlay && "p-8",
      className
    )}>
      <div className="relative">
        <Loader2 className={cn(
          "animate-spin text-blue-500",
          sizes[size]
        )} />
        <div className={cn(
          "absolute inset-0 animate-ping rounded-full bg-blue-500/20",
          sizes[size]
        )} />
      </div>
      {text && (
        <p className={cn(
          "text-gray-400 font-medium animate-pulse",
          textSizes[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangle" | "circle";
  animation?: "pulse" | "wave";
}

export function Skeleton({ className, variant = "text", animation = "pulse" }: SkeletonProps) {
  const variants = {
    text: "h-4 rounded",
    rectangle: "rounded-lg",
    circle: "rounded-full aspect-square"
  };

  const animations = {
    pulse: "animate-pulse",
    wave: "animate-wave"
  };

  return (
    <div className={cn(
      "bg-gray-700/50",
      variants[variant],
      animations[animation],
      className
    )} />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-customgreys-primarybg rounded-lg overflow-hidden p-0 border border-gray-700/30">
      <Skeleton className="w-full h-48" variant="rectangle" />
      <div className="p-4 space-y-3">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-12 h-5" />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
