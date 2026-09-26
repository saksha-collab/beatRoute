"use client";

import { LayoutGrid, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "map";
  onChange: (view: "list" | "map") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-surface-elevated p-1 border border-border-subtle shadow-inner">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
          view === "list"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>List View</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("map")}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
          view === "map"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
        <span>Concert Map</span>
      </button>
    </div>
  );
}
