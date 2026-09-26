"use client";

import { Calendar, MapPin, Ticket, ArrowRight, X } from "lucide-react";
import { TourStop } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ConcertPreviewSheetProps {
  stop: TourStop | null;
  onClose: () => void;
  onPlanTrip: (stop: TourStop) => void;
}

export function ConcertPreviewSheet({
  stop,
  onClose,
  onPlanTrip,
}: ConcertPreviewSheetProps) {
  if (!stop) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[1000] animate-in slide-in-from-bottom-5 duration-200">
      <Card className="border-indigo-500/40 bg-surface/95 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Top Glow Line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        <CardContent className="p-4 sm:p-5 space-y-3 relative">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Artist & Source Badge */}
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={stop.source === "live_api" ? "live" : "curated"}>
                {stop.source === "live_api" ? "Live API" : "Featured Tour"}
              </Badge>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {stop.cityCode}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text-primary leading-snug">
              {stop.artistName}
            </h3>
            <p className="text-xs text-text-secondary truncate">{stop.tourName}</p>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs text-text-secondary pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate text-text-primary font-medium">
                {stop.venue}, {stop.cityName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-text-primary">{stop.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                From{" "}
                <strong className="text-text-primary font-mono font-bold">
                  ₹{stop.startingPriceINR.toLocaleString("en-IN")}
                </strong>{" "}
                ({stop.ticketTiers.length} tiers)
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="neon"
              size="default"
              onClick={() => onPlanTrip(stop)}
              className="w-full gap-2 font-bold shadow-glowCyan"
            >
              <span>Plan Trip / Calculate Expenses</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
