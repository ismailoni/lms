"use client";
import AppSidebar from "@/components/AppSidebar";
import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import ChaptersSidebar from "./user/courses/[courseId]/ChaptersSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  // Use useMemo to stabilize these boolean calculations
  const isCoursePage = useMemo(() => 
    /^\/user\/courses\/[^/]+(?:\/chapters\/[^/]+)?$/.test(pathname), 
    [pathname]
  );
  
  const isChapterPage = useMemo(() => 
    /^\/user\/courses\/[^/]+\/chapters\/[^/]+$/.test(pathname), 
    [pathname]
  );

  useEffect(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/user\/courses\/([^/]+)/);
      setCourseId(match ? match[1] : null);
      console.log('Course page detected:', { 
        pathname, 
        courseId: match ? match[1] : null, 
        isCoursePage, 
        isChapterPage 
      });
    } else {
      setCourseId(null);
    }
  }, [pathname, isCoursePage, isChapterPage]); 

  if (!isLoaded) return <Loading />;
  if (!user) return <div className="mx-auto">Please Sign-in to access</div>;

  return (
    <SidebarProvider>
      <div className="dashboard">
        {/* Main App Sidebar - Hidden on chapter pages */}
        {!isChapterPage && <AppSidebar />}
        
        {/* Chapter Sidebar - Only show on course/chapter pages */}
        {courseId && isCoursePage && <ChaptersSidebar />}
        
        <div className={cn(
          "dashboard__main",
          isCoursePage && "dashboard__main--course",
          isChapterPage && "dashboard__main--chapter"
        )} style={{ height: "100vh" }}>
          <Navbar isCoursePage={isCoursePage}/>
          <main className="dashboard__body">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
