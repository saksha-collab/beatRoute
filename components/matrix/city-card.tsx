"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Plane,
  Train,
  Hotel,
  Car,
  TrendingDown,
  ArrowRight,
  Clock,
  Sparkles,
  Ticket,
} from "lucide-react";
import { ArbitrageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CityCardProps {
  result: ArbitrageResult;
  onPlanTrip: (result: ArbitrageResult) => void;
}

export function CityCard({ result, onPlanTrip }: CityCardProps) {
  const {
    destinationCity,
    tourStop,
    selectedTier,
    transitMode,
    ticketCostINR,
    transitCostINR,
    lodgingCostINR,
    localCabCostINR,
    totalTripCostINR,
    transitDurationMinutes,
    isHomeCity,
    netSavingsINR,
    badges,
  } = result;

  const durationHours = Math.floor(transitDurationMinutes / 60);
  const durationMins = transitDurationMinutes % 60;
  const formattedDuration =
    durationHours > 0
      ? `${durationHours}h ${durationMins > 0 ? `${durationMins}m` : ""}`
      : `${durationMins}m`;

  return (
    <motion.div
      layout
      layoutId={tourStop.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-2xl ${
          isHomeCity
            ? "border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 via-surface to-surface"
            : result.isSweetSpot
            ? "border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 via-surface to-surface shadow-glowCyan"
            : netSavingsINR && netSavingsINR > 0
            ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-surface to-surface"
            : "border-border-subtle bg-surface/90 hover:border-border-strong"
        }`}
      >
        {/* Top Accent Gradient Line */}
        <div
          className={`h-1.5 w-full ${
            isHomeCity
              ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
              : result.isSweetSpot
              ? "bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"
              : netSavingsINR && netSavingsINR > 0
              ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500"
              : "bg-border-subtle"
          }`}
        />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Row: City, Badges & Net Savings Callout */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black tracking-tight text-text-primary">
                  {destinationCity.name}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-surface-elevated text-cyan-400 border border-cyan-800/30">
                  {destinationCity.code}
                </span>

                {/* Badges */}
                {badges.map((b) => (
                  <Badge
                    key={b}
                    variant={
                      b === "Home Show"
                        ? "default"
                        : b === "Top Arbitrage"
                        ? "savings"
                        : b === "Sweet Spot Pick"
                        ? "live"
                        : "secondary"
                    }
                  >
                    {b}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-text-secondary mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-text-primary">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {tourStop.venue}
                </span>
                <span className="flex items-center gap-1 font-mono text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  {tourStop.date}
                </span>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="text-right shrink-0">
              {isHomeCity ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Home Baseline
                </div>
              ) : netSavingsINR !== null && netSavingsINR > 0 ? (
                <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/40 px-3 py-1.5 text-right shadow-glowSavings">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Net Arbitrage
                  </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +₹{netSavingsINR.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : netSavingsINR !== null ? (
                <div className="text-right">
                  <span className="text-[10px] font-medium text-text-muted uppercase block">
                    Outlay Delta
                  </span>
                  <span className="text-xs font-semibold text-text-muted">
                    +₹{Math.abs(netSavingsINR).toLocaleString("en-IN")} extra
                  </span>
                </div>
              ) : (
                <Badge variant="outline">Away Tour Stop</Badge>
              )}
            </div>
          </div>

          {/* Route Visualizer (Boarding Pass Trajectory) */}
          {!isHomeCity && (
            <div className="flex items-center justify-between rounded-xl bg-surface-elevated/80 px-4 py-2.5 border border-border-subtle">
              <span className="font-mono text-xs font-bold text-text-primary">
                ORIGIN
              </span>
              <div className="flex-1 mx-3 flex items-center justify-center gap-2 relative">
                <div className="h-[2px] w-full bg-gradient-to-r from-border-strong via-cyan-500 to-indigo-500 rounded-full" />
                <div className="absolute flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-border-subtle text-[11px] font-semibold text-text-secondary">
                  {transitMode === "flight" ? (
                    <Plane className="h-3 w-3 text-cyan-400" />
                  ) : (
                    <Train className="h-3 w-3 text-amber-400" />
                  )}
                  <span>{formattedDuration}</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400">
                {destinationCity.code}
              </span>
            </div>
          )}

          {/* Itemized Cost Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Ticket */}
            <div className="rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/80">
              <span className="text-[10px] font-bold uppercase text-text-muted block truncate">
                {selectedTier.name}
              </span>
              <span className="text-sm font-black text-text-primary font-mono mt-0.5 block">
                ₹{ticketCostINR.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Transit */}
            <div className="rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/80">
              <span className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-1 truncate">
                {transitMode === "flight" ? (
                  <Plane className="h-3 w-3 text-cyan-400 shrink-0" />
                ) : (
                  <Train className="h-3 w-3 text-amber-400 shrink-0" />
                )}
                {isHomeCity ? "Local" : "Round-Trip"}
              </span>
              <span className="text-sm font-black text-text-primary font-mono mt-0.5 block">
                {transitCostINR === 0 ? "₹0 (Local)" : `₹${transitCostINR.toLocaleString("en-IN")}`}
              </span>
            </div>

            {/* Hotel */}
            <div className="rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/80">
              <span className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-1 truncate">
                <Hotel className="h-3 w-3 text-purple-400 shrink-0" />
                {isHomeCity ? "Home" : "1N Hotel"}
              </span>
              <span className="text-sm font-black text-text-primary font-mono mt-0.5 block">
                {lodgingCostINR === 0 ? "₹0 (Own Bed)" : `₹${lodgingCostINR.toLocaleString("en-IN")}`}
              </span>
            </div>

            {/* Transfers */}
            <div className="rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/80">
              <span className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-1 truncate">
                <Car className="h-3 w-3 text-indigo-400 shrink-0" />
                Cabs
              </span>
              <span className="text-sm font-black text-text-primary font-mono mt-0.5 block">
                ₹{localCabCostINR.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Footer: Grand Total & Action */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Total Trip Outlay
              </span>
              <span className="text-2xl font-black text-text-primary font-mono">
                ₹{totalTripCostINR.toLocaleString("en-IN")}
              </span>
            </div>

            <Button
              type="button"
              variant={isHomeCity ? "secondary" : "neon"}
              size="default"
              onClick={() => onPlanTrip(result)}
              className="gap-2 font-bold shadow-md shrink-0"
            >
              <span>{isHomeCity ? "View Details" : "Plan Trip"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
