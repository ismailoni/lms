import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStudentRoute = createRouteMatcher(["/user/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userRole = (user.publicMetadata?.userType as "student" | "teacher") || "student";

  if (isStudentRoute(req)) {
    if (userRole !== "student") {
      return NextResponse.redirect(new URL("/teacher/courses", req.url));
    }
  }

  if (isTeacherRoute(req)) {
    if (userRole !== "teacher") {
      return NextResponse.redirect(new URL("/user/courses", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
