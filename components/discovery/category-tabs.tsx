"use client";

import * as React from "react";
import { Music, Film, Ticket } from "lucide-react";

export type AggregatorCategory = "concerts" | "movies" | "events" | "arbitrage";

interface CategoryTabsProps {
  activeCategory: AggregatorCategory;
  onSelectCategory: (cat: AggregatorCategory) => void;
  counts?: {
    concerts: number;
    movies: number;
    events: number;
  };
}

export function CategoryTabs({
  activeCategory,
  onSelectCategory,
  counts,
}: CategoryTabsProps) {
  const tabs = [
    {
      id: "concerts" as const,
      label: "Concerts & Gigs",
      icon: Music,
      count: counts?.concerts,
    },
    {
      id: "movies" as const,
      label: "Cinema & Movies",
      icon: Film,
      count: counts?.movies,
    },
    {
      id: "events" as const,
      label: "Comedy & Events",
      icon: Ticket,
      count: counts?.events,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeCategory === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectCategory(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              isActive
                ? "bg-text-primary text-surface shadow-sm"
                : "bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-border-subtle"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-accent-dune" : "text-text-muted"}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? "bg-surface/20 text-surface"
                    : "bg-surface-elevated text-text-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
