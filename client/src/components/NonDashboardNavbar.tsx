'use client';
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bell, Search, Menu, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";

const NonDashboardNavbar = () => {
  const {user} = useUser();
  const userRole = user?.publicMetadata?.userType as "student" | "teacher";
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  return (
    <nav className="nondashboard-navbar">
      <div className="nondashboard-navbar__container">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="nondashboard-navbar__brand group" scroll={false}>
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-extrabold text-xl sm:text-2xl">
              Susu.
            </span>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex nondashboard-navbar__search">
          <div className="relative group">
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
              <Link
                href="/search"
                className={`nondashboard-navbar__search-input transition-all duration-300 ${
                  isSearchFocused ? 'ring-2 ring-blue-500/50 bg-customgreys-darkerGrey' : ''
                }`}
                scroll={false}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              >
                <span className="hidden sm:inline">Search for courses, skills, instructors...</span>
                <span className="sm:hidden">Search</span>
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

        {/* Desktop Actions */}
        <div className="hidden md:flex nondashboard-navbar__actions">
          {/* Notifications */}
          <button className="nondashboard-navbar__notification-button group relative">
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
            <Bell className="nondashboard-navbar__notification-icon group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle variant="button" size="sm" />

          {/* User Authentication */}
          <SignedIn>
            <div className="flex items-center gap-3">
              {userRole === "teacher" && (
                <Link href="/teacher/courses" scroll={false}>
                  <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                    Teaching
                  </Button>
                </Link>
              )}
              <UserButton 
                appearance={{
                  baseTheme: dark,
                  elements: {
                    avatarBox: "w-9 h-9 hover:ring-2 hover:ring-blue-400/50 transition-all",
                    userButtonIdentifier: "text-gray-300",
                    userButtonBox: "scale-90 sm:scale-100",
                  }
                }}
                showName={true}
                userProfileMode="navigation"
                userProfileUrl={
                  userRole === "teacher" ? "/teacher/profile" : "/user/profile"
                }
              />
            </div>
          </SignedIn>
          
          <SignedOut>
            <div className="flex items-center gap-2">
              <Link href="/signin" scroll={false}>
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700/50">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" scroll={false}>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium">
                  Sign up
                </Button>
              </Link>
            </div>
          </SignedOut>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-customgreys-secondarybg border-t border-gray-700 md:hidden z-50">
            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Link
                  href="/search"
                  className="flex items-center gap-3 p-3 bg-customgreys-primarybg rounded-lg text-gray-300 hover:text-white transition-colors"
                  scroll={false}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Search size={18} />
                  <span>Search courses...</span>
                </Link>
              </div>

              {/* Mobile User Actions */}
              <SignedIn>
                <div className="space-y-2">
                  {userRole === "teacher" && (
                    <Link href="/teacher/courses" scroll={false}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Courses
                      </Button>
                    </Link>
                  )}
                  <Link href={userRole === "teacher" ? "/teacher/profile" : "/user/profile"} scroll={false}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Button>
                  </Link>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="space-y-2">
                  <Link href="/signin" scroll={false}>
                    <Button 
                      variant="ghost" 
                      className="w-full text-gray-300 hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" scroll={false}>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NonDashboardNavbar;
