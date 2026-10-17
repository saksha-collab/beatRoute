"use client";

import * as React from "react";
import { Search, X, Filter, Sparkles, ArrowUpDown } from "lucide-react";

export type PlatformFilter = "all" | "bookmyshow" | "district";
export type SortOption = "cheapest" | "date" | "savings";

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

const TRENDING_SEARCHES = {
  concerts: ["Coldplay", "Diljit Dosanjh", "Dua Lipa", "Lollapalooza", "Sunburn"],
  movies: ["Drishyam", "IMAX", "Action", "Drama", "Comedy"],
  events: ["Standup Comedy", "Food Fest", "Nightlife", "Live Theatre"],
};

export function AggregatorSearchBar({
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  sortBy,
  onSortByChange,
  placeholder = "Search by title, artist, venue, or language...",
  category,
}: AggregatorSearchBarProps) {
  const suggestions = TRENDING_SEARCHES[category] || TRENDING_SEARCHES.concerts;

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-surface border border-border-strong shadow-sm">
      {/* Search Bar & Platform Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Search input (7 cols) */}
        <div className="relative sm:col-span-7 flex items-center">
          <div className="absolute left-3.5 text-text-muted pointer-events-none">
            <Search className="h-4 w-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary placeholder:text-text-muted text-xs sm:text-sm focus:outline-none focus:border-accent-dune focus:ring-1 focus:ring-accent-dune transition-all"
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Platform source select (3 cols) */}
        <div className="sm:col-span-3">
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => onPlatformFilterChange(e.target.value as PlatformFilter)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary text-xs font-semibold focus:outline-none focus:border-accent-dune transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Sources (BMS + District)</option>
              <option value="bookmyshow">BookMyShow only</option>
              <option value="district">District by Zomato only</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <Filter className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Sort select (2 cols) */}
        <div className="sm:col-span-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary text-xs font-semibold focus:outline-none focus:border-accent-dune transition-all appearance-none cursor-pointer"
            >
              <option value="cheapest">Cheapest First</option>
              <option value="date">Date: Earliest</option>
              <option value="savings">Best Savings</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <ArrowUpDown className="h-3 w-3" />
            </div>
          </div>
        </div>

      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs pt-1">
        <span className="text-text-muted font-medium shrink-0 flex items-center gap-1 text-[11px]">
          <Sparkles className="h-3 w-3 text-accent-dune" />
          Trending:
        </span>
        <div className="flex items-center gap-1.5 min-w-max">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => onSearchChange(item)}
              className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle text-[11px] font-medium transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
