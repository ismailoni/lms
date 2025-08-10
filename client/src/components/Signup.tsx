'use client';

import { SignUp, useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import { dark } from "@clerk/themes";
import { useSearchParams, useRouter } from "next/navigation";

const SignupComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  const isCheckoutpage = searchParams.get("showSignUp") !== null;
  const courseId = searchParams.get("id");

  const [role, setRole] = useState("student"); // default role
  const [roleSaved, setRoleSaved] = useState(false); // track metadata save

  const signInUrl = isCheckoutpage
    ? `/checkout?step=1&id=${courseId}&showSignUp=false`
    : "/signin";

  const getRedirectUrl = (userType?: string) => {
    if (isCheckoutpage) {
      return `/checkout?step=2&id=${courseId}`;
    }
    if (userType === "teacher") {
      return "/teacher/courses";
    }
    return "/user/courses";
  };

  // Save role after first sign-in
  useEffect(() => {
    const saveRole = async () => {
      if (isSignedIn && user && !user.publicMetadata?.userType && !roleSaved) {
        try {
          await user.update({
            publicMetadata: { userType: role },
          });
          setRoleSaved(true);
          router.push(getRedirectUrl(role));
        } catch (err) {
          console.error("Failed to save role:", err);
        }
      }
    };
    saveRole();
  }, [isSignedIn, user, role, roleSaved, router]);

  return (
    <div className="flex flex-col items-center">
      {/* Role Selector — only visible when NOT signed in */}
      {!isSignedIn && (
        <div className="mb-4">
          <label className="text-white mr-2">I am a:</label>
          <select
            className="bg-customgreys-primarybg text-white p-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
      )}

      {/* Clerk SignUp UI */}
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
            formFieldInput: "bg-customgreys-primarybg text-white-50 !shadow-none",
            footerActionLink: "text-primary-750 hover:text-primary-600",
          },
        }}
        signInUrl={signInUrl}
        forceRedirectUrl={undefined} // disable Clerk's auto redirect
        routing="hash"
        afterSignOutUrl="/"
      />
    </div>
  );
};

export default SignupComponent;