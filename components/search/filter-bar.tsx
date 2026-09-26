"use client";

import * as React from "react";
import {
  Plane,
  Train,
  Hotel,
  MapPin,
  Search,
  Music,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { CITIES, FEATURED_TOURS } from "@/lib/mock-data";
import { CityCode, RailClass, StayPreference, TransitMode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  origin: CityCode;
  onOriginChange: (origin: CityCode) => void;
  tourId: string;
  onTourIdChange: (tourId: string) => void;
  transitMode: TransitMode;
  onTransitModeChange: (mode: TransitMode) => void;
  railClass: RailClass;
  onRailClassChange: (railClass: RailClass) => void;
  stayPreference: StayPreference;
  onStayPreferenceChange: (pref: StayPreference) => void;
  selectedTierId: string;
  onTierChange: (tierId: string) => void;
  tourMode: "curated" | "live";
  onTourModeChange: (mode: "curated" | "live") => void;
  liveArtistQuery: string;
  onLiveArtistQueryChange: (query: string) => void;
  onSearchLiveArtist: () => void;
  isSearchingLive?: boolean;
}

const QUICK_ARTISTS = [
  { name: "Coldplay", curatedId: "coldplay" },
  { name: "Ed Sheeran", isLive: true },
  { name: "Alan Walker", isLive: true },
  { name: "Diljit Dosanjh", curatedId: "diljit-dosanjh" },
  { name: "Karan Aujla", curatedId: "karan-aujla" },
  { name: "Bryan Adams", isLive: true },
];

export function FilterBar({
  origin,
  onOriginChange,
  tourId,
  onTourIdChange,
  transitMode,
  onTransitModeChange,
  railClass,
  onRailClassChange,
  stayPreference,
  onStayPreferenceChange,
  selectedTierId,
  onTierChange,
  tourMode,
  onTourModeChange,
  liveArtistQuery,
  onLiveArtistQueryChange,
  onSearchLiveArtist,
  isSearchingLive = false,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const selectedTour = FEATURED_TOURS.find((t) => t.id === tourId) || FEATURED_TOURS[0];
  const availableTiers = selectedTour?.stops[0]?.ticketTiers || [];

  return (
    <div className="space-y-3">
      {/* 1. Main Search & Artist Pill Bar */}
      <div className="rounded-2xl border border-border-subtle bg-surface/90 p-3 sm:p-4 shadow-xl backdrop-blur-xl space-y-3">
        {/* Search input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (liveArtistQuery.trim()) {
              onTourModeChange("live");
              onSearchLiveArtist();
            }
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          {/* Origin selector pill */}
          <div className="flex items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2 border border-border-subtle shrink-0">
            <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Traveling From
              </span>
              <select
                value={origin}
                onChange={(e) => onOriginChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer pr-2"
              >
                {CITIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-surface text-text-primary">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Artist search input */}
          <div className="relative flex-1 flex items-center">
            <Music className="absolute left-3.5 h-4 w-4 text-indigo-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search artist tour (e.g. Coldplay, Ed Sheeran, Alan Walker, Diljit)..."
              value={liveArtistQuery}
              onChange={(e) => onLiveArtistQueryChange(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface-elevated pl-10 pr-24 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            <Button
              type="submit"
              variant="neon"
              size="sm"
              disabled={isSearchingLive || !liveArtistQuery.trim()}
              className="absolute right-1.5 font-bold shadow-sm"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              {isSearchingLive ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Mode Switcher (Flight / Train) */}
          <div className="flex items-center rounded-xl bg-surface-elevated p-1 border border-border-subtle shrink-0 self-center">
            <button
              type="button"
              onClick={() => onTransitModeChange("flight")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                transitMode === "flight"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Plane className="h-3.5 w-3.5 text-cyan-400" />
              <span>Flights</span>
            </button>
            <button
              type="button"
              onClick={() => onTransitModeChange("rail")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                transitMode === "rail"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Train className="h-3.5 w-3.5 text-amber-400" />
              <span>Railways</span>
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="rounded-xl px-3 py-2 shrink-0 gap-1.5 text-xs text-text-secondary"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preferences</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </Button>
        </form>

        {/* Quick Artist Recommendation Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Trending:
          </span>
          {QUICK_ARTISTS.map((artist) => {
            const isCurrent =
              tourMode === "curated"
                ? artist.curatedId === tourId
                : liveArtistQuery.toLowerCase() === artist.name.toLowerCase();

            return (
              <button
                key={artist.name}
                type="button"
                onClick={() => {
                  if (artist.curatedId) {
                    onTourModeChange("curated");
                    onTourIdChange(artist.curatedId);
                    onLiveArtistQueryChange("");
                  } else {
                    onTourModeChange("live");
                    onLiveArtistQueryChange(artist.name);
                    // Trigger search automatically for live chip
                    setTimeout(() => {
                      onSearchLiveArtist();
                    }, 50);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isCurrent
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-transparent shadow-glowCyan scale-[1.02]"
                    : "bg-surface-elevated text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary"
                }`}
              >
                {artist.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Expandable Preferences Drawer / Row (Hotel Tier & Rail Class) */}
      {showAdvanced && (
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated/95 p-4 shadow-lg animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Rail Class */}
          {transitMode === "rail" && (
            <div className="space-y-1.5">
              <span className="font-semibold text-text-secondary">Rail Class</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["SL", "3AC", "2AC", "VANDE_BHARAT"] as RailClass[]).map((cls) => (
                  <Button
                    key={cls}
                    type="button"
                    variant={railClass === cls ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRailClassChange(cls)}
                    className="text-xs"
                  >
                    {cls === "VANDE_BHARAT" ? "VB" : cls}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stay Preference */}
          <div className="space-y-1.5">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Hotel className="h-3.5 w-3.5 text-purple-400" />
              1-Night Stay Tier
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["budget", "comfort", "luxury"] as StayPreference[]).map((pref) => (
                <Button
                  key={pref}
                  type="button"
                  variant={stayPreference === pref ? "default" : "secondary"}
                  size="sm"
                  onClick={() => onStayPreferenceChange(pref)}
                  className="capitalize text-xs"
                >
                  {pref}
                </Button>
              ))}
            </div>
          </div>

          {/* Dynamic Ticket Tier */}
          {availableTiers.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-semibold text-text-secondary">Ticket Tier Level</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableTiers.map((tier) => (
                  <Button
                    key={tier.tierId}
                    type="button"
                    variant={selectedTierId === tier.tierId ? "savings" : "outline"}
                    size="sm"
                    onClick={() => onTierChange(tier.tierId)}
                    className="text-xs"
                  >
                    {tier.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
