"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUpdateUserMutation } from '@/state/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [updateUser] = useUpdateUserMutation();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from user settings or localStorage
  useEffect(() => {
    if (isLoaded) {
      const userTheme = (user?.publicMetadata as { settings?: UserSettings })?.settings?.theme;
      const savedTheme = userTheme || localStorage.getItem('theme') as Theme || 'dark';
      setThemeState(savedTheme);
      applyTheme(savedTheme);
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    // Update the data-theme attribute for additional styling hooks
    root.setAttribute('data-theme', newTheme);
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Update user settings if logged in
    if (user) {
      try {
        const currentSettings = (user.publicMetadata as { settings?: UserSettings })?.settings || {};
        await updateUser({
          userId: user.id,
          publicMetadata: {
            ...user.publicMetadata,
            settings: {
              ...currentSettings,
              theme: newTheme,
            },
          },
        });
      } catch (error) {
        console.error('Failed to update theme setting:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
