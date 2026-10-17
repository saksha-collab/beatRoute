"use client";

import Link from "next/link";
import { Compass, MapPin, RefreshCw, ChevronDown, Globe } from "lucide-react";
import { ViewToggle } from "./view-toggle";

interface HeaderNavProps {
  view: "list" | "map";
  onViewChange: (view: "list" | "map") => void;
  selectedCity?: string;
  onOpenCityModal?: () => void;
  isValidating?: boolean;
  ageMinutes?: number;
  onRefreshLive?: () => void;
  showViewToggle?: boolean;
}

export function HeaderNav({
  view,
  onViewChange,
  selectedCity = "BOM",
  onOpenCityModal,
  isValidating,
  ageMinutes,
  onRefreshLive,
  showViewToggle = false,
}: HeaderNavProps) {
  const isAll = selectedCity.toUpperCase() === "ALL";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-dune text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-text-primary">
                Beat<span className="text-accent-dune">Route</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right: City Switcher & Freshness Indicator */}
        <div className="flex items-center gap-3">
          {/* City Switcher Pill */}
          {onOpenCityModal && (
            <button
              onClick={onOpenCityModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary text-xs font-semibold transition-all shadow-xs"
              title="Click to change city"
            >
              {isAll ? (
                <Globe className="h-3.5 w-3.5 text-accent-dune" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-accent-dune" />
              )}
              <span>{isAll ? "All India" : selectedCity}</span>
              <ChevronDown className="h-3 w-3 text-text-muted" />
            </button>
          )}

          {/* Subtle Live Sync Indicator */}
          {isValidating ? (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-dune/10 text-accent-dune text-[11px] font-medium">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Syncing...</span>
            </span>
          ) : ageMinutes !== undefined ? (
            <button
              onClick={onRefreshLive}
              title="Click to check for live updates"
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-text-muted hover:text-text-primary transition-colors text-[11px]"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{ageMinutes === 0 ? "Live" : `${ageMinutes}m`}</span>
            </button>
          ) : null}

          {/* View Toggle (Only shown when relevant) */}
          {showViewToggle && (
            <div className="pl-2 border-l border-border-subtle">
              <ViewToggle view={view} onChange={onViewChange} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
