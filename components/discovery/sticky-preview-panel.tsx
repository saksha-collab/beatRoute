"use client";

import * as React from "react";
import {
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  Ticket,
  Compass,
  Train,
  Hotel,
  Sparkles,
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
  onCloseMobileDrawer,
}: StickyPreviewPanelProps) {
  if (!item) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center space-y-3">
        <Ticket className="h-10 w-10 mx-auto text-text-muted opacity-40" />
        <h3 className="text-base font-bold text-text-primary">Select an item to preview</h3>
        <p className="text-xs text-text-muted max-w-xs mx-auto">
          Click any concert, movie, or live show in the list to compare box office tickets and travel options.
        </p>
      </div>
    );
  }

  const isBMS = item.source === "bookmyshow";
  const isDistrict = item.source === "district";
  const isConcert = item.type === "concert" || item.type === "event";
  const isDifferentCity =
    item.cityCode && item.cityCode.toUpperCase() !== userOriginCity.toUpperCase();

  // Mock travel estimates for concerts in different cities
  const estimatedRailINR = 2100;
  const estimatedStayINR = 2800;
  const ticketINR = item.startingPriceINR || 2500;
  const totalPackageINR = estimatedRailINR + estimatedStayINR + ticketINR;
  const localBenchmarkINR = totalPackageINR + 3400; // Benchmark showing savings
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
    <div className="rounded-2xl bg-surface border border-border-strong shadow-lg p-5 sm:p-6 space-y-5">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-dune/10 text-accent-dune font-mono">
            {item.category || item.type.toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#2E7D32]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Box Office</span>
          </span>
        </div>

        <h2 className="text-xl font-black text-text-primary tracking-tight leading-snug">
          {item.title}
        </h2>

        {item.description && (
          <p className="text-xs text-text-muted line-clamp-3">
            {item.description}
          </p>
        )}
      </div>

      {/* Date, Timing, & Venue specs */}
      <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-2 text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="h-3.5 w-3.5 text-accent-dune shrink-0" />
          <span className="font-semibold text-text-primary">{formattedDate}</span>
          {item.time && (
            <>
              <span className="text-border-strong">•</span>
              <span className="text-text-muted">{item.time}</span>
            </>
          )}
        </div>

        <div className="flex items-start gap-2 text-text-secondary">
          <MapPin className="h-3.5 w-3.5 text-accent-dune shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block">
              {item.venue || `${item.cityName} Venue`}
            </span>
            <span className="text-[11px] text-text-muted">
              {item.cityName} ({item.cityCode || "India"})
            </span>
          </div>
        </div>
      </div>

      {/* Platform & Pricing Box */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          Official Box Office
        </span>

        <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-elevated/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">
              {isBMS ? "BookMyShow" : isDistrict ? "District by Zomato" : "Verified Partner"}
            </span>
            <span className="font-mono font-bold text-text-primary text-sm">
              {item.startingPriceINR ? `From ₹${item.startingPriceINR.toLocaleString()}` : "Price on Request"}
            </span>
          </div>

          {item.bookingUrl ? (
            <a
              href={item.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-text-primary text-surface hover:opacity-90 transition-all shadow-sm"
            >
              <span>Book on {isBMS ? "BookMyShow" : isDistrict ? "District" : "Partner"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="text-[11px] text-text-muted text-center py-1">
              Check app for live seat allotment
            </div>
          )}
        </div>
      </div>

      {/* Travel Arbitrage Estimator (for concerts in other cities) */}
      {isConcert && isDifferentCity && (
        <div className="p-4 rounded-xl border border-border-strong bg-surface-elevated space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-dune flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Travel from {userOriginCity}?</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8EFE8] text-[#2E7D32] border border-[#CDE0CF]">
              Save ₹{netSavingsINR.toLocaleString()} net
            </span>
          </div>

          <p className="text-[11px] text-text-muted">
            Tickets in {item.cityName} with round-trip transit cost less than high resale tickets in {userOriginCity}!
          </p>

          <div className="space-y-1.5 text-xs pt-1 border-t border-border-subtle">
            <div className="flex justify-between text-text-muted">
              <span className="flex items-center gap-1">
                <Train className="h-3 w-3" />
                Vande Bharat / 3AC Return
              </span>
              <span className="font-mono text-text-primary">₹{estimatedRailINR.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span className="flex items-center gap-1">
                <Hotel className="h-3 w-3" />
                1 Night Comfort Stay
              </span>
              <span className="font-mono text-text-primary">₹{estimatedStayINR.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                Event Admission
              </span>
              <span className="font-mono text-text-primary">₹{ticketINR.toLocaleString()}</span>
            </div>

            <div className="border-t border-border-subtle pt-1.5 flex justify-between font-bold">
              <span className="text-text-primary">Total Trip Estimate</span>
              <span className="font-mono text-accent-dune text-sm">
                ₹{totalPackageINR.toLocaleString()}
              </span>
            </div>
          </div>

          {onOpenArbitragePlanner && (
            <button
              onClick={() => onOpenArbitragePlanner(item)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border-strong bg-surface hover:bg-surface-hover text-text-primary text-xs font-bold transition-all"
            >
              <Compass className="h-3.5 w-3.5 text-accent-dune" />
              <span>Open in Full Arbitrage Planner</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
