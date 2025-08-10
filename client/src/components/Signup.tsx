'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SignUp, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const SignupComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  const [role, setRole] = useState<string>('');
  const [roleSaved, setRoleSaved] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);

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
      }
    })();
  }
}, [isSignedIn, role, roleSaved, user, router, getRedirectUrl]);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setShowSignupForm(true);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!showSignupForm ? (
        <div className="bg-customgreys-secondarybg p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white-100 mb-2">
              Welcome to our LMS
            </h2>
            <p className="text-white-50">
              Please select your role to get started
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="userRole" className="text-white-50 font-medium mb-2 block">
                I am a:
              </Label>
              <Select onValueChange={handleRoleSelect}>
                <SelectTrigger 
                  id="userRole"
                  className="w-full bg-customgreys-primarybg border-customgreys-darkerGrey text-white-50 focus:border-primary-600"
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-customgreys-primarybg border-customgreys-darkerGrey">
                  <SelectItem 
                    value="student" 
                    className="text-white-50 focus:bg-customgreys-secondarybg focus:text-white-100"
                  >
                    Student - I want to learn and take courses
                  </SelectItem>
                  <SelectItem 
                    value="teacher" 
                    className="text-white-50 focus:bg-customgreys-secondarybg focus:text-white-100"
                  >
                    Teacher - I want to create and teach courses
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Role Selection Summary */}
          <div className="bg-customgreys-secondarybg p-4 rounded-t-lg border-b border-customgreys-darkerGrey">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white-50">Signing up as:</span>
                <span className="text-primary-600 font-medium capitalize">
                  {role}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowSignupForm(false);
                  setRole('');
                }}
                className="text-primary-600 hover:text-primary-500 text-sm underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Clerk SignUp form */}
          <SignUp
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: 'flex justify-center items-center py-5',
                cardBox: 'shadow-none',
                card: 'bg-customgreys-secondarybg w-full shadow-none rounded-t-none',
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
        </>
      )}
    </div>
  );
};

export default SignupComponent;