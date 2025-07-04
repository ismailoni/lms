"use client";
import AppSidebar from "@/components/AppSidebar";
import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ChaptersSidebar from "./user/courses/[courseId]/ChaptersSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const isCoursePage = /^\/user\/courses\/[^/]+(?:\/chapters\/[^/]+)?$/.test(pathname);

  useEffect(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/user\/courses\/([^/]+)/);
      setCourseId(match ? match[1] : null);
    } else {
      setCourseId(null);
    }
  }, [pathname, isCoursePage]); 

  if (!isLoaded) return <Loading />;
  if (!user) return <div className="mx-auto">Please Sign-in to access</div>;

  return (
    <SidebarProvider>
      <div className="dashboard">
        {/* Sidebar  */}
        <AppSidebar />
        <div className="dashboard__content">
          {/* Chapter Sidebar */}
          {courseId && <ChaptersSidebar />}
          <div className={cn("dashboard__main",
            isCoursePage && "dashboard__main--not-course"
          )} style={{ height: "100vh" }}>
            <Navbar isCoursePage={false}/>
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
