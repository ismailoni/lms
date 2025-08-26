"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Crown,
  GraduationCap,
  LogOut,
  Mail,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";


export default function CustomUserMenu() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const userType = user?.unsafeMetadata?.userType as string;
  const dashboardLink = userType === "teacher" ? "/teacher/courses" : "/user/courses";
  const profileLink = `/${userType}/profile`;
  const settingsLink = `/${userType}/settings`;

  const getInitials = () => {
    if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`;
    return user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? "U";
  };

  const getRoleInfo = () => {
    if (userType === "teacher") {
      return {
        icon: <Crown className="w-3 h-3" />,
        label: "Instructor",
        badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      };
    }
    return {
      icon: <GraduationCap className="w-3 h-3" />,
      label: "Student",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
  };

  const roleInfo = getRoleInfo();

  const menuItemClass = (path: string) =>
    cn(
        "flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer",
        pathname.startsWith(path) && "bg-gray-700/40 text-white"
    );


  return (
    <div className="custom-user-menu">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-700/50 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer"
            aria-label="Open user menu"
          >
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-gray-600 hover:border-blue-500/50 transition-colors">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>

            <div className="hidden md:flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-white truncate max-w-24 lg:max-w-32">
                {user.fullName || "User"}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {roleInfo.icon}
                <span>{roleInfo.label}</span>
              </div>
            </div>

            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-all duration-2000",
                isOpen && "rotate-180 transition-all duration-10000"
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent asChild align="end" sideOffset={8}>
          <motion.div
            className="w-64 mt-2 shadow-2xl border border-gray-700 bg-gray-800 backdrop-blur-md rounded-md overflow-hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-gray-600">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {user.fullName || `${user.firstName} ${user.lastName}` || "User"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 border ${roleInfo.badgeColor}`}
                    >
                      {roleInfo.icon}
                      <span className="ml-1">{roleInfo.label}</span>
                    </Badge>
                  </div>
                  {user.emailAddresses[0] && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 truncate">
                      <Mail className="w-3 h-3" />
                      {user.emailAddresses[0].emailAddress}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="py-1">
              <DropdownMenuItem
                onClick={() => {
                  router.push(dashboardLink);
                  setIsOpen(false);
                }}
                className={menuItemClass(dashboardLink)}
                aria-label="Dashboard"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Dashboard</span>
                  <span className="text-xs text-gray-500">Go to your courses</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  router.push(profileLink);
                  setIsOpen(false);
                }}
                className={menuItemClass(profileLink)}
                aria-label="Profile"
              >
                <User className="w-4 h-4 text-green-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Profile</span>
                  <span className="text-xs text-gray-500">Manage your account</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  router.push(settingsLink);
                  setIsOpen(false);
                }}
                className={menuItemClass(settingsLink)}
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Settings</span>
                  <span className="text-xs text-gray-500">Preferences & privacy</span>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-gray-700" />

            <div className="py-1">
              <SignOutButton>
                <DropdownMenuItem
                  className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Sign Out</span>
                    <span className="text-xs text-gray-500">Log out of your account</span>
                  </div>
                </DropdownMenuItem>
              </SignOutButton>
            </div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
