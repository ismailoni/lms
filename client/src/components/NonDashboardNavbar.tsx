'use client';
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Search, Menu, X } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CustomUserMenu from "./CustomUserMenu";

const NonDashboardNavbar = () => {
  const {user} = useUser();
  const userRole = user?.publicMetadata?.userType as "student" | "teacher";
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount] = useState(100000); // Mock notification count

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    
    const handleClickOutside = () => {
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside or on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    
    const handleClickOutside = () => {
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="nondashboard-navbar">
      <div className="nondashboard-navbar__container">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link href="/" className="nondashboard-navbar__brand group" scroll={false}>
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-extrabold text-lg sm:text-xl lg:text-2xl">
              Susu.
            </span>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex nondashboard-navbar__search flex-1 max-w-xl mx-4 xl:mx-8">
          <div className="relative group w-full">
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <Link
                href="/search"
                className={`nondashboard-navbar__search-input block w-full transition-all duration-300 ${
                  isSearchFocused ? 'ring-2 ring-blue-500/50 bg-customgreys-darkerGrey' : ''
                }`}
                scroll={false}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              >
                <span className="xl:inline hidden">Search for courses, skills, instructors...</span>
                <span className="hidden lg:inline xl:hidden">Search courses...</span>
                <span className="inline lg:hidden">Search...</span>
              </Link>
              <Search
                className={`nondashboard-navbar__search-icon transition-all duration-300 ${
                  isSearchFocused ? 'text-blue-400' : ''
                }`}
                size={18}
              />
            </div>
          </div>
        </div>

        <button 
          className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Actions */}
        <div className="hidden lg:flex nondashboard-navbar__actions">
          <SignedIn>
            <div className="flex items-center gap-2 xl:gap-3">
              {userRole === "teacher" && (
                <Link href="/teacher/courses" scroll={false}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-sm px-3 py-1.5"
                  >
                    <span className="xl:inline hidden">Teaching</span>
                    <span className="xl:hidden">Teach</span>
                  </Button>
                </Link>
              )}
              <CustomUserMenu />
            </div>
          </SignedIn>
          
          <SignedOut>
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/signin" scroll={false}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-3 py-1.5"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup" scroll={false}>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-4 py-1.5"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          </SignedOut>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            className="absolute top-full left-0 right-0 bg-customgreys-secondarybg/95 backdrop-blur-md border-t border-gray-700 lg:hidden z-50 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">


              {/* Mobile User Actions */}
              <SignedIn>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-gray-500 px-3 py-1 font-medium">
                    Account
                  </div>
                  {userRole === "teacher" && (
                    <Link href="/teacher/courses" scroll={false}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-12 text-base"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="flex items-center gap-3">
                          📚 <span>My Courses</span>
                        </span>
                      </Button>
                    </Link>
                  )}
                  {userRole === "student" && (
                    <Link href="/user/courses" scroll={false}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-12 text-base"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="flex items-center gap-3">
                          📚 <span>My Courses</span>
                        </span>
                      </Button>
                    </Link>
                  )}
                  <CustomUserMenu />
                  <Link href={userRole === "teacher" ? "/teacher/profile" : "/user/profile"} scroll={false}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 h-12 text-base"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-3">
                        👤 <span>Profile</span>
                      </span>
                    </Button>
                  </Link>
                  <Link href={userRole === "teacher" ? "/teacher/settings" : "/user/settings"} scroll={false}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 h-12 text-base"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-3">
                        ⚙️ <span>Settings</span>
                      </span>
                    </Button>
                  </Link>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500 px-3 py-1 font-medium">
                    Get Started
                  </div>
                  <Link href="/signin" scroll={false}>
                    <Button 
                      variant="ghost" 
                      className="w-full text-gray-300 hover:text-white hover:bg-gray-700/50 h-12 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" scroll={false}>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              </SignedOut>

              {/* Mobile Menu Footer */}
              <div className="pt-4 mt-4 border-t border-gray-700">
                <div className="text-xs text-center text-gray-500">
                  <span>© 2025 Susu. All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NonDashboardNavbar;
