"use client";

import * as React from "react";
import { MapPin, Calendar, Ticket, Film, Music, Sparkles } from "lucide-react";
import { CatalogItem } from "@/lib/types";

interface AggregatorCardProps {
  item: CatalogItem;
  isSelected?: boolean;
  onSelect: (item: CatalogItem) => void;
}

export function AggregatorCard({
  item,
  isSelected = false,
  onSelect,
}: AggregatorCardProps) {
  const [imgError, setImgError] = React.useState(false);

  // Reset image error if poster URL changes
  React.useEffect(() => {
    setImgError(false);
  }, [item.posterUrl]);

  const platforms =
    item.availablePlatforms && item.availablePlatforms.length > 0
      ? item.availablePlatforms
      : [item.source];

  const hasBMS = platforms.includes("bookmyshow");
  const hasDistrict = platforms.includes("district");
  const isMultiPlatform = platforms.length > 1;
  const isMovie = item.type === "movie";
  const isSoldOut = item.ticketStatus === "sold_out";

  const formattedDate = isMovie
    ? item.languages?.join(" • ") || "Now Showing"
    : item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Upcoming";

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 sm:gap-4 ${
        isSelected
          ? "bg-surface border-accent-dune ring-1 ring-accent-dune/40 shadow-sm"
          : "bg-surface border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40"
      }`}
    >
      {/* Poster Image with Graceful Fallback (Never Renders a Broken Image Icon) */}
      <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-surface-elevated shrink-0 overflow-hidden border border-border-subtle/80">
        {item.posterUrl && !imgError ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-elevated text-text-muted p-1.5 text-center">
            {isMovie ? (
              <Film className="h-5 w-5 text-accent-dune opacity-70 mb-1" />
            ) : item.type === "concert" ? (
              <Music className="h-5 w-5 text-accent-dune opacity-70 mb-1" />
            ) : (
              <Ticket className="h-5 w-5 text-accent-dune opacity-70 mb-1" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-tight line-clamp-2 text-text-secondary">
              {item.category || item.type}
            </span>
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Platform Badges & Date Line */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {hasBMS && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-rose-500/10 text-rose-800">
              {isMultiPlatform || isMovie ? "BookMyShow" : "BMS Exclusive"}
            </span>
          )}

          {hasDistrict && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-800">
              {isMultiPlatform || isMovie ? "District" : "District Exclusive"}
            </span>
          )}

          {isSoldOut && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-neutral-500/15 text-text-muted">
              Sold Out
            </span>
          )}

          {!isSoldOut && item.hasSoldOutEarlyPhases && item.activePhaseName && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-800">
              {item.activePhaseName}
            </span>
          )}

          <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <Calendar className="h-3 w-3 opacity-60" />
            <span>{formattedDate}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate group-hover:text-accent-dune transition-colors">
          {item.title}
        </h3>

        {/* Venue & City */}
        <p className="text-xs text-text-muted truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0 opacity-60" />
          <span>{item.venue ? `${item.venue}` : item.cityName}</span>
        </p>
      </div>

      {/* Right Column: Honest Price or Movie Checkout Comparison Callout */}
      <div className="text-right shrink-0 pl-2">
        {isMovie ? (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-800">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Compare Fees</span>
            </span>
            <span className="text-[11px] font-semibold text-text-secondary block">
              Save up to ₹500
            </span>
            <span className="text-[10px] text-text-muted block">
              BMS vs District vs PVR
            </span>
          </div>
        ) : (
          <div>
            {item.hasSoldOutEarlyPhases &&
              item.lowestListedPriceINR &&
              item.startingPriceINR &&
              item.lowestListedPriceINR < item.startingPriceINR && (
                <span className="text-[10px] font-mono line-through text-text-muted block">
                  ₹{item.lowestListedPriceINR.toLocaleString()}
                </span>
              )}
            <span className="text-[10px] uppercase font-medium text-text-muted block">
              {isSoldOut ? "Last Phase" : "Active Tier"}
            </span>
            <span className="text-sm sm:text-base font-black text-text-primary font-mono">
              {item.startingPriceINR
                ? `₹${item.startingPriceINR.toLocaleString()}`
                : "TBA"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
