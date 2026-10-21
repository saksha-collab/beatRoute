"use client";

import * as React from "react";
import { Search, X, ArrowUpDown } from "lucide-react";

export type PlatformFilter = "all" | "bookmyshow" | "district";
export type SortOption = "cheapest" | "date" | "platforms";

interface AggregatorSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (p: PlatformFilter) => void;
  sortBy: SortOption;
  onSortByChange: (s: SortOption) => void;
  placeholder?: string;
  category: "concerts" | "movies" | "events";
}

export function AggregatorSearchBar({
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  sortBy,
  onSortByChange,
  placeholder = "Search by artist, movie, comedy club, or venue...",
}: AggregatorSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 rounded-2xl bg-surface border border-border-subtle shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3.5 text-text-muted pointer-events-none">
          <Search className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated focus:bg-surface text-text-primary placeholder:text-text-muted text-xs sm:text-sm border border-transparent focus:border-border-strong focus:outline-none transition-all"
        />

        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 p-1 rounded-md text-text-muted hover:text-text-primary transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Platform Source Pill Selector */}
      <div className="flex items-center gap-1 bg-surface-elevated/40 p-1 rounded-xl border border-border-subtle/50 shrink-0">
        <button
          onClick={() => onPlatformFilterChange("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            platformFilter === "all"
              ? "bg-surface text-text-primary shadow-xs border border-border-subtle"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          All Platforms
        </button>
        <button
          onClick={() => onPlatformFilterChange("bookmyshow")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            platformFilter === "bookmyshow"
              ? "bg-surface text-text-primary shadow-xs border border-border-subtle"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          BookMyShow
        </button>
        <button
          onClick={() => onPlatformFilterChange("district")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            platformFilter === "district"
              ? "bg-surface text-text-primary shadow-xs border border-border-subtle"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          District
        </button>
      </div>

      {/* Sort Selector */}
      <div className="relative shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortOption)}
          className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated text-text-primary text-xs font-semibold border border-transparent hover:border-border-subtle focus:border-border-strong focus:outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="cheapest">Price: Lowest Active</option>
          <option value="date">Date: Earliest</option>
          <option value="platforms">Multi-Platform First</option>
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <ArrowUpDown className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
