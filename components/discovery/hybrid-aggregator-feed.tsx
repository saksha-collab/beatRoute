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
  onOpenArbitragePlanner: (item: CatalogItem) => void;
  selectedCity: string;
}

export function HybridAggregatorFeed({
  items,
  userOriginCity,
  category,
  onOpenArbitragePlanner,
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

    // Platform filter
    if (platformFilter !== "all") {
      list = list.filter((i) => i.source === platformFilter);
    }

    // City filter (if not ALL)
    if (selectedCity && selectedCity !== "ALL") {
      list = list.filter(
        (i) => i.cityCode && i.cityCode.toUpperCase() === selectedCity.toUpperCase()
      );
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
        return (a.startingPriceINR || 99999) - (b.startingPriceINR || 99999);
      }
      if (sortBy === "date") {
        return (a.date || "").localeCompare(b.date || "");
      }
      if (sortBy === "savings") {
        // Concerts in different cities have higher potential arbitrage
        const aDiff = a.cityCode !== userOriginCity ? 1 : 0;
        const bDiff = b.cityCode !== userOriginCity ? 1 : 0;
        return bDiff - aDiff;
      }
      return 0;
    });

    return list;
  }, [items, platformFilter, selectedCity, searchQuery, sortBy, userOriginCity]);

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
    // On small screens, open the mobile sheet
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
        <span>Verified from BookMyShow & District by Zomato</span>
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
                travelSavingsINR={
                  item.cityCode && item.cityCode !== userOriginCity ? 3400 : undefined
                }
              />
            ))}
          </div>

          {/* Right Column: Desktop Sticky Preview Panel */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <StickyPreviewPanel
              item={activeItem}
              userOriginCity={userOriginCity}
              onOpenArbitragePlanner={onOpenArbitragePlanner}
            />
          </div>

        </div>
      ) : (
        <EmptyState
          title={`No ${category} found`}
          message={
            searchQuery
              ? `No results matching "${searchQuery}". Try adjusting your query or platform filters.`
              : `No scheduled ${category} found in ${selectedCity}. Try selecting 'All India' to see nationwide events.`
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
        <SheetContent side="bottom" className="p-4 sm:p-6 bg-surface max-h-[85vh] overflow-y-auto rounded-t-3xl">
          <StickyPreviewPanel
            item={activeItem}
            userOriginCity={userOriginCity}
            onOpenArbitragePlanner={(item) => {
              setIsMobileSheetOpen(false);
              onOpenArbitragePlanner(item);
            }}
            onCloseMobileDrawer={() => setIsMobileSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
