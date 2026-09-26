"use client";

import * as React from "react";
import { ConcertEvent } from "@/lib/types";
import { ConcertFeedCard } from "./concert-feed-card";
import { CityFilterChips, CityOption } from "./city-filter-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles, Filter, Music } from "lucide-react";

interface ConcertTimelineFeedProps {
  concerts: ConcertEvent[];
  cityOptions: CityOption[];
  selectedCity: string;
  onSelectCity: (cityCode: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLiveSearchSubmit: (artistName: string) => void;
  isSearchingLive: boolean;
}

const FEATURED_ARTIST_SUGGESTIONS = [
  "Coldplay",
  "Diljit Dosanjh",
  "Dua Lipa",
  "Alan Walker",
  "Bryan Adams",
  "Karan Aujla",
  "Cigarettes After Sex",
];

export function ConcertTimelineFeed({
  concerts,
  cityOptions,
  selectedCity,
  onSelectCity,
  searchQuery,
  onSearchChange,
  onLiveSearchSubmit,
  isSearchingLive,
}: ConcertTimelineFeedProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onLiveSearchSubmit(searchQuery.trim());
    }
  };

  const handleClearFilters = () => {
    onSearchChange("");
    onSelectCity("ALL");
  };

  const isFiltered = (selectedCity && selectedCity !== "ALL") || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Search & Discovery Header Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border-strong backdrop-blur-md space-y-4 shadow-xl">
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-text-muted pointer-events-none">
            <Search className="h-4 w-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by artist, city, venue, or genre (e.g. 'Coldplay', 'Mumbai', 'Rock')..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                title="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <Button
              variant="neon"
              size="sm"
              onClick={() => onLiveSearchSubmit(searchQuery)}
              disabled={isSearchingLive || !searchQuery.trim()}
              className="h-8 px-3 text-xs font-bold"
            >
              {isSearchingLive ? "Searching..." : "Live Search"}
            </Button>
          </div>
        </div>

        {/* Quick Artist Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <span className="text-text-muted font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Trending:
          </span>
          <div className="flex items-center gap-1.5 min-w-max">
            {FEATURED_ARTIST_SUGGESTIONS.map((artist) => (
              <button
                key={artist}
                onClick={() => {
                  onSearchChange(artist);
                  onLiveSearchSubmit(artist);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-elevated text-text-secondary hover:text-cyan-300 hover:bg-cyan-500/10 border border-border-subtle hover:border-cyan-500/30 transition-all text-[11px]"
              >
                {artist}
              </button>
            ))}
          </div>
        </div>

        {/* City Filter Chips */}
        <div className="pt-2 border-t border-border-subtle">
          <CityFilterChips
            options={cityOptions}
            selectedCity={selectedCity}
            onSelectCity={onSelectCity}
          />
        </div>
      </div>

      {/* Active Filter Bar Summary */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="font-semibold text-text-primary font-mono text-sm">
            {concerts.length}
          </span>
          <span>
            {concerts.length === 1 ? "Concert Date Found" : "Concerts Found Across India"}
          </span>
          {selectedCity && selectedCity !== "ALL" && (
            <span className="text-cyan-400 font-semibold">in {selectedCity}</span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-cyan-400 transition-colors"
          >
            <Filter className="h-3 w-3" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Concert Feed Cards List */}
      {concerts.length > 0 ? (
        <div className="space-y-4">
          {concerts.map((concert) => (
            <ConcertFeedCard key={concert.id} concert={concert} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Concerts Found"
          message={
            searchQuery
              ? `No upcoming Indian tour dates matching "${searchQuery}". Try searching for another artist or explore trending Indian tours.`
              : "No concerts found for the selected city filter."
          }
          actionText="Reset Filters"
          onAction={handleClearFilters}
        />
      )}
    </div>
  );
}
