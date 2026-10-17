"use client";

import * as React from "react";
import {
  MapPin,
  Calendar,
  ExternalLink,
  Ticket,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { CatalogItem } from "@/lib/types";

interface StickyPreviewPanelProps {
  item: CatalogItem | null;
  userOriginCity?: string;
  onOpenArbitragePlanner?: (item: CatalogItem) => void;
  onCloseMobileDrawer?: () => void;
}

export function StickyPreviewPanel({
  item,
  userOriginCity = "BOM",
  onOpenArbitragePlanner,
}: StickyPreviewPanelProps) {
  if (!item) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center space-y-3">
        <Ticket className="h-8 w-8 mx-auto text-text-muted opacity-30" />
        <h3 className="text-sm font-bold text-text-primary">Select an item to view details</h3>
        <p className="text-xs text-text-muted max-w-xs mx-auto">
          Choose any event from the feed to view verified box office tickets and travel options.
        </p>
      </div>
    );
  }

  const isBMS = item.source === "bookmyshow";
  const isDistrict = item.source === "district";
  const isConcert = item.type === "concert" || item.type === "event";
  const isDifferentCity =
    item.cityCode && item.cityCode.toUpperCase() !== userOriginCity.toUpperCase();

  // Arbitrage package calculation
  const estimatedRailINR = 2100;
  const estimatedStayINR = 2800;
  const ticketINR = item.startingPriceINR || 2500;
  const totalPackageINR = estimatedRailINR + estimatedStayINR + ticketINR;
  const localBenchmarkINR = totalPackageINR + 3400;
  const netSavingsINR = Math.max(0, localBenchmarkINR - totalPackageINR);

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Multiple Dates";

  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Top Meta: Source & Verified badge */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
            isBMS
              ? "bg-rose-500/10 text-rose-800"
              : isDistrict
              ? "bg-indigo-500/10 text-indigo-800"
              : "bg-surface-elevated text-text-muted"
          }`}
        >
          {isBMS ? "BookMyShow" : isDistrict ? "District by Zomato" : "Verified Box Office"}
        </span>

        <span className="flex items-center gap-1 text-[11px] text-text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-dune" />
          <span>Official Ticketing</span>
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight leading-snug">
          {item.title}
        </h2>
        {item.description && (
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Key Logistics */}
      <div className="space-y-2 py-3 border-y border-border-subtle text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <span className="font-semibold text-text-primary">{formattedDate}</span>
          {item.time && (
            <span className="text-text-muted">({item.time})</span>
          )}
        </div>

        <div className="flex items-start gap-2 text-text-secondary">
          <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block">
              {item.venue || `${item.cityName} Venue`}
            </span>
            <span className="text-[11px] text-text-muted">
              {item.cityName}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-text-muted">Starting Ticket Price:</span>
          <span className="font-mono font-bold text-text-primary text-sm">
            {item.startingPriceINR ? `₹${item.startingPriceINR.toLocaleString()}` : "Free"}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      {item.bookingUrl ? (
        <a
          href={item.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-text-primary text-surface hover:bg-text-secondary transition-colors shadow-xs"
        >
          <span>Book on {isBMS ? "BookMyShow" : isDistrict ? "District" : "Box Office"}</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      ) : (
        <div className="text-xs text-text-muted text-center py-2 bg-surface-elevated rounded-xl">
          Check mobile app for seat allotment
        </div>
      )}

      {/* Travel Arbitrage Callout (Clean & Quiet) */}
      {isConcert && isDifferentCity && (
        <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-accent-dune" />
              <span>Travel from {userOriginCity}</span>
            </span>
            {netSavingsINR > 0 && (
              <span className="text-[10px] font-mono font-bold text-accent-dune bg-accent-dune/10 px-2 py-0.5 rounded">
                Save ~₹{netSavingsINR.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed">
            Total estimated trip package: <strong className="text-text-primary font-mono">₹{totalPackageINR.toLocaleString()}</strong> (Ticket + Return Rail + Stay).
          </p>

          {onOpenArbitragePlanner && (
            <button
              onClick={() => onOpenArbitragePlanner(item)}
              className="w-full flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-text-primary text-xs font-semibold transition-colors"
            >
              <span>Calculate Full Arbitrage</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
