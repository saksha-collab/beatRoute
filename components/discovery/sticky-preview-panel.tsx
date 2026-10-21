"use client";

import * as React from "react";
import {
  MapPin,
  Calendar,
  ExternalLink,
  Ticket,
  ShieldCheck,
  Layers,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { CatalogItem, TicketTier } from "@/lib/types";
import { MovieCheckoutCalculator } from "@/components/calculators/movie-checkout-calculator";

interface StickyPreviewPanelProps {
  item: CatalogItem | null;
  userOriginCity?: string;
  onOpenArbitragePlanner?: (item: CatalogItem) => void;
  onCloseMobileDrawer?: () => void;
}

export function StickyPreviewPanel({ item }: StickyPreviewPanelProps) {
  const [includeTaxAndFees, setIncludeTaxAndFees] = React.useState(false);

  if (!item) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center space-y-3">
        <Ticket className="h-8 w-8 mx-auto text-text-muted opacity-30" />
        <h3 className="text-sm font-bold text-text-primary">
          Select an event or movie to compare
        </h3>
        <p className="text-xs text-text-muted max-w-xs mx-auto">
          Choose any item from the feed to compare live ticket phases, platform convenience fees, and credit card BOGO offers.
        </p>
      </div>
    );
  }

  const isMovie = item.type === "movie";
  const listings =
    item.listings && item.listings.length > 0
      ? item.listings
      : [
          {
            source: item.source,
            sourceId: item.id,
            bookingUrl: item.bookingUrl,
            startingPriceINR: item.startingPriceINR,
            lowestListedPriceINR: item.lowestListedPriceINR,
            activePhaseName: item.activePhaseName,
            ticketTiers: item.rawDetails?.ticketTiers,
            ticketStatus: item.ticketStatus,
            convenienceFeePercent: item.source === "bookmyshow" ? 11.8 : 10.0,
          },
        ];

  const isMultiPlatform = listings.length > 1;
  const primaryTiers: TicketTier[] =
    listings.find((l) => l.ticketTiers && l.ticketTiers.length > 0)?.ticketTiers ||
    item.rawDetails?.ticketTiers ||
    [];

  const baseActivePrice = item.startingPriceINR || 499;
  const feeMultiplier = item.source === "bookmyshow" ? 1.118 : 1.1;
  const landedActivePrice = Math.round(baseActivePrice * feeMultiplier);

  const formattedDate = isMovie
    ? `Now Showing • ${item.languages?.join(", ") || "Hindi, English"}`
    : item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Upcoming Dates";

  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Top Meta: Platform Badges & Verification */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {listings.map((l) => (
            <span
              key={l.source}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
                l.source === "bookmyshow"
                  ? "bg-rose-500/10 text-rose-800"
                  : "bg-indigo-500/10 text-indigo-800"
              }`}
            >
              {l.source === "bookmyshow"
                ? isMultiPlatform || isMovie
                  ? "BookMyShow"
                  : "BookMyShow Exclusive"
                : isMultiPlatform || isMovie
                ? "District by Zomato"
                : "District Exclusive"}
            </span>
          ))}
        </div>

        <span className="flex items-center gap-1 text-[11px] text-text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-dune" />
          <span>{isMovie ? "Multi-Platform Cinema" : "Verified Box Office"}</span>
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight leading-snug">
          {item.title}
        </h2>
        {item.description && (
          <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Key Logistics */}
      <div className="space-y-2 py-3 border-y border-border-subtle text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <span className="font-semibold text-text-primary">{formattedDate}</span>
          {!isMovie && item.time && (
            <span className="text-text-muted">({item.time})</span>
          )}
        </div>

        <div className="flex items-start gap-2 text-text-secondary">
          <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block">
              {item.venue || `${item.cityName} Venue`}
            </span>
            <span className="text-[11px] text-text-muted">{item.cityName}</span>
          </div>
        </div>
      </div>

      {/* BRANCH A: MOVIE CHECKOUT & BANK CARD CALCULATOR */}
      {isMovie ? (
        <MovieCheckoutCalculator item={item} />
      ) : (
        /* BRANCH B: CONCERT / LIVE EVENT TIER PROGRESSION & LANDED FEE VIEW */
        <div className="space-y-4">
          {/* Active Tier & Landed Tax Toggle */}
          <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                  {item.ticketStatus === "sold_out"
                    ? "All Tiers Sold Out"
                    : item.activePhaseName
                    ? `Cheapest Available (${item.activePhaseName})`
                    : "Active Starting Price"}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono font-black text-lg text-text-primary">
                    ₹{(includeTaxAndFees ? landedActivePrice : baseActivePrice).toLocaleString()}
                  </span>
                  {item.hasSoldOutEarlyPhases &&
                    item.lowestListedPriceINR &&
                    item.lowestListedPriceINR < baseActivePrice && (
                      <span className="text-xs font-mono line-through text-text-muted">
                        ₹{item.lowestListedPriceINR.toLocaleString()} Early Bird
                      </span>
                    )}
                </div>
              </div>

              <button
                onClick={() => setIncludeTaxAndFees((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                  includeTaxAndFees
                    ? "bg-accent-dune/15 text-accent-dune border-accent-dune/40"
                    : "bg-surface text-text-muted border-border-subtle hover:text-text-primary"
                }`}
              >
                {includeTaxAndFees ? "Incl. ~11.8% Fee" : "+ Show w/ Booking Fee"}
              </button>
            </div>

            {includeTaxAndFees && (
              <p className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                <Info className="h-3 w-3 text-accent-dune shrink-0" />
                <span>
                  Base ₹{baseActivePrice.toLocaleString()} + Est. Platform Fee & 18% GST (₹
                  {(landedActivePrice - baseActivePrice).toLocaleString()})
                </span>
              </p>
            )}
          </div>

          {/* Phase & Ticket Tier Progression Breakdown */}
          {primaryTiers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent-dune" />
                  <span>Ticket Phases & Tier Status</span>
                </span>
                <span className="text-[10px] text-text-muted">
                  {primaryTiers.filter((t) => t.availability === "available").length} of{" "}
                  {primaryTiers.length} available
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {primaryTiers.map((tier) => {
                  const isAvailable = tier.availability !== "sold_out";
                  const displayPrice = includeTaxAndFees
                    ? Math.round(tier.priceINR * feeMultiplier)
                    : tier.priceINR;

                  return (
                    <div
                      key={tier.tierId}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                        isAvailable
                          ? "bg-surface border-border-subtle text-text-primary"
                          : "bg-surface-elevated/40 border-border-subtle/50 text-text-muted opacity-65"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isAvailable ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-semibold truncate">{tier.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono font-bold ${
                            !isAvailable ? "line-through" : ""
                          }`}
                        >
                          ₹{displayPrice.toLocaleString()}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isAvailable
                              ? "bg-emerald-500/10 text-emerald-800"
                              : "bg-rose-500/10 text-rose-800"
                          }`}
                        >
                          {isAvailable ? "Available" : "Sold Out"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Official Platform Booking Buttons */}
          <div className="space-y-2 pt-1">
            {listings.map((l, idx) => {
              const platformLabel =
                l.source === "bookmyshow"
                  ? "BookMyShow"
                  : l.source === "district"
                  ? "District by Zomato"
                  : "Official Box Office";

              return (
                <a
                  key={l.source}
                  href={l.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center justify-between py-2.5 px-4 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                    idx === 0
                      ? "bg-text-primary text-surface hover:bg-text-secondary"
                      : "bg-surface-elevated text-text-primary hover:bg-border-subtle border border-border-subtle"
                  }`}
                >
                  <span>
                    Book on {platformLabel}
                    {l.startingPriceINR
                      ? ` • From ₹${(includeTaxAndFees
                          ? Math.round(l.startingPriceINR * feeMultiplier)
                          : l.startingPriceINR
                        ).toLocaleString()}`
                      : ""}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
