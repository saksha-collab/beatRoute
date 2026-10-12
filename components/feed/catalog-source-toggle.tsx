"use client";

import * as React from "react";
import { Sparkles, Radio, Layers } from "lucide-react";

export type CatalogSourceFilter = "all" | "curated" | "bookmyshow";

interface CatalogSourceToggleProps {
  currentSource: CatalogSourceFilter;
  onChangeSource: (source: CatalogSourceFilter) => void;
  counts: {
    all: number;
    curated: number;
    bookmyshow: number;
  };
}

export function CatalogSourceToggle({
  currentSource,
  onChangeSource,
  counts,
}: CatalogSourceToggleProps) {
  const tabs = [
    {
      id: "curated" as CatalogSourceFilter,
      label: "Mega-Tours",
      icon: Sparkles,
      count: counts.curated,
      description: "Stadium & Arena Tours",
      activeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
    },
    {
      id: "bookmyshow" as CatalogSourceFilter,
      label: "BookMyShow Live",
      icon: Radio,
      count: counts.bookmyshow,
      description: "Real-time City Discovery",
      activeColor: "bg-rose-500/20 text-rose-300 border-rose-500/50",
    },
    {
      id: "all" as CatalogSourceFilter,
      label: "All Shows",
      icon: Layers,
      count: counts.all,
      description: "Complete Master Feed",
      activeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
    },
  ];

  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-elevated/70 border border-border-subtle backdrop-blur-md overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentSource === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeSource(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
              isActive
                ? `${tab.activeColor} shadow-md`
                : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? "animate-pulse" : ""}`} />
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isActive
                  ? "bg-white/10 text-white"
                  : "bg-surface text-text-muted border border-border-subtle"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
