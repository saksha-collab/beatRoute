"use client";

import dynamic from "next/dynamic";
import { TourStop } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ConcertMapWrapperProps {
  stops: TourStop[];
  selectedStopId?: string;
  onPlanTrip: (stop: TourStop) => void;
  className?: string;
}

// Next.js dynamic client import with ssr: false for Leaflet
const DynamicConcertMap = dynamic(
  () => import("./concert-map").then((mod) => mod.ConcertMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-border-subtle bg-surface">
        <Skeleton className="w-full h-full rounded-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-text-secondary">
              Initializing CartoDB Dark Matter Engine...
            </p>
          </div>
        </div>
      </div>
    ),
  }
);

export function ConcertMapWrapper(props: ConcertMapWrapperProps) {
  return <DynamicConcertMap {...props} />;
}
