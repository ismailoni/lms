"use client";
import { useUser } from "@clerk/nextjs";
import { Search, Zap } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActionsMenu } from "@/components/ui/quick-actions-menu";
import { cn } from "@/lib/utils";
import CustomUserMenu from "./CustomUserMenu";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarTrigger } from "./ui/sidebar";


const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.userType as "student" | "teacher";
  const [showQuickActions, setShowQuickActions] = useState(false);

  
  return (
    <nav className="dashboard-navbar">
        <div>
          {isCoursePage && <SidebarTrigger className="dashboard-navbar__sidebar-trigger" />}
          <SidebarTrigger className="dashboard-navbar__sidebar-trigger md:hidden" />
        </div>
        <div className="dashboard-navbar__search">

          <div className="flex items-center gap-4">
            <div className="group">
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

          <CustomUserMenu />
        </div>

        {/* Quick Actions Menu */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 z-50"
            >
              <QuickActionsMenu
                userRole={userRole || "student"}
                onAction={() => setShowQuickActions(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
    </nav>
  );
};

export default Navbar;
