"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bell, Search, Zap } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActionsMenu } from "@/components/ui/quick-actions-menu";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.userType as "student" | "teacher";
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar__container">
        <div className="dashboard-navbar__search">
          <div className="md:hidden">
            <SidebarTrigger className="dashboard-navbar__sidebar-trigger" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link
                scroll={false}
                href="/search"
                className={cn("dashboard-navbar__search-input group-hover:scale-105 transition-transform", {
                  "!bg-customgreys-secondarybg": isCoursePage,
                })}
              >
                <span className="hidden sm:inline">Search Courses</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <Search className="dashboard-navbar__search-icon group-hover:text-blue-400 transition-colors" size={18} />
            </div>
          </div>
        </div>
        <div className="dashboard-navbar__actions">
          {/* Quick Actions Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all duration-300"
          >
            <Zap className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Quick Actions</span>
            <Badge className="ml-2 bg-blue-600 text-white text-xs px-1 h-4">
              New
            </Badge>
          </Button>

          {/* Enhanced Notification Button */}
          <button className="relative nondashboard-navbar__notification-button group">
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 animate-pulse">
                {notificationCount}
              </Badge>
            )}
            <Bell className="nondashboard-navbar__notification-icon group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle variant="button" size="sm" />

          <UserButton
            appearance={{
              baseTheme: dark,
              elements: {
                button: {
                  userButtonIdentifier: "text-customgerys-dirtyGrey",
                  userButtonBox: "scale-90 sm:scale-100 hover:scale-105 transition-transform",
                },
              },
            }}
            showName={true}
            userProfileMode="navigation"
            userProfileUrl={
              userRole === "teacher" ? "/teacher/profile" : "/user/profile"
            }
          />
        </div>

        {/* Quick Actions Menu */}
        {showQuickActions && (
          <div className="absolute top-full right-0 mt-2 z-50">
            <QuickActionsMenu 
              userRole={userRole || "student"} 
              onAction={() => setShowQuickActions(false)}
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
