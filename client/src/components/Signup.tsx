'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SignUp, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useSearchParams, useRouter } from 'next/navigation';

const SignupComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  const [role, setRole] = useState<string>('');
  const [roleSaved, setRoleSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isCheckoutpage = searchParams.get('showSignUp') !== null;
  const courseId = searchParams.get('id');

  const signInUrl = isCheckoutpage
    ? `/checkout?step=1&id=${courseId}&showSignUp=false`
    : '/signin';

  const getRedirectUrl = useCallback(
    (userType?: string) => {
      if (isCheckoutpage) {
        return `/checkout?step=2&id=${courseId}`;
      }
      if (userType === 'teacher') {
        return '/teacher/courses';
      }
      return '/user/courses';
    },
    [isCheckoutpage, courseId]
  );

  // Save role to Clerk public metadata after signup
  useEffect(() => {
   if (isSignedIn && role && !roleSaved) {
    (async () => {
      setIsSaving(true);
      try {
        // Use type assertion to bypass TS type check
        await (user as unknown as { update: (data: Record<string, unknown>) => Promise<void> })
  ?.update({
    publicMetadata: { userType: role },
  });
        setRoleSaved(true);
        router.push(getRedirectUrl(role));
      } catch (err) {
        console.error('Error saving role:', err);
      } finally {
        setIsSaving(false);
      }
    })();
  }
}, [isSignedIn, role, roleSaved, user, router, getRedirectUrl]);

  return (
    <div className="flex flex-col gap-6">
      {/* Role selection */}
      <div className="max-w-sm mx-auto mt-6 w-full">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Choose your role
        </label>
        <select
          className="w-full border rounded p-2 bg-customgreys-primarybg text-white-50"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isSaving}
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        {isSaving && (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-2">
            <svg
              className="animate-spin h-4 w-4 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Saving role...
          </div>
        )}
      </div>

      {/* Clerk SignUp form */}
      <SignUp
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: 'flex justify-center items-center py-5',
            cardBox: 'shadow-none',
            card: 'bg-customgreys-secodarybg w-full shadow-none',
            footer: {
              background: '#25262F',
              padding: '0rem 2.5rem',
              '& > div > div:nth-child(1)': {
                background: '#25262F',
              },
            },
            formFieldLabel: 'text-white-50 font-normal',
            formButtonPrimary:
              'bg-primary-700 text-white-100 hover:bg-primary-600 !shadow-none',
            formFieldInput:
              'bg-customgreys-primarybg text-white-50 !shadow-none',
            footerActionLink: 'text-primary-750 hover:text-primary-600',
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