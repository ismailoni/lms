"use client";

import { useState, useEffect } from "react";
import { Plus, Zap, ArrowUp, MessageCircle, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showLabels?: boolean;
  className?: string;
}

const defaultActions: FloatingAction[] = [
  {
    id: "scroll-top",
    icon: <ArrowUp className="w-5 h-5" />,
    label: "Back to Top",
    onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "help",
    icon: <HelpCircle className="w-5 h-5" />,
    label: "Help & Support",
    onClick: () => console.log("Help clicked"),
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    id: "feedback",
    icon: <MessageCircle className="w-5 h-5" />,
    label: "Send Feedback",
    onClick: () => console.log("Feedback clicked"),
    color: "bg-green-600 hover:bg-green-700",
  },
];

export function FloatingActionButton({
  actions = defaultActions,
  position = "bottom-right",
  showLabels = true,
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShouldShow(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const actionListClasses = {
    "bottom-right": "bottom-16 right-0 flex-col-reverse",
    "bottom-left": "bottom-16 left-0 flex-col-reverse",
    "top-right": "top-16 right-0 flex-col",
    "top-left": "top-16 left-0 flex-col",
  };

  if (!shouldShow) return null;

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      {/* Action Items */}
      <div
        className={cn(
          "absolute flex gap-3 transition-all duration-300 ease-out",
          actionListClasses[position],
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3"
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          >
            {showLabels && position.includes("right") && (
              <div className="bg-gray-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg border border-gray-700/50">
                {action.label}
              </div>
            )}

            <Button
              size="sm"
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
              className={cn(
                "w-12 h-12 rounded-full shadow-lg border-0 transition-all duration-300 hover:scale-110 focus:scale-110",
                action.color || "bg-gray-700 hover:bg-gray-600",
                "hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {action.icon}
            </Button>

            {showLabels && position.includes("left") && (
              <div className="bg-gray-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg border border-gray-700/50">
                {action.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0",
          "transition-all duration-300 hover:scale-110 focus:scale-110 hover:shadow-2xl hover:shadow-blue-500/25",
          "relative overflow-hidden group"
        )}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div
          className={cn(
            "transition-all duration-300",
            isOpen ? "rotate-45 scale-110" : "rotate-0 scale-100"
          )}
        >
          {isOpen ? <Plus className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
        </div>
      </Button>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute inset-0 bg-white/20 rounded-full transition-all duration-500",
          isOpen ? "scale-150 opacity-0" : "scale-0 opacity-100"
        )} />
      </div>
    </div>
  );
}

// Specialized FAB for Course Editor
export function CourseEditorFAB() {
  const courseActions: FloatingAction[] = [
    {
      id: "quick-save",
      icon: <Plus className="w-5 h-5" />,
      label: "Quick Save",
      onClick: () => {
        // Trigger quick save
        const saveBtn = document.querySelector('[data-save-button]') as HTMLButtonElement;
        saveBtn?.click();
      },
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      id: "add-section",
      icon: <Plus className="w-5 h-5" />,
      label: "Add Section",
      onClick: () => {
        // Trigger add section modal
        const addBtn = document.querySelector('[data-add-section]') as HTMLButtonElement;
        addBtn?.click();
      },
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Course Settings",
      onClick: () => {
        // Navigate to settings tab
        const settingsTab = document.querySelector('[data-tab="settings"]') as HTMLButtonElement;
        settingsTab?.click();
      },
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <FloatingActionButton
      actions={courseActions}
      position="bottom-right"
      showLabels={true}
    />
  );
}
