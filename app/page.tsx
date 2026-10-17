"use client";

import * as React from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import initialCatalog from "@/lib/data/catalog.json";
import { extractLiveTours } from "@/lib/services/live-tours";
import { useCityCatalog } from "@/hooks/use-city-catalog";
import {
  CityCode,
  RailClass,
  StayPreference,
  TourStop,
  TransitMode,
  ArbitrageResult,
  ConcertEvent,
  CatalogItem,
} from "@/lib/types";
import { calculateArbitrageMatrix } from "@/lib/arbitrage";
import { HeaderNav } from "@/components/navigation/header-nav";
import { CitySelectorModal } from "@/components/navigation/city-selector-modal";
import { CategoryTabs, AggregatorCategory } from "@/components/discovery/category-tabs";
import { HybridAggregatorFeed } from "@/components/discovery/hybrid-aggregator-feed";
import { FilterBar } from "@/components/search/filter-bar";
import { MetricsSummaryStrip } from "@/components/search/metrics-summary-strip";
import { ArbitrageMatrix } from "@/components/matrix/arbitrage-matrix";
import { ConcertMapWrapper } from "@/components/map/concert-map-wrapper";
import { ExpensePlannerDrawer } from "@/components/planner/expense-planner-drawer";
import { Skeleton } from "@/components/ui/skeleton";

