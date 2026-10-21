"use client";

import * as React from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import initialCatalog from "@/lib/data/catalog.json";
import { useCityCatalog } from "@/hooks/use-city-catalog";
import { CatalogItem } from "@/lib/types";
import { deduplicateCatalog } from "@/lib/deduplicate";
import { HeaderNav } from "@/components/navigation/header-nav";
import { CitySelectorModal } from "@/components/navigation/city-selector-modal";
import { CategoryTabs } from "@/components/discovery/category-tabs";
import { HybridAggregatorFeed } from "@/components/discovery/hybrid-aggregator-feed";
import { Skeleton } from "@/components/ui/skeleton";

function BeatRouteDashboard() {
  // 1. Primary Entertainment Category Tab (Concerts vs Movies vs Comedy/Events)
  const [activeCategory, setActiveCategory] = useQueryState(
    "cat",
    parseAsStringLiteral(["concerts", "movies", "events", "arbitrage"] as const).withDefault("concerts")
  );

  // Redirect legacy ?cat=arbitrage to concerts
  React.useEffect(() => {
    if (activeCategory === "arbitrage") {
      setActiveCategory("concerts");
    }
  }, [activeCategory, setActiveCategory]);

  // 2. City Selection — Defaults to "ALL" (All India) for full entertainment radar
  const [selectedCity, setSelectedCity] = useQueryState("city", parseAsString.withDefault("ALL"));
  const [isCityModalOpen, setIsCityModalOpen] = React.useState(false);
  const [isFirstVisit, setIsFirstVisit] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("beatroute_city");
      const urlParams = new URLSearchParams(window.location.search);
      const urlCity = urlParams.get("city");
      if (urlCity) {
        localStorage.setItem("beatroute_city", urlCity);
      } else if (savedCity) {
        setSelectedCity(savedCity);
      } else {
        localStorage.setItem("beatroute_city", "ALL");
      }
    }
  }, [setSelectedCity]);

  // 3. Cached Catalog Hook (Reads from Redis / catalog.json snapshot)
  const {
    items: liveCatalogItems,
    isValidating: isCatalogValidating,
    ageMinutes: catalogAgeMinutes,
    refresh: refreshCityCatalog,
  } = useCityCatalog(selectedCity);

  // 4. Master Catalog Compilation + Cross-Platform Deduplication
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const masterCatalog = React.useMemo(() => {
    const rawMap = new Map<string, CatalogItem>();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // A. Baseline catalog.json snapshot
    (initialCatalog as CatalogItem[]).forEach((item) => {
      if (item.type === "movie") {
        if (!item.date || item.date >= thirtyDaysAgo) rawMap.set(item.id, item);
      } else if (!item.date || item.date >= today) {
        rawMap.set(item.id, item);
      }
    });

    // B. Cached city updates
    (liveCatalogItems || []).forEach((item) => {
      if (item.type === "movie") {
        if (!item.date || item.date >= thirtyDaysAgo) rawMap.set(item.id, item);
      } else if (!item.date || item.date >= today) {
        rawMap.set(item.id, item);
      }
    });

    // C. Merge duplicate BMS + District items & fix active tier pricing
    return deduplicateCatalog(Array.from(rawMap.values()));
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

  const handleCitySelect = (code: string) => {
    setSelectedCity(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("beatroute_city", code);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary selection:bg-accent-dune/20 selection:text-accent-dune font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        view="list"
        onViewChange={() => {}}
        selectedCity={selectedCity}
        onOpenCityModal={() => {
          setIsFirstVisit(false);
          setIsCityModalOpen(true);
        }}
        isValidating={isCatalogValidating}
        ageMinutes={catalogAgeMinutes}
        onRefreshLive={refreshCityCatalog}
        showViewToggle={false}
      />

      {/* City Selector Modal */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        isFirstVisit={isFirstVisit}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-5">
        {/* Category Tabs & Header */}
        <div className="space-y-3 pb-2 border-b border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
              {selectedCity === "ALL" ? "India" : selectedCity === "PNQ" ? "Pune" : selectedCity === "BOM" ? "Mumbai" : selectedCity} Entertainment Radar
            </h1>
            <p className="text-xs text-text-muted">
              Unified concerts, live events & movie fee comparison across BookMyShow and District.
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

        {/* TAB 1: CONCERTS & GIGS */}
        {activeCategory === "concerts" && (
          <HybridAggregatorFeed
            items={concertItems}
            userOriginCity={selectedCity === "ALL" ? "PNQ" : selectedCity}
            category="concerts"
            onOpenArbitragePlanner={() => {}}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 2: CINEMA & MOVIES */}
        {activeCategory === "movies" && (
          <HybridAggregatorFeed
            items={movieItems}
            userOriginCity={selectedCity === "ALL" ? "PNQ" : selectedCity}
            category="movies"
            onOpenArbitragePlanner={() => {}}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 3: COMEDY & LIVE EVENTS */}
        {activeCategory === "events" && (
          <HybridAggregatorFeed
            items={eventItems}
            userOriginCity={selectedCity === "ALL" ? "PNQ" : selectedCity}
            category="events"
            onOpenArbitragePlanner={() => {}}
            selectedCity={selectedCity}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle bg-surface/60 py-6 mt-12 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BeatRoute — Indian Entertainment Discovery & Checkout Aggregator.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Pune & Mumbai Twin-Corridor Radar</span>
            <span>•</span>
            <span>BookMyShow & District Deduplicated</span>
            <span>•</span>
            <span>Active Tier & Fee Transparency</span>
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
