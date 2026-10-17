"use client";

import Link from "next/link";
import { Compass, MapPin, RefreshCw, Clock, Globe } from "lucide-react";
import { ViewToggle } from "./view-toggle";

interface HeaderNavProps {
  view: "list" | "map";
  onViewChange: (view: "list" | "map") => void;
  selectedCity?: string;
  onOpenCityModal?: () => void;
  isValidating?: boolean;
  ageMinutes?: number;
  onRefreshLive?: () => void;
}

export function HeaderNav({
  view,
  onViewChange,
  selectedCity = "BOM",
  onOpenCityModal,
  isValidating,
  ageMinutes,
  onRefreshLive,
}: HeaderNavProps) {
  const isAll = selectedCity.toUpperCase() === "ALL";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-dune text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-text-primary">
                  Beat<span className="text-accent-dune">Route</span>
                </span>
                <span className="hidden sm:inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-elevated text-text-muted border border-border-subtle">
                  BMS & District
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-text-muted">
                Entertainment & Travel Arbitrage Aggregator
              </p>
            </div>
          </Link>
        </div>

        {/* Center: City Switcher & Freshness Indicator */}
        <div className="flex items-center gap-3">
          {/* City Switcher Pill */}
          {onOpenCityModal && (
            <button
              onClick={onOpenCityModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border-strong text-text-primary text-xs font-bold transition-all shadow-sm group"
              title="Click to change city"
            >
              {isAll ? (
                <Globe className="h-3.5 w-3.5 text-accent-dune" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-accent-dune" />
              )}
              <span>{isAll ? "All India" : selectedCity}</span>
              <span className="text-[10px] text-text-muted group-hover:text-accent-dune underline ml-0.5">
                Change
              </span>
            </button>
          )}

          {/* SWR Freshness Badge */}
          {isValidating ? (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-dune/10 border border-accent-dune/20 text-accent-dune text-[11px] font-medium">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Syncing live...</span>
            </span>
          ) : ageMinutes !== undefined ? (
            <button
              onClick={onRefreshLive}
              title="Click to check for live updates"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border-subtle text-text-muted hover:text-text-primary transition-all text-[11px]"
            >
              <Clock className="h-3 w-3" />
              <span>{ageMinutes === 0 ? "Live right now" : `${ageMinutes}m ago`}</span>
              <RefreshCw className="h-2.5 w-2.5 ml-0.5 opacity-60 hover:opacity-100" />
            </button>
          ) : null}
        </div>

        {/* Right: View Toggle */}
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>
    </header>
  );
}
