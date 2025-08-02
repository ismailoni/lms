"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
  optional?: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  showDescription?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ProgressTracker({
  steps,
  currentStepId,
  onStepClick,
  showDescription = true,
  orientation = "horizontal",
  className,
}: ProgressTrackerProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.status === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (step.status === "current") {
      return <Play className="w-5 h-5 text-blue-400" />;
    }
    return <Circle className="w-5 h-5 text-gray-500" />;
  };

  const getStepStyles = (step: ProgressStep, index: number) => ({
    wrapper: cn(
      "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer",
      {
        "bg-green-500/10 border border-green-500/30": step.status === "completed",
        "bg-blue-500/10 border border-blue-500/30 ring-2 ring-blue-500/20": step.status === "current",
        "bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50": step.status === "upcoming",
        "opacity-60": step.optional && step.status === "upcoming",
      }
    ),
    title: cn(
      "font-medium transition-colors",
      {
        "text-green-400": step.status === "completed",
        "text-blue-400": step.status === "current",
        "text-gray-400": step.status === "upcoming",
      }
    ),
    description: cn(
      "text-sm transition-colors",
      {
        "text-green-300/80": step.status === "completed",
        "text-blue-300/80": step.status === "current",
        "text-gray-500": step.status === "upcoming",
      }
    ),
  });

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-blue-400 font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const styles = getStepStyles(step, index);
            return (
              <div
                key={step.id}
                className={styles.wrapper}
                onClick={() => onStepClick?.(step.id)}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step, index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={styles.title}>{step.title}</h4>
                    {step.optional && (
                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-600">
                        Optional
                      </Badge>
                    )}
                  </div>
                  {showDescription && step.description && (
                    <p className={styles.description}>{step.description}</p>
                  )}
                </div>
                {step.status === "current" && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-blue-400 font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2 -z-10" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const styles = getStepStyles(step, index);
          return (
            <div
              key={step.id}
              className="flex flex-col items-center space-y-2 relative z-10"
              onClick={() => onStepClick?.(step.id)}
            >
              <div className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer",
                {
                  "bg-green-500 border-green-500": step.status === "completed",
                  "bg-blue-500 border-blue-500 ring-4 ring-blue-500/20": step.status === "current",
                  "bg-gray-800 border-gray-600 hover:border-gray-500": step.status === "upcoming",
                }
              )}>
                {getStepIcon(step, index)}
              </div>
              
              <div className="text-center max-w-20">
                <div className="flex items-center gap-1 justify-center">
                  <p className={cn("text-xs font-medium", styles.title)}>{step.title}</p>
                  {step.optional && (
                    <span className="text-xs text-gray-500">*</span>
                  )}
                </div>
                {showDescription && step.description && (
                  <p className={cn("text-xs mt-1", styles.description)}>{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Course Progress Component
interface CourseProgressProps {
  totalChapters: number;
  completedChapters: number;
  currentChapter?: string;
  estimatedTime?: string;
  className?: string;
}

export function CourseProgress({
  totalChapters,
  completedChapters,
  currentChapter,
  estimatedTime,
  className,
}: CourseProgressProps) {
  const progressPercentage = (completedChapters / totalChapters) * 100;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  return (
    <div className={cn("bg-gray-800/50 p-4 rounded-lg border border-gray-700/50", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Course Progress</h3>
          <Badge className="bg-blue-600 text-white">
            {Math.round(progressPercentage)}% Complete
          </Badge>
        </div>

        <Progress value={animatedProgress} className="h-3" />

        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{completedChapters} of {totalChapters} chapters</span>
          </div>
          {estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{estimatedTime} remaining</span>
            </div>
          )}
        </div>

        {currentChapter && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
            <p className="text-sm text-blue-400">
              Currently learning: <span className="font-medium">{currentChapter}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
