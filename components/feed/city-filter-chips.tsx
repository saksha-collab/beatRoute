"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export interface CityOption {
  code: string;
  name: string;
  count: number;
}

interface CityFilterChipsProps {
  options: CityOption[];
  selectedCity: string;
  onSelectCity: (cityCode: string) => void;
  className?: string;
}

export function CityFilterChips({
  options,
  selectedCity,
  onSelectCity,
  className = "",
}: CityFilterChipsProps) {
  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar py-1", className)}>
      <div className="flex items-center gap-2 min-w-max">
        {options.map((option) => {
          const isSelected =
            (selectedCity === "" && option.code === "ALL") ||
            selectedCity.toUpperCase() === option.code.toUpperCase();

          return (
            <button
              key={option.code}
              onClick={() => onSelectCity(option.code)}
              className={cn(
                "group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
                isSelected
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border-cyan-500/50 shadow-glowCyan"
                  : "bg-surface-elevated/70 text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary hover:bg-surface-elevated"
              )}
            >
              {option.code !== "ALL" && (
                <MapPin
                  className={cn(
                    "h-3 w-3 transition-colors",
                    isSelected ? "text-cyan-400" : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
              )}
              <span>{option.name}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isSelected
                    ? "bg-cyan-500/30 text-cyan-200 font-bold"
                    : "bg-surface border border-border-subtle text-text-muted"
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
