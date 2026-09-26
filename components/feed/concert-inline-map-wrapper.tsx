"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { GeoCoordinates } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const DynamicConcertInlineMap = dynamic(
  () => import("./concert-inline-map"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-56 sm:h-64 w-full rounded-xl bg-surface-elevated/70 border border-border-strong flex flex-col items-center justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <span className="text-xs text-text-muted">Loading CartoDB Dark Stadium Map...</span>
      </div>
    ),
  }
);

interface ConcertInlineMapWrapperProps {
  venue: string;
  cityName: string;
  coordinates: GeoCoordinates;
}

export function ConcertInlineMapWrapper(props: ConcertInlineMapWrapperProps) {
  return <DynamicConcertInlineMap {...props} />;
}
