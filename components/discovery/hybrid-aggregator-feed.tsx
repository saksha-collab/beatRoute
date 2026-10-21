"use client";

import * as React from "react";
import { CatalogItem } from "@/lib/types";
import { AggregatorCard } from "./aggregator-card";
import { StickyPreviewPanel } from "./sticky-preview-panel";
import {
  AggregatorSearchBar,
  PlatformFilter,
  SortOption,
} from "./aggregator-search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface HybridAggregatorFeedProps {
  items: CatalogItem[];
  userOriginCity: string;
  category: "concerts" | "movies" | "events";
  onOpenArbitragePlanner?: (item: CatalogItem) => void;
  selectedCity: string;
}

export function HybridAggregatorFeed({
  items,
  userOriginCity,
  category,
  selectedCity,
}: HybridAggregatorFeedProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilter>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("cheapest");
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let list = [...items];

    // Strict upcoming date filter (prune past shows)
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    list = list.filter((item) => {
      if (item.type === "movie") {
        return !item.date || item.date >= thirtyDaysAgo;
      }
      if (!item.date) return true;
      return item.date >= today;
    });

    // Multi-Platform aware filter (includes items listed on the chosen platform)
    if (platformFilter !== "all") {
      list = list.filter(
        (i) =>
          i.source === platformFilter ||
          (i.availablePlatforms && i.availablePlatforms.includes(platformFilter))
      );
    }

    // City filter (if not ALL)
    if (selectedCity && selectedCity !== "ALL") {
      list = list.filter((i) => {
        if (i.type === "movie" && (!i.cityCode || i.cityCode.toUpperCase() === "ALL")) {
          return true;
        }
        return i.cityCode && i.cityCode.toUpperCase() === selectedCity.toUpperCase();
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.venue && i.venue.toLowerCase().includes(q)) ||
          (i.cityName && i.cityName.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "cheapest") {
        return (a.startingPriceINR || 250) - (b.startingPriceINR || 250);
      }
      if (sortBy === "date") {
        return (a.date || "").localeCompare(b.date || "");
      }
      if (sortBy === "platforms") {
        return (b.availablePlatforms?.length || 1) - (a.availablePlatforms?.length || 1);
      }
      return 0;
    });

    return list;
  }, [items, platformFilter, selectedCity, searchQuery, sortBy]);

  // Selected Item
  const activeItem = React.useMemo(() => {
    if (selectedItemId) {
      const found = filteredItems.find((i) => i.id === selectedItemId);
      if (found) return found;
    }
    return filteredItems[0] || null;
  }, [selectedItemId, filteredItems]);

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItemId(item.id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileSheetOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filtering Bar */}
      <AggregatorSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        category={category}
      />

      {/* Results Header Summary */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          Showing <strong className="text-text-primary">{filteredItems.length}</strong> {category}
          {selectedCity !== "ALL" && <span> in {selectedCity}</span>}
        </span>
        <span>Deduplicated across BookMyShow & District by Zomato</span>
      </div>

      {/* Main Hybrid Grid: Left List (7 Cols) + Right Sticky Preview (5 Cols) */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Aggregator List */}
          <div className="lg:col-span-7 space-y-3">
            {filteredItems.map((item) => (
              <AggregatorCard
                key={item.id}
                item={item}
                isSelected={activeItem?.id === item.id}
                onSelect={handleSelectItem}
              />
            ))}
          </div>

          {/* Right Column: Desktop Sticky Preview Panel */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <StickyPreviewPanel
              item={activeItem}
              userOriginCity={userOriginCity}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title={`No ${category} found`}
          message={
            searchQuery
              ? `No results matching "${searchQuery}". Try adjusting your query or platform filters.`
              : `No scheduled ${category} found in ${selectedCity}. Try selecting 'All India' or switching between Pune and Mumbai.`
          }
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setPlatformFilter("all");
          }}
        />
      )}

      {/* Mobile Drawer Sheet for Sticky Preview */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent
          side="bottom"
          className="p-4 sm:p-6 bg-surface max-h-[85vh] overflow-y-auto rounded-t-3xl"
        >
          <StickyPreviewPanel
            item={activeItem}
            userOriginCity={userOriginCity}
            onCloseMobileDrawer={() => setIsMobileSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
