'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SignUp, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './Signup.module.css';

const SignupComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  const [role, setRole] = useState<string>('');
  const [roleSaved, setRoleSaved] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setSelectedCard(selectedRole);
    setIsLoading(true);
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      setRole(selectedRole);
      setShowSignupForm(true);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (event: React.KeyboardEvent, role: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isLoading) {
        handleRoleSelect(role);
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {!showSignupForm ? (
        <div className="bg-customgreys-secondarybg p-8 rounded-xl shadow-2xl border border-customgreys-darkerGrey">
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full mx-auto flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white-100 mb-3 animate-fade-in">
              Welcome to our LMS
            </h2>
            <p className="text-white-50 text-lg animate-fade-in-delay">
              Choose your path and start your learning journey
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-white-100 font-semibold text-center mb-6 animate-fade-in-delay-2">I want to join as:</p>
            
            {isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 loading-overlay">
                <div className="bg-customgreys-secondarybg p-8 rounded-xl shadow-2xl border border-customgreys-darkerGrey animate-fade-in">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white-100 font-medium">Setting up your {selectedCard} account...</p>
                    <p className="text-white-50 text-sm">This will only take a moment</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Student Option */}
            <div 
              onClick={() => !isLoading && handleRoleSelect('student')}
              onKeyDown={(e) => handleKeyPress(e, 'student')}
              tabIndex={isLoading ? -1 : 0}
              role="button"
              aria-label="Select Student role - Discover new skills and take courses"
              className={`${styles['role-card']} group relative bg-customgreys-primarybg border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 animate-slide-in-left
                ${selectedCard === 'student' 
                  ? 'border-primary-500 bg-primary-50 bg-opacity-10 scale-[1.02] shadow-lg' 
                  : 'border-customgreys-darkerGrey hover:border-primary-500 hover:bg-customgreys-darkerGrey hover:shadow-lg hover:scale-[1.02]'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 
                  ${selectedCard === 'student' 
                    ? 'bg-blue-500 shadow-lg' 
                    : 'bg-blue-600 group-hover:bg-blue-500'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 transition-colors 
                    ${selectedCard === 'student' 
                      ? 'text-primary-400' 
                      : 'text-white-100 group-hover:text-primary-400'}`}>
                    Student
                  </h3>
                  <p className="text-white-50 text-sm leading-relaxed">
                    Discover new skills, take courses from expert instructors, and advance your career with hands-on learning experiences.
                  </p>
                  <div className="mt-3 flex items-center space-x-2 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Access to all courses</span>
                  </div>
                </div>
                <div className={`transition-all duration-300 
                  ${selectedCard === 'student' 
                    ? 'opacity-100 text-primary-400' 
                    : 'opacity-0 group-hover:opacity-100 text-primary-500'}`}>
                  {selectedCard === 'student' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Teacher Option */}
            <div 
              onClick={() => !isLoading && handleRoleSelect('teacher')}
              onKeyDown={(e) => handleKeyPress(e, 'teacher')}
              tabIndex={isLoading ? -1 : 0}
              role="button"
              aria-label="Select Teacher role - Share expertise and create courses"
              className={`${styles['role-card']} group relative bg-customgreys-primarybg border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 animate-slide-in-right
                ${selectedCard === 'teacher' 
                  ? 'border-primary-500 bg-primary-50 bg-opacity-10 scale-[1.02] shadow-lg' 
                  : 'border-customgreys-darkerGrey hover:border-primary-500 hover:bg-customgreys-darkerGrey hover:shadow-lg hover:scale-[1.02]'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 
                  ${selectedCard === 'teacher' 
                    ? 'bg-green-500 shadow-lg' 
                    : 'bg-green-600 group-hover:bg-green-500'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 transition-colors 
                    ${selectedCard === 'teacher' 
                      ? 'text-primary-400' 
                      : 'text-white-100 group-hover:text-primary-400'}`}>
                    Teacher
                  </h3>
                  <p className="text-white-50 text-sm leading-relaxed">
                    Share your expertise, create engaging courses, and earn income by teaching thousands of students worldwide.
                  </p>
                  <div className="mt-3 flex items-center space-x-2 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Create & monetize courses</span>
                  </div>
                </div>
                <div className={`transition-all duration-300 
                  ${selectedCard === 'teacher' 
                    ? 'opacity-100 text-primary-400' 
                    : 'opacity-0 group-hover:opacity-100 text-primary-500'}`}>
                  {selectedCard === 'teacher' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Role Selection Summary */}
          <div className="mt-20 bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-t-xl border-b border-customgreys-darkerGrey animate-fade-in max-w-[350px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center animate-pulse">
                  {role === 'student' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-white text-sm font-medium">Signing up as:</span>
                  <div className="text-white text-lg font-bold capitalize animate-fade-in-delay">
                    {role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSignupForm(false);
                  setRole('');
                  setSelectedCard(null);
                }}
                aria-label="Change selected role"
                className="flex items-center space-x-1 text-white hover:text-gray-200 transition-all duration-200 bg-white bg-opacity-10 px-3 py-2 rounded-lg hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-sm font-medium">Change</span>
              </button>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4 w-full bg-white bg-opacity-20 rounded-full h-1">
              <div className="bg-white h-1 rounded-full w-1/3 animate-fade-in-delay"></div>
            </div>
            <p className="text-white text-xs mt-2 opacity-80">Role selected, now complete your registration</p>
          </div>

          {/* Clerk SignUp form */}
          <SignUp
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: 'flex justify-center items-center py-5',
                cardBox: 'shadow-none',
                card: 'bg-customgreys-secondarybg w-full shadow-2xl rounded-t-none rounded-b-xl border-x border-b border-customgreys-darkerGrey',
                footer: {
                  background: '#25262F',
                  padding: '0rem 2.5rem',
                  borderRadius: '0 0 0.75rem 0.75rem',
                  '& > div > div:nth-child(1)': {
                    background: '#25262F',
                  },
                },
                formFieldLabel: 'text-white-50 font-medium text-sm',
                formButtonPrimary:
                  'bg-gradient-to-r from-primary-600 to-primary-700 text-white-100 hover:from-primary-500 hover:to-primary-600 !shadow-lg transition-all duration-200 font-semibold py-3',
                formFieldInput:
                  'bg-customgreys-primarybg text-white-50 !shadow-none border-customgreys-darkerGrey focus:border-primary-500 transition-colors rounded-lg',
                footerActionLink: 'text-primary-400 hover:text-primary-300 font-medium',
                headerTitle: 'text-white-100 text-xl font-bold',
                headerSubtitle: 'text-white-50',
                socialButtonsBlockButton: 'bg-customgreys-primarybg border-customgreys-darkerGrey text-white-50 hover:bg-customgreys-darkerGrey transition-colors',
                dividerLine: 'bg-customgreys-darkerGrey',
                dividerText: 'text-white-50',
              },
            }}
            signInUrl={signInUrl}
            forceRedirectUrl={getRedirectUrl()}
            routing="hash"
            afterSignOutUrl="/"
            unsafeMetadata={{ userType: role }}
          />
        </>
      )}
    </div>
  );
};

export default SignupComponent;