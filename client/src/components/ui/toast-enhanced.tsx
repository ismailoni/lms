"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onRemove: (id: string) => void;
}

export function Toast({ id, title, description, type, duration = 5000, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-green-600 border-green-500 text-green-50",
    error: "bg-red-600 border-red-500 text-red-50",
    warning: "bg-yellow-600 border-yellow-500 text-yellow-50",
    info: "bg-blue-600 border-blue-500 text-blue-50",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 transform",
        colors[type],
        isVisible 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95"
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        {description && (
          <p className="text-sm opacity-90 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(id), 300);
        }}
        className="text-current opacity-70 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToasterProps {
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    type: "success" | "error" | "info" | "warning";
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function Toaster({ toasts, onRemove }: ToasterProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
