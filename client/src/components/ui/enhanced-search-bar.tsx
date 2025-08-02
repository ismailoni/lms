"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "popular" | "course";
  icon?: React.ReactNode;
  category?: string;
}

interface EnhancedSearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  showSuggestions?: boolean;
  suggestions?: SearchSuggestion[];
  className?: string;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EnhancedSearchBar({
  placeholder = "Search courses...",
  onSearch,
  onClear,
  showSuggestions = true,
  suggestions = [],
  className,
  autoFocus = false,
  size = "md",
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const defaultSuggestions: SearchSuggestion[] = [
    {
      id: "1",
      text: "React Development",
      type: "popular",
      icon: <TrendingUp className="w-4 h-4" />,
      category: "Web Development"
    },
    {
      id: "2", 
      text: "Python for Beginners",
      type: "course",
      icon: <BookOpen className="w-4 h-4" />,
      category: "Programming"
    },
    {
      id: "3",
      text: "Machine Learning",
      type: "recent",
      icon: <Clock className="w-4 h-4" />,
      category: "Data Science"
    },
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;
  const filteredSuggestions = allSuggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(query.toLowerCase())
  );

  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-12 text-base", 
    lg: "h-14 text-lg",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0 && showSuggestions);
    setFocusedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    onSearch(suggestion.text);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[focusedIndex]);
        } else if (query) {
          setIsOpen(false);
          onSearch(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setFocusedIndex(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "recent": return <Clock className="w-4 h-4 text-gray-400" />;
      case "popular": return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case "course": return <BookOpen className="w-4 h-4 text-green-400" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(query.length > 0 && showSuggestions)}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 pr-10 bg-customgreys-secondarybg/80 backdrop-blur-sm border border-gray-700/50 rounded-xl",
            "focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-customgreys-darkerGrey",
            "transition-all duration-300 group-focus-within:scale-105",
            sizeClasses[size]
          )}
        />

        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-600/50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Suggestions */}
      {isOpen && showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-customgreys-secondarybg/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in"
        >
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700/50">
              Suggestions
            </div>
            
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-3 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 group",
                  focusedIndex === index && "bg-blue-500/10 border-l-2 border-blue-500"
                )}
              >
                <div className="flex-shrink-0">
                  {suggestion.icon || getSuggestionIcon(suggestion.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                    {suggestion.text}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      in {suggestion.category}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-600">
                    {suggestion.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-700/50 p-2 bg-gray-800/30">
            <button
              onClick={() => {
                setIsOpen(false);
                onSearch(query);
              }}
              className="w-full px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search for &quot;{query}&quot;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
