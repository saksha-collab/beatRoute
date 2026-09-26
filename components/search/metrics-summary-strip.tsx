"use client";

import { TrendingDown, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { ArbitrageResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsSummaryStripProps {
  results: ArbitrageResult[];
  onSelectCity?: (cityCode: string) => void;
}

export function MetricsSummaryStrip({ results, onSelectCity }: MetricsSummaryStripProps) {
  if (!results || results.length === 0) return null;

  const homeResult = results.find((r) => r.isHomeCity);
  const awayResults = results.filter((r) => !r.isHomeCity);

  // Best savings option
  const bestSavings = awayResults.reduce<ArbitrageResult | null>((best, curr) => {
    if (curr.netSavingsINR !== null && curr.netSavingsINR > 0) {
      if (!best || (best.netSavingsINR ?? 0) < curr.netSavingsINR) return curr;
    }
    return best;
  }, null);

  // Sweet spot option
  const sweetSpot = awayResults.find((r) => r.isSweetSpot);

  // Cheapest overall trip
  const cheapestTrip = awayResults.reduce<ArbitrageResult | null>((cheapest, curr) => {
    if (!cheapest || curr.totalTripCostINR < cheapest.totalTripCostINR) return curr;
    return cheapest;
  }, null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Top Net Arbitrage Savings */}
      <Card className="border-border-subtle bg-surface/70 hover:border-emerald-500/40 transition-colors shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-glowSavings">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Max Travel Arbitrage
              </span>
              {bestSavings && <Badge variant="savings">Save ₹{bestSavings.netSavingsINR?.toLocaleString("en-IN")}</Badge>}
            </div>
            {bestSavings ? (
              <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                Go to <span className="text-emerald-400">{bestSavings.destinationCity.name}</span> vs home show
              </p>
            ) : homeResult ? (
              <p className="text-xs text-text-secondary mt-0.5">
                Home show at ₹{homeResult.totalTripCostINR.toLocaleString("en-IN")} is your cheapest option
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">
                No home show scheduled; travel required
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metric 2: The Sweet Spot Pick */}
      <Card className="border-border-subtle bg-surface/70 hover:border-cyan-500/40 transition-colors shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-glowCyan">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Sweet Spot Pick
              </span>
              <Badge variant="live">Time + Savings</Badge>
            </div>
            {sweetSpot ? (
              <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                <span className="text-cyan-400">{sweetSpot.destinationCity.name}</span> (
                {Math.round(sweetSpot.transitDurationMinutes / 60)}h travel)
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">
                {cheapestTrip ? `${cheapestTrip.destinationCity.name} — ₹${cheapestTrip.totalTripCostINR.toLocaleString("en-IN")} total` : "Evaluating transit routes..."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metric 3: Best Value Away Trip */}
      <Card className="border-border-subtle bg-surface/70 hover:border-purple-500/40 transition-colors shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 shadow-glowPurple">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Cheapest Complete Trip
              </span>
            </div>
            {cheapestTrip ? (
              <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                <span className="text-purple-400">{cheapestTrip.destinationCity.name}</span> for ₹{cheapestTrip.totalTripCostINR.toLocaleString("en-IN")}
                <span className="text-xs text-text-muted font-normal ml-1">all-inclusive</span>
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">Calculating routes...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
