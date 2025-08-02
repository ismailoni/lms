"use client";

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'switch' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  size = 'md',
  showLabel = false 
}) => {
  const { theme, setTheme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className={`bg-gray-300 rounded-full ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
        }`}></div>
      </div>
    );
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size === 'sm' ? 'sm' : 'default'}
            className="theme-toggle-dropdown"
          >
            {theme === 'dark' ? (
              <Moon className={iconSize} />
            ) : (
              <Sun className={iconSize} />
            )}
            {showLabel && <span className="ml-2">Theme</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-customgreys-primarybg border-gray-700">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 cursor-pointer"
          >
            <Sun className="w-4 h-4 mr-2" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 cursor-pointer"
          >
            <Moon className="w-4 h-4 mr-2" />
            Dark
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-3">
        {showLabel && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
        )}
        <button
          onClick={toggleTheme}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-300 hover:bg-gray-400'
            }
          `}
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Toggle theme"
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
            `}
          >
            {theme === 'dark' ? (
              <Moon className="w-3 h-3 text-blue-600 m-0.5" />
            ) : (
              <Sun className="w-3 h-3 text-orange-500 m-0.5" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={toggleTheme}
      className={`
        theme-toggle-button relative
        ${size === 'sm' ? 'p-2' : size === 'lg' ? 'p-3' : 'p-2.5'}
        text-customgreys-dirtyGrey hover:text-white-50 
        hover:bg-customgreys-secondarybg/50 
        transition-all duration-300
        rounded-full
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {theme === 'dark' ? (
          <Moon className={`${iconSize} transition-transform duration-300`} />
        ) : (
          <Sun className={`${iconSize} transition-transform duration-300`} />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm">
          {theme === 'dark' ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </Button>
  );
};

export default ThemeToggle;
