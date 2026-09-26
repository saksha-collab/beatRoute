"use client";

import Link from "next/link";
import { Compass, Music, Sparkles } from "lucide-react";
import { ViewToggle } from "./view-toggle";
import { Badge } from "@/components/ui/badge";

interface HeaderNavProps {
  view: "list" | "map";
  onViewChange: (view: "list" | "map") => void;
  tourMode: "curated" | "live";
  onTourModeChange?: (mode: "curated" | "live") => void;
}

export function HeaderNav({
  view,
  onViewChange,
  tourMode,
  onTourModeChange,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-glowCyan group-hover:scale-105 transition-transform duration-200">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-text-primary">
                  Beat<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Route</span>
                </span>
                <span className="hidden sm:inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/40">
                  v1.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-text-muted">
                All-India Live Concert & Tour Radar
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Mode indicator */}
        <div className="hidden lg:flex items-center gap-2">
          {onTourModeChange ? (
            <div className="flex items-center rounded-lg bg-surface-elevated p-1 border border-border-subtle">
              <button
                type="button"
                onClick={() => onTourModeChange("curated")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  tourMode === "curated"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Featured Tours
              </button>
              <button
                type="button"
                onClick={() => onTourModeChange("live")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  tourMode === "live"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Music className="h-3 w-3" />
                Live Artist Search
              </button>
            </div>
          ) : (
            <Badge variant={tourMode === "live" ? "live" : "curated"} pulsingDot={tourMode === "live"}>
              {tourMode === "live" ? "Live Concert API" : "Featured Tours (India)"}
            </Badge>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>
    </header>
  );
}
