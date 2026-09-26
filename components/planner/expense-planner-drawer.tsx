"use client";

import * as React from "react";
import {
  Calendar,
  MapPin,
  Plane,
  Train,
  Hotel,
  Car,
  Ticket,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { CITIES } from "@/lib/mock-data";
import {
  CityCode,
  RailClass,
  StayPreference,
  TourStop,
  TransitMode,
} from "@/lib/types";
import { calculateSingleItinerary } from "@/lib/arbitrage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExpensePlannerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stop: TourStop | null;
  defaultOriginCityCode: CityCode;
}

export function ExpensePlannerDrawer({
  isOpen,
  onClose,
  stop,
  defaultOriginCityCode,
}: ExpensePlannerDrawerProps) {
  const [origin, setOrigin] = React.useState<CityCode>(defaultOriginCityCode);
  const [transitMode, setTransitMode] = React.useState<TransitMode>("flight");
  const [railClass, setRailClass] = React.useState<RailClass>("3AC");
  const [stayPreference, setStayPreference] =
    React.useState<StayPreference>("comfort");
  const [selectedTierId, setSelectedTierId] = React.useState<string>("silver");

  // Sync default origin when changed or opened
  React.useEffect(() => {
    if (defaultOriginCityCode) {
      setOrigin(defaultOriginCityCode);
    }
  }, [defaultOriginCityCode]);

  // Set default tier from stop
  React.useEffect(() => {
    if (stop && stop.ticketTiers.length > 0) {
      setSelectedTierId(stop.ticketTiers[0].tierId);
    }
  }, [stop]);

  if (!stop) return null;

  // Calculate live itemized itinerary
  const breakdown = calculateSingleItinerary(
    origin,
    stop,
    selectedTierId,
    transitMode,
    railClass,
    stayPreference
  );

  const isSameCity = origin === stop.cityCode;
  const durationHours = Math.floor(breakdown.transitDurationMinutes / 60);
  const durationMins = breakdown.transitDurationMinutes % 60;
  const formattedDuration =
    durationHours > 0
      ? `${durationHours}h ${durationMins > 0 ? `${durationMins}m` : ""}`
      : `${durationMins}m`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="space-y-6 sm:max-w-lg">
        {/* Header */}
        <SheetHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="curated">{stop.artistName}</Badge>
            <Badge variant={isSameCity ? "default" : "live"}>
              {isSameCity ? "Home City Show" : "Away Tour Trip"}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-black text-text-primary">
            Trip Expense Planner
          </SheetTitle>
          <SheetDescription className="text-xs text-text-secondary">
            Itemized concert tour outlay calculator with round-trip transit and lodging.
          </SheetDescription>
        </SheetHeader>

        {/* Selected Concert Snapshot */}
        <div className="rounded-xl border border-border-subtle bg-surface-elevated/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">
              {stop.cityName}
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {stop.cityCode}
            </span>
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-text-muted" />
              {stop.venue}
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              {stop.date}
            </p>
          </div>
        </div>

        {/* User Configuration Controls */}
        <div className="space-y-4 pt-2 border-t border-border-subtle">
          {/* Origin Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Traveling From (Origin City)
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-cyan-500 focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-surface">
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Tier Picker */}
          {stop.ticketTiers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Select Ticket Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {stop.ticketTiers.map((tier) => (
                  <Button
                    key={tier.tierId}
                    type="button"
                    variant={selectedTierId === tier.tierId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTierId(tier.tierId)}
                    className="flex flex-col items-center py-2 h-auto text-xs"
                  >
                    <span className="font-semibold truncate w-full text-center">
                      {tier.name}
                    </span>
                    <span className="text-[10px] opacity-80 font-mono">
                      ₹{tier.priceINR.toLocaleString("en-IN")}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Transit Mode & Rail Class (if away city) */}
          {!isSameCity && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Transit Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={transitMode === "flight" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTransitMode("flight")}
                    className="gap-2"
                  >
                    <Plane className="h-3.5 w-3.5 text-cyan-400" />
                    Round-Trip Flight
                  </Button>
                  <Button
                    type="button"
                    variant={transitMode === "rail" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTransitMode("rail")}
                    className="gap-2"
                  >
                    <Train className="h-3.5 w-3.5 text-amber-400" />
                    Indian Railways
                  </Button>
                </div>
              </div>

              {transitMode === "rail" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Rail Seat Class
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["SL", "3AC", "2AC", "VANDE_BHARAT"] as RailClass[]).map(
                      (cls) => (
                        <Button
                          key={cls}
                          type="button"
                          variant={railClass === cls ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRailClass(cls)}
                          className="text-xs"
                        >
                          {cls === "VANDE_BHARAT" ? "VB" : cls}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Stay Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Concert Night Lodging Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["budget", "comfort", "luxury"] as StayPreference[]).map(
                    (pref) => (
                      <Button
                        key={pref}
                        type="button"
                        variant={stayPreference === pref ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setStayPreference(pref)}
                        className="capitalize text-xs"
                      >
                        {pref}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Itemized Breakdown */}
        <div className="space-y-3 pt-3 border-t border-border-subtle">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Live Itemized Cost Breakdown
          </h4>

          <div className="space-y-2 rounded-xl bg-surface-elevated/90 p-4 border border-border-subtle text-sm">
            {/* Ticket */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-text-secondary text-xs">
                <Ticket className="h-3.5 w-3.5 text-emerald-400" />
                Concert Ticket ({breakdown.selectedTier.name})
              </span>
              <span className="font-mono font-bold text-text-primary">
                ₹{breakdown.ticketINR.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Transit */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-text-secondary text-xs">
                {transitMode === "flight" ? (
                  <Plane className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <Train className="h-3.5 w-3.5 text-amber-400" />
                )}
                {isSameCity
                  ? "Local Venue Commute"
                  : `Transit (${formattedDuration})`}
              </span>
              <span className="font-mono font-bold text-text-primary">
                {breakdown.transitINR === 0
                  ? "₹0"
                  : `₹${breakdown.transitINR.toLocaleString("en-IN")}`}
              </span>
            </div>

            {/* Lodging */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-text-secondary text-xs">
                <Hotel className="h-3.5 w-3.5 text-purple-400" />
                {isSameCity ? "Lodging (Home)" : "1-Night Hotel Stay"}
              </span>
              <span className="font-mono font-bold text-text-primary">
                {breakdown.lodgingINR === 0
                  ? "₹0"
                  : `₹${breakdown.lodgingINR.toLocaleString("en-IN")}`}
              </span>
            </div>

            {/* Local Venue Transfers */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-text-secondary text-xs">
                <Car className="h-3.5 w-3.5 text-indigo-400" />
                Airport / Station & Venue Cabs
              </span>
              <span className="font-mono font-bold text-text-primary">
                ₹{breakdown.cabINR.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-border-strong flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Total Trip Outlay
              </span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                ₹{breakdown.totalINR.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="pt-3 space-y-2">
          {stop.externalTicketUrl && (
            <a
              href={stop.externalTicketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <Button variant="neon" className="w-full gap-2">
                <span>Book Official Tickets</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close Planner
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
