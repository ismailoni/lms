"use client";
import AppSidebar from "@/components/AppSidebar";
import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  //handle useEffect isCoursepage

  if (!isLoaded) return <Loading />;
  if (!user) return <div className="mx-auto">Please Sign-in to access</div>;

  return (
    <SidebarProvider>
      <div className="dashboard">
        {/* Sidebar  */}
        <AppSidebar />
        <div className="dashboard__content">
          {/* Chapter Sidebar */}
          <div className={cn("dashboard__main")} style={{ height: "100vh" }}>
            <Navbar />
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
