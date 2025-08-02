"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, BookOpen, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchFilters {
  category: string;
  priceRange: [number, number];
  level: string;
  duration: string;
  rating: number;
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
  placeholder?: string;
  showFilters?: boolean;
}

const CATEGORIES = [
  "All Categories",
  "Web Development",
  "Mobile Development", 
  "Data Science",
  "Machine Learning",
  "Business",
  "Design",
  "Marketing",
];

const LEVELS = [
  "All Levels",
  "Beginner",
  "Intermediate", 
  "Advanced",
];

const DURATIONS = [
  "Any Duration",
  "0-2 hours",
  "2-6 hours",
  "6+ hours",
];

export function EnhancedSearch({ 
  onSearch, 
  onClear, 
  placeholder = "Search courses, skills, instructors...",
  showFilters = true 
}: EnhancedSearchProps) {
  const [query, setQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: "All Categories",
    priceRange: [0, 200],
    level: "All Levels", 
    duration: "Any Duration",
    rating: 0,
  });

  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(() => {
    onSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, onSearch]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const clearFilters = () => {
    setQuery("");
    setFilters({
      category: "All Categories",
      priceRange: [0, 200],
      level: "All Levels",
      duration: "Any Duration", 
      rating: 0,
    });
    onClear();
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== "All Categories" && 
    value !== "All Levels" && 
    value !== "Any Duration" &&
    value !== 0 &&
    !(Array.isArray(value) && value[0] === 0 && value[1] === 200)
  ).length;

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-400 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-12 pr-4 py-3 bg-customgreys-secondarybg/80 border-gray-700/50 text-gray-300 placeholder-gray-500 focus:bg-customgreys-darkerGrey focus:border-blue-500/50 transition-all duration-300 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="gap-2 border-gray-700/50 text-gray-300 hover:bg-gray-700/50 relative"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={clearFilters}
          className="gap-2 border-gray-700/50 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && isFiltersOpen && (
        <Card className="bg-customgreys-secondarybg border-gray-700/50 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Category
                </label>
                <Select value={filters.category} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger className="bg-customgreys-primarybg border-gray-700/50 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-customgreys-primarybg border-gray-700/50">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-gray-300 hover:bg-gray-700/50">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Skill Level
                </label>
                <Select value={filters.level} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, level: value }))
                }>
                  <SelectTrigger className="bg-customgreys-primarybg border-gray-700/50 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-customgreys-primarybg border-gray-700/50">
                    {LEVELS.map(level => (
                      <SelectItem key={level} value={level} className="text-gray-300 hover:bg-gray-700/50">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </label>
                <Select value={filters.duration} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, duration: value }))
                }>
                  <SelectTrigger className="bg-customgreys-primarybg border-gray-700/50 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-customgreys-primarybg border-gray-700/50">
                    {DURATIONS.map(duration => (
                      <SelectItem key={duration} value={duration} className="text-gray-300 hover:bg-gray-700/50">
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <span>💰</span>
                  Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                  }
                  max={200}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-500/20 border-blue-500/50 text-blue-400"
                  onClick={() => setFilters(prev => ({ ...prev, category: "Web Development" }))}
                >
                  Web Development
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-green-500/20 border-green-500/50 text-green-400"
                  onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 0] }))}
                >
                  Free Courses
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-purple-500/20 border-purple-500/50 text-purple-400"
                  onClick={() => setFilters(prev => ({ ...prev, level: "Beginner" }))}
                >
                  Beginner Friendly
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                  onClick={() => setFilters(prev => ({ ...prev, duration: "0-2 hours" }))}
                >
                  Quick Learn
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
