"use client";

import { useState } from "react";
import { 
  Plus, 
  Upload, 
  Settings, 
  BookOpen, 
  Users, 
  BarChart3,
  Video,
  Zap,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string;
  gradient: string;
}

interface QuickActionsMenuProps {
  userRole: "student" | "teacher";
  onAction?: (actionId: string) => void;
}

export function QuickActionsMenu({ userRole, onAction }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const teacherActions: QuickAction[] = [
    {
      id: "create-course",
      title: "Create New Course",
      description: "Start building your next course",
      icon: <Plus className="w-5 h-5" />,
      href: "/teacher/courses/new",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: "upload-content",
      title: "Upload Content",
      description: "Add videos, images, or documents",
      icon: <Upload className="w-5 h-5" />,
      onClick: () => onAction?.("upload-content"),
      gradient: "from-green-500 to-teal-600",
    },
    {
      id: "view-analytics",
      title: "Course Analytics",
      description: "Track your course performance",
      icon: <BarChart3 className="w-5 h-5" />,
      href: "/teacher/analytics",
      badge: "New",
      gradient: "from-orange-500 to-red-600",
    },
    {
      id: "manage-students",
      title: "Manage Students",
      description: "View enrollments and progress",
      icon: <Users className="w-5 h-5" />,
      href: "/teacher/students",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  const studentActions: QuickAction[] = [
    {
      id: "browse-courses",
      title: "Browse Courses",
      description: "Discover new learning opportunities",
      icon: <BookOpen className="w-5 h-5" />,
      href: "/search",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: "continue-learning",
      title: "Continue Learning",
      description: "Resume your current courses",
      icon: <Video className="w-5 h-5" />,
      href: "/user/courses",
      gradient: "from-green-500 to-teal-600",
    },
    {
      id: "track-progress",
      title: "Track Progress",
      description: "View your learning achievements",
      icon: <BarChart3 className="w-5 h-5" />,
      href: "/user/progress",
      gradient: "from-orange-500 to-red-600",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Customize your learning experience",
      icon: <Settings className="w-5 h-5" />,
      href: "/user/settings",
      gradient: "from-gray-500 to-gray-600",
    },
  ];

  const actions = userRole === "teacher" ? teacherActions : studentActions;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-40"
        size="sm"
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <Zap className="w-6 h-6" />
        </div>
      </Button>

      {/* Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="fixed bottom-24 right-6 w-80 z-40 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-customgreys-secondarybg/95 backdrop-blur-md border-gray-700/50 shadow-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Quick Actions</h3>
                  <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                    {userRole === "teacher" ? "Teacher" : "Student"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {actions.map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      onClick={() => {
                        if (action.onClick) {
                          action.onClick();
                        }
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>

                {/* Close button */}
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-gray-400 hover:text-white mt-3"
                  size="sm"
                >
                  Close Menu
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ActionItem({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  const content = (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group border border-gray-700/30 hover:border-gray-600/50"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
        {action.icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
            {action.title}
          </h4>
          {action.badge && (
            <Badge variant="destructive" className="text-xs h-5">
              {action.badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {action.description}
        </p>
      </div>
      
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>
  );

  if (action.href) {
    return (
      <Link href={action.href} scroll={false}>
        {content}
      </Link>
    );
  }

  return content;
}
