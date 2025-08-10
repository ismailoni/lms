'use client';

import { SignUp, useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { dark } from "@clerk/themes";
import { useSearchParams, useRouter } from "next/navigation";

const SignupComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  const [role, setRole] = useState<"student" | "teacher" | "">("");
  const [roleSaved, setRoleSaved] = useState(false);

  const isCheckoutpage = searchParams.get("showSignUp") !== null;
  const courseId = searchParams.get("id");

  const signInUrl = isCheckoutpage
    ? `/checkout?step=1&id=${courseId}&showSignUp=false`
    : "/signin";

  const getRedirectUrl = useCallback(
    (userType?: string) => {
      if (isCheckoutpage) {
        return `/checkout?step=2&id=${courseId}`;
      }
      if (userType === "teacher") {
        return "/teacher/courses";
      }
      return "/user/courses";
    },
    [isCheckoutpage, courseId]
  );

  // Save role after sign up
  useEffect(() => {
    if (isSignedIn && role && !roleSaved) {
      (async () => {
        try {
          await (user as any)?.update({
            publicMetadata: { userType: role },
          });
          setRoleSaved(true);
          router.push(getRedirectUrl(role));
        } catch (err) {
          console.error("Error saving role:", err);
        }
      })();
    }
  }, [isSignedIn, user, role, roleSaved, router, getRedirectUrl]);

  return (
    <div className="flex flex-col items-center">
      {/* Role selection */}
      <div className="mb-4 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${
            role === "student" ? "bg-primary-700 text-white" : "bg-gray-600 text-white"
          }`}
          onClick={() => setRole("student")}
        >
          Student
        </button>
        <button
          className={`px-4 py-2 rounded ${
            role === "teacher" ? "bg-primary-700 text-white" : "bg-gray-600 text-white"
          }`}
          onClick={() => setRole("teacher")}
        >
          Teacher
        </button>
      </div>

      {/* Clerk SignUp */}
      <SignUp
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: "flex justify-center items-center py-5",
            cardBox: "shadow-none",
            card: "bg-customgreys-secodarybg w-full shadow-none",
            footer: {
              background: "#25262F",
              padding: "0rem 2.5rem",
              "& > div > div:nth-child(1)": {
                background: "#25262F",
              },
            },
            formFieldLabel: "text-white-50 font-normal",
            formButtonPrimary:
              "bg-primary-700 text-white-100 hover:bg-primary-600 !shadow-none",
            formFieldInput:
              "bg-customgreys-primarybg text-white-50 !shadow-none",
            footerActionLink: "text-primary-750 hover:text-primary-600",
          },
        }}
        signInUrl={signInUrl}
        forceRedirectUrl={getRedirectUrl()}
        routing="hash"
        afterSignOutUrl="/"
      />
    </div>
  );
};

export default SignupComponent;