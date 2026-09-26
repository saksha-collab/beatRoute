"use client";

import * as React from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import { FEATURED_TOURS, CITIES } from "@/lib/mock-data";
import {
  ALL_INDIAN_CONCERTS,
  getCityFilterOptions,
  filterConcertsByCity,
  searchConcerts,
} from "@/lib/data/all-concerts";
import {
  CityCode,
  RailClass,
  StayPreference,
  TourStop,
  TransitMode,
  ArbitrageResult,
  ConcertEvent,
} from "@/lib/types";
import { calculateArbitrageMatrix } from "@/lib/arbitrage";
import { HeaderNav } from "@/components/navigation/header-nav";
import { FilterBar } from "@/components/search/filter-bar";
import { MetricsSummaryStrip } from "@/components/search/metrics-summary-strip";
import { ArbitrageMatrix } from "@/components/matrix/arbitrage-matrix";
import { ConcertMapWrapper } from "@/components/map/concert-map-wrapper";
import { ExpensePlannerDrawer } from "@/components/planner/expense-planner-drawer";
import { ConcertTimelineFeed } from "@/components/feed/concert-timeline-feed";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Compass, Sparkles, Calendar, MapPin } from "lucide-react";

function tourStopToConcertEvent(stop: TourStop): ConcertEvent {
  return {
    id: stop.id,
    artist: stop.artistName,
    tourName: stop.tourName,
    artistImageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    date: stop.date,
    time: "18:00 IST",
    cityCode: stop.cityCode,
    cityName: stop.cityName,
    venue: stop.venue,
    coordinates: stop.coordinates,
    genres: ["Live Tour", "Concert"],
    startingPriceINR: stop.startingPriceINR,
    ticketTiers: stop.ticketTiers,
    ticketStatus: "available",
    bookingUrl: stop.externalTicketUrl || "https://in.bookmyshow.com",
    source: "live_api",
    highlights: ["Live Bandsintown V3.1 verified tour date"],
  };
}

function BeatRouteDashboard() {
  // 1. Primary View Mode: 'radar' (Phase 1 Concert Radar) vs 'arbitrage' (Travel Arbitrage Engine)
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["radar", "arbitrage"] as const).withDefault("radar")
  );

  // 2. Concert Radar State (Phase 1)
  const [selectedCity, setSelectedCity] = useQueryState(
    "city",
    parseAsString.withDefault("ALL")
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [isSearchingLive, setIsSearchingLive] = React.useState(false);
  const [liveConcerts, setLiveConcerts] = React.useState<ConcertEvent[] | null>(null);
  const [radarError, setRadarError] = React.useState<{
    title: string;
    message: string;
    code?: string;
  } | null>(null);

  // 3. Travel Arbitrage URL Params (Phase 3 integrated engine)
  const [origin, setOrigin] = useQueryState("origin", parseAsString.withDefault("BOM"));
  const [tourId, setTourId] = useQueryState("tour", parseAsString.withDefault("coldplay"));
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
  const [arbitrageView, setArbitrageView] = useQueryState(
    "view",
    parseAsStringLiteral(["list", "map"] as const).withDefault("list")
  );
  const [tourMode, setTourMode] = useQueryState(
    "mode_type",
    parseAsStringLiteral(["curated", "live"] as const).withDefault("curated")
  );

  // 4. Planner Drawer State
  const [plannerStop, setPlannerStop] = React.useState<TourStop | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);

  // City options for filter chips
  const cityOptions = React.useMemo(() => getCityFilterOptions(), []);

  // Filter and search concerts for the Radar feed
  const displayedConcerts: ConcertEvent[] = React.useMemo(() => {
    if (liveConcerts) {
      if (selectedCity && selectedCity !== "ALL") {
        return liveConcerts.filter(
          (c) => c.cityCode.toUpperCase() === selectedCity.toUpperCase()
        );
      }
      return liveConcerts;
    }

    let results = ALL_INDIAN_CONCERTS;

    if (selectedCity && selectedCity !== "ALL") {
      results = filterConcertsByCity(selectedCity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter((c) => {
        return (
          c.artist.toLowerCase().includes(q) ||
          c.tourName.toLowerCase().includes(q) ||
          c.cityName.toLowerCase().includes(q) ||
          c.venue.toLowerCase().includes(q) ||
          c.genres.some((g) => g.toLowerCase().includes(q))
        );
      });
    }

    return results;
  }, [liveConcerts, selectedCity, searchQuery]);

  // Handle Live Artist Search via Bandsintown V3.1
  const handleLiveArtistSearch = React.useCallback(
    async (artistName: string) => {
      const cleanArtist = artistName.trim();
      if (!cleanArtist) return;

      setIsSearchingLive(true);
      setRadarError(null);

      try {
        const res = await fetch(`/api/concerts?artist=${encodeURIComponent(cleanArtist)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setLiveConcerts(null);
          setRadarError({
            title: `No Indian Tour Dates for "${cleanArtist}"`,
            message:
              data.error ||
              `We couldn't find confirmed live concerts in India for "${cleanArtist}". Explore our featured Indian stadium tours below!`,
            code: data.code || "NO_CONCERTS",
          });
        } else {
          const stops: TourStop[] = data.data || [];
          if (stops.length === 0) {
            setLiveConcerts(null);
            setRadarError({
              title: `No Indian Tour Dates for "${cleanArtist}"`,
              message: `No upcoming concert stops in India found for "${cleanArtist}". Try another artist.`,
              code: "NO_CONCERTS",
            });
          } else {
            const mapped = stops.map((s) => tourStopToConcertEvent(s));
            setLiveConcerts(mapped);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setRadarError({
          title: "API Connection Notice",
          message: `Failed to query live concert pipeline: ${msg}`,
          code: "NETWORK_ERROR",
        });
        setLiveConcerts(null);
      } finally {
        setIsSearchingLive(false);
      }
    },
    []
  );

  const handleResetRadar = () => {
    setLiveConcerts(null);
    setRadarError(null);
    setSearchQuery("");
    setSelectedCity("ALL");
  };

  // Arbitrage Engine Calculations
  const selectedCuratedTour =
    FEATURED_TOURS.find((t) => t.id === tourId) || FEATURED_TOURS[0];
  const arbitrageStops = selectedCuratedTour.stops;

  const arbitrageResults: ArbitrageResult[] = React.useMemo(() => {
    return calculateArbitrageMatrix({
      originCityCode: origin,
      tourStops: arbitrageStops,
      selectedTierId,
      transitMode,
      railClass,
      stayPreference,
    });
  }, [origin, arbitrageStops, selectedTierId, transitMode, railClass, stayPreference]);

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
        view={arbitrageView}
        onViewChange={setArbitrageView}
        tourMode={tourMode}
        onTourModeChange={setTourMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Tabs: Concert Radar vs Travel Arbitrage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
              {activeTab === "radar"
                ? "All-India Live Concert & Tour Radar"
                : "Concert Travel Arbitrage Engine"}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              {activeTab === "radar"
                ? "Verified stadium dates, stadium coordinates, ticket tiers, and direct box office booking across India."
                : "Compare round-trip flights, Indian Railways, hotels, and ticket prices across cities to find net travel savings."}
            </p>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center rounded-xl bg-surface-elevated p-1.5 border border-border-strong self-start sm:self-center shadow-lg">
            <button
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "radar"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-glowCyan"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Concert Radar</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 text-[10px] font-mono">
                {ALL_INDIAN_CONCERTS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("arbitrage")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "arbitrage"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Travel Arbitrage</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ALL-INDIA CONCERT RADAR (Phase 1 Approved Scope) */}
        {activeTab === "radar" && (
          <div className="space-y-6">
            {/* Live Search Notice or Error State */}
            {radarError ? (
              <ErrorState
                title={radarError.title}
                message={radarError.message}
                code={radarError.code}
                onRetry={() => handleLiveArtistSearch(searchQuery)}
                onExploreFeatured={handleResetRadar}
              />
            ) : (
              <ConcertTimelineFeed
                concerts={displayedConcerts}
                cityOptions={cityOptions}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onLiveSearchSubmit={handleLiveArtistSearch}
                isSearchingLive={isSearchingLive}
              />
            )}
          </div>
        )}

        {/* TAB 2: TRAVEL ARBITRAGE ENGINE (Preserved & Integrated) */}
        {activeTab === "arbitrage" && (
          <div className="space-y-6">
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
              liveArtistQuery=""
              onLiveArtistQueryChange={() => {}}
              onSearchLiveArtist={() => {}}
              isSearchingLive={false}
            />

            <MetricsSummaryStrip results={arbitrageResults} />

            {arbitrageView === "list" ? (
              <ArbitrageMatrix
                results={arbitrageResults}
                isLoading={false}
                onPlanTrip={handleOpenPlanner}
                onExploreFeatured={() => setTourMode("curated")}
              />
            ) : (
              <ConcertMapWrapper
                stops={arbitrageStops}
                onPlanTrip={handleOpenPlanner}
              />
            )}
          </div>
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
            <span className="hover:text-text-primary transition-colors">
              Next.js 16.3.6 (Turbopack)
            </span>
            <span>•</span>
            <span className="hover:text-text-primary transition-colors">
              CartoDB Dark Matter
            </span>
            <span>•</span>
            <span className="hover:text-text-primary transition-colors">
              0 CLS Architecture
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
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
