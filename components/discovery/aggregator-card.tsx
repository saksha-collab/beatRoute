"use client";

import * as React from "react";
import { MapPin, Calendar, Ticket } from "lucide-react";
import { CatalogItem } from "@/lib/types";

interface AggregatorCardProps {
  item: CatalogItem;
  isSelected?: boolean;
  onSelect: (item: CatalogItem) => void;
  travelSavingsINR?: number;
}

export function AggregatorCard({
  item,
  isSelected = false,
  onSelect,
}: AggregatorCardProps) {
  const isBMS = item.source === "bookmyshow";
  const isDistrict = item.source === "district";

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Multiple Dates";

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 sm:gap-4 ${
        isSelected
          ? "bg-surface border-accent-dune ring-1 ring-accent-dune/40 shadow-sm"
          : "bg-surface border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40"
      }`}
    >
      {/* Poster Image */}
      <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-surface-elevated shrink-0 overflow-hidden border border-border-subtle/80">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-elevated text-text-muted">
            <Ticket className="h-5 w-5 opacity-40" />
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Source & Date line */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
              isBMS
                ? "bg-rose-500/10 text-rose-800"
                : isDistrict
                ? "bg-indigo-500/10 text-indigo-800"
                : "bg-surface-elevated text-text-muted"
            }`}
          >
            {isBMS ? "BookMyShow" : isDistrict ? "District" : "Box Office"}
          </span>

          <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <Calendar className="h-3 w-3 opacity-60" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate group-hover:text-accent-dune transition-colors">
          {item.title}
        </h3>

        {/* Venue & City */}
        <p className="text-xs text-text-muted truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0 opacity-60" />
          <span>{item.venue ? `${item.venue}, ${item.cityName}` : item.cityName}</span>
        </p>
      </div>

      {/* Right Price & Arrow */}
      <div className="text-right shrink-0 pl-2">
        <span className="text-[10px] uppercase font-medium text-text-muted block">
          From
        </span>
        <span className="text-sm sm:text-base font-black text-text-primary font-mono">
          {item.startingPriceINR ? `₹${item.startingPriceINR.toLocaleString()}` : "Free"}
        </span>
      </div>
    </div>
  );
}