function BeatRouteDashboard() {
  // 1. Primary Aggregator Category Tab (Concerts vs Movies vs Events vs Travel Arbitrage)
  const [activeCategory, setActiveCategory] = useQueryState(
    "cat",
    parseAsStringLiteral(["concerts", "movies", "events", "arbitrage"] as const).withDefault("concerts")
  );

  // Backward compatibility with ?tab=arbitrage
  const [legacyTab] = useQueryState("tab", parseAsString);
  React.useEffect(() => {
    if (legacyTab === "arbitrage") {
      setActiveCategory("arbitrage");
    }
  }, [legacyTab, setActiveCategory]);

  // 2. City Selection & Onboarding Modal
  const [selectedCity, setSelectedCity] = useQueryState("city", parseAsString.withDefault("ALL"));
  const [isCityModalOpen, setIsCityModalOpen] = React.useState(false);
  const [isFirstVisit, setIsFirstVisit] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("beatroute_city");
      if (!savedCity) {
        setIsFirstVisit(true);
        setIsCityModalOpen(true);
      } else if (selectedCity === "ALL" && savedCity !== "ALL") {
        setSelectedCity(savedCity);
      }
    }
  }, [selectedCity, setSelectedCity]);

  // 3. 1-Hour TTL SWR live catalog hook
  const {
    items: liveCatalogItems,
    isValidating: isCatalogValidating,
    ageMinutes: catalogAgeMinutes,
    refresh: refreshCityCatalog,
  } = useCityCatalog(selectedCity === "ALL" ? "BOM" : selectedCity);

  // 4. Master Catalog compiling (curated tours + local catalog.json + live SWR updates)
  // 4. Master Catalog compiling: Pure live scraped data with strict upcoming date filter
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const masterCatalog = React.useMemo(() => {
    const map = new Map<string, CatalogItem>();

    // A. Baseline catalog.json items (strictly active / upcoming)
    (initialCatalog as CatalogItem[]).forEach((item) => {
      if (item.type === "movie" || !item.date || item.date >= today) {
        map.set(item.id, item);
      }
    });

    // B. Live SWR updates from BMS & District (strictly active / upcoming)
    (liveCatalogItems || []).forEach((item) => {
      if (item.type === "movie" || !item.date || item.date >= today) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }, [liveCatalogItems, today]);

  const concertItems = React.useMemo(
    () => masterCatalog.filter((i) => i.type === "concert"),
    [masterCatalog]
  );
  const movieItems = React.useMemo(
    () => masterCatalog.filter((i) => i.type === "movie"),
    [masterCatalog]
  );
  const eventItems = React.useMemo(
    () => masterCatalog.filter((i) => i.type === "event"),
    [masterCatalog]
  );

  // 5. Dynamic Live Tours derived purely from upcoming live events
  const dynamicTours = React.useMemo(
    () => extractLiveTours(concertItems),
    [concertItems]
  );

  // 6. Travel Arbitrage Engine State
  const [origin, setOrigin] = useQueryState("origin", parseAsString.withDefault("BOM"));
  const defaultTourId = dynamicTours[0]?.id || "live-tour";
  const [tourId, setTourId] = useQueryState("tour", parseAsString.withDefault(defaultTourId));
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

  // Planner Drawer State
  const [plannerStop, setPlannerStop] = React.useState<TourStop | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);

  const selectedTour =
    dynamicTours.find((t) => t.id === tourId) || dynamicTours[0];
  const arbitrageStops = selectedTour?.stops || [];

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

  const handleOpenArbitrageFromPreview = (item: CatalogItem) => {
    const matchTour = dynamicTours.find(
      (t) =>
        t.artist.toLowerCase() === item.title.toLowerCase() ||
        item.title.toLowerCase().includes(t.artist.toLowerCase()) ||
        t.stops.some((s) => s.id === item.id)
    );
    if (matchTour) {
      setTourId(matchTour.id);
    }
    if (selectedCity && selectedCity !== "ALL") {
      setOrigin(selectedCity);
    }
    setActiveCategory("arbitrage");
  };

  const handleCitySelect = (code: string) => {
    setSelectedCity(code);
    if (code !== "ALL") {
      setOrigin(code);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary selection:bg-accent-dune/20 selection:text-accent-dune font-sans">
      
      {/* Top Header Navigation */}
      <HeaderNav
        view={arbitrageView}
        onViewChange={setArbitrageView}
        selectedCity={selectedCity}
        onOpenCityModal={() => {
          setIsFirstVisit(false);
          setIsCityModalOpen(true);
        }}
        isValidating={isCatalogValidating}
        ageMinutes={catalogAgeMinutes}
        onRefreshLive={refreshCityCatalog}
        showViewToggle={activeCategory === "arbitrage"}
      />

      {/* First-Time Visitor & Location Switcher Modal */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        isFirstVisit={isFirstVisit}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-5">
        
        {/* Skyscanner-Style Category Tabs & Minimalist Header */}
        <div className="space-y-3 pb-2 border-b border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
              Live Discovery
            </h1>
            <p className="text-xs text-text-muted">
              Live box office prices & travel arbitrage across BookMyShow and District.
            </p>
          </div>

          <CategoryTabs
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            counts={{
              concerts: concertItems.length,
              movies: movieItems.length,
              events: eventItems.length,
            }}
          />
        </div>

        {/* TAB 1: CONCERTS & GIGS (Hybrid List + Preview) */}
        {activeCategory === "concerts" && (
          <HybridAggregatorFeed
            items={concertItems}
            userOriginCity={selectedCity === "ALL" ? "BOM" : selectedCity}
            category="concerts"
            onOpenArbitragePlanner={handleOpenArbitrageFromPreview}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 2: CINEMA & MOVIES (Hybrid List + Preview) */}
        {activeCategory === "movies" && (
          <HybridAggregatorFeed
            items={movieItems}
            userOriginCity={selectedCity === "ALL" ? "BOM" : selectedCity}
            category="movies"
            onOpenArbitragePlanner={handleOpenArbitrageFromPreview}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 3: COMEDY & LIVE EVENTS (Hybrid List + Preview) */}
        {activeCategory === "events" && (
          <HybridAggregatorFeed
            items={eventItems}
            userOriginCity={selectedCity === "ALL" ? "BOM" : selectedCity}
            category="events"
            onOpenArbitragePlanner={handleOpenArbitrageFromPreview}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 4: TRAVEL ARBITRAGE ENGINE */}
        {activeCategory === "arbitrage" && (
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
              availableTours={dynamicTours}
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

      {/* Subtle Minimalist Footer */}
      <footer className="w-full border-t border-border-subtle bg-surface/60 py-6 mt-12 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BeatRoute — Entertainment & Travel Arbitrage Aggregator.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>BookMyShow & District Aggregated</span>
            <span>•</span>
            <span>Indian Railways & Flight Arbitrage</span>
            <span>•</span>
            <span>1-Hour SWR Cache</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="w-full h-16 border-b border-border-subtle bg-surface" />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-96 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-96 rounded-2xl" />
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
