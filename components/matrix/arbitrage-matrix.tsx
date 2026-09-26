"use client";

import { ArbitrageResult } from "@/lib/types";
import { CityCard } from "./city-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ArbitrageMatrixProps {
  results: ArbitrageResult[];
  isLoading?: boolean;
  onPlanTrip: (result: ArbitrageResult) => void;
  onExploreFeatured?: () => void;
}

export function ArbitrageMatrix({
  results,
  isLoading = false,
  onPlanTrip,
  onExploreFeatured,
}: ArbitrageMatrixProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        title="No Tour Stops Found"
        message="We could not find scheduled tour dates matching your current filter selections. Try searching for another artist or explore featured stadium tours."
        actionText="Explore Featured Tours"
        onAction={onExploreFeatured}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Tour Stop Arbitrage Matrix
          </h2>
          <p className="text-xs text-text-secondary">
            Ranked by highest net savings compared to your home origin baseline
          </p>
        </div>
        <div className="text-xs text-text-muted">
          Showing <span className="font-semibold text-text-primary">{results.length}</span> verified tour destinations
        </div>
      </div>

      {/* Responsive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((res) => (
          <CityCard key={res.tourStop.id} result={res} onPlanTrip={onPlanTrip} />
        ))}
      </div>
    </div>
  );
}
