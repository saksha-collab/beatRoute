"use client";

import * as React from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import { FEATURED_TOURS, CITIES } from "@/lib/mock-data";
import {
  CityCode,
  RailClass,
  StayPreference,
  TourStop,
  TransitMode,
  ArbitrageResult,
} from "@/lib/types";
import { calculateArbitrageMatrix } from "@/lib/arbitrage";
import { HeaderNav } from "@/components/navigation/header-nav";
import { FilterBar } from "@/components/search/filter-bar";
import { MetricsSummaryStrip } from "@/components/search/metrics-summary-strip";
import { ArbitrageMatrix } from "@/components/matrix/arbitrage-matrix";
import { ConcertMapWrapper } from "@/components/map/concert-map-wrapper";
import { ExpensePlannerDrawer } from "@/components/planner/expense-planner-drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

function BeatRouteDashboard() {
  // 1. URL search params synchronization via nuqs
  const [origin, setOrigin] = useQueryState(
    "origin",
    parseAsString.withDefault("BOM")
  );
  const [tourId, setTourId] = useQueryState(
    "tour",
    parseAsString.withDefault("coldplay")
  );
  const [transitMode, setTransitMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["flight", "rail"] as const).withDefault("flight")
  );
  const [railClass, setRailClass] = useQueryState(
    "railClass",
    parseAsStringLiteral(["SL", "3AC", "2AC", "VANDE_BHARAT"] as const).withDefault("3AC")
  );
  const [stayPreference, setStayPreference] = useQueryState(
    "stay",
    parseAsStringLiteral(["budget", "comfort", "luxury"] as const).withDefault("comfort")
  );
  const [selectedTierId, setSelectedTierId] = useQueryState(
    "tier",
    parseAsString.withDefault("silver")
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(["list", "map"] as const).withDefault("list")
  );
  const [tourMode, setTourMode] = useQueryState(
    "mode_type",
    parseAsStringLiteral(["curated", "live"] as const).withDefault("curated")
  );

  // 2. Live API Search State
  const [liveArtistQuery, setLiveArtistQuery] = React.useState("");
  const [isSearchingLive, setIsSearchingLive] = React.useState(false);
  const [liveStops, setLiveStops] = React.useState<TourStop[] | null>(null);
  const [apiError, setApiError] = React.useState<{
    message: string;
    code?: string;
  } | null>(null);

  // 3. Planner Drawer State
  const [plannerStop, setPlannerStop] = React.useState<TourStop | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);

  // Current Tour / Stops
  const selectedCuratedTour =
    FEATURED_TOURS.find((t) => t.id === tourId) || FEATURED_TOURS[0];

  const currentStops: TourStop[] =
    tourMode === "curated"
      ? selectedCuratedTour.stops
      : liveStops || [];

  // Live Artist Query Handler
  const handleSearchLiveArtist = React.useCallback(async (queryOverride?: string) => {
    const targetQuery = (queryOverride || liveArtistQuery).trim();
    if (!targetQuery) return;

    setIsSearchingLive(true);
    setApiError(null);

    try {
      const res = await fetch(
        `/api/concerts?artist=${encodeURIComponent(targetQuery)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLiveStops(null);
        setApiError({
          message:
            data.error ||
            `No upcoming concerts in India found for "${targetQuery}".`,
          code: data.code || "API_ERROR",
        });
      } else {
        setLiveStops(data.data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setApiError({
        message: `Failed to query live concert API: ${message}`,
        code: "NETWORK_ERROR",
      });
      setLiveStops(null);
    } finally {
      setIsSearchingLive(false);
    }
  }, [liveArtistQuery]);

  // Compute Arbitrage Matrix Results
  const arbitrageResults: ArbitrageResult[] = React.useMemo(() => {
    if (!currentStops || currentStops.length === 0) return [];
    return calculateArbitrageMatrix({
      originCityCode: origin,
      tourStops: currentStops,
      selectedTierId,
      transitMode,
      railClass,
      stayPreference,
    });
  }, [
    origin,
    currentStops,
    selectedTierId,
    transitMode,
    railClass,
    stayPreference,
  ]);

  // Plan trip from card or map pin
  const handleOpenPlanner = (stopOrResult: TourStop | ArbitrageResult) => {
    if ("tourStop" in stopOrResult) {
      setPlannerStop(stopOrResult.tourStop);
    } else {
      setPlannerStop(stopOrResult);
    }
    setIsPlannerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Header Navigation */}
      <HeaderNav
        view={view}
        onViewChange={setView}
        tourMode={tourMode}
        onTourModeChange={setTourMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Intro / Mission Sub-Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border-subtle">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
              Live Concert Travel Arbitrage
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Save thousands on tickets and travel by identifying cheaper out-of-city tour dates across India.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated text-xs font-semibold text-text-secondary border border-border-subtle">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Telescopic Rail & Flight Fare Engine
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          origin={origin}
          onOriginChange={setOrigin}
          tourId={tourId}
          onTourIdChange={setTourId}
          transitMode={transitMode}
          onTransitModeChange={setTransitMode}
          railClass={railClass}
          onRailClassChange={setRailClass}
          stayPreference={stayPreference}
          onStayPreferenceChange={setStayPreference}
          selectedTierId={selectedTierId}
          onTierChange={setSelectedTierId}
          tourMode={tourMode}
          onTourModeChange={setTourMode}
          liveArtistQuery={liveArtistQuery}
          onLiveArtistQueryChange={setLiveArtistQuery}
          onSearchLiveArtist={handleSearchLiveArtist}
          isSearchingLive={isSearchingLive}
        />

        {/* Live API Error State (ADR-005: Never mask with fake mock data) */}
        {apiError ? (
          <ErrorState
            title="Concert Discovery Notice"
            message={apiError.message}
            code={apiError.code}
            onRetry={handleSearchLiveArtist}
            onExploreFeatured={() => {
              setTourMode("curated");
              setApiError(null);
            }}
          />
        ) : (
          <>
            {/* Metrics Strip */}
            <MetricsSummaryStrip results={arbitrageResults} />

            {/* View Switch: List View vs Concert Map */}
            {view === "list" ? (
              <ArbitrageMatrix
                results={arbitrageResults}
                isLoading={isSearchingLive}
                onPlanTrip={handleOpenPlanner}
                onExploreFeatured={() => {
                  setTourMode("curated");
                  setApiError(null);
                }}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Interactive Venue Discovery Map
                    </h2>
                    <p className="text-xs text-text-secondary">
                      CartoDB Dark Matter tiles showing verified tour stops across India
                    </p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">
                    {currentStops.length} Venues Plotted
                  </span>
                </div>

                <ConcertMapWrapper
                  stops={currentStops}
                  onPlanTrip={handleOpenPlanner}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-over Expense Planner Drawer */}
      <ExpensePlannerDrawer
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        stop={plannerStop}
        defaultOriginCityCode={origin}
      />

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle bg-surface/40 py-6 mt-12 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BeatRoute — High-Polish Concert Travel Arbitrage Engine.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-text-primary transition-colors">Next.js 15 App Router</span>
            <span>•</span>
            <span className="hover:text-text-primary transition-colors">CartoDB Dark Matter</span>
            <span>•</span>
            <span className="hover:text-text-primary transition-colors">0 CLS Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="w-full h-16 border-b border-border-subtle bg-surface/80" />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-14 w-3/4 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<DashboardSkeleton />}>
      <BeatRouteDashboard />
    </React.Suspense>
  );
}
