import { CatalogItem, Tour, TourStop, GeoCoordinates, TicketTier } from "../types";

const DEFAULT_COORDINATES: Record<string, GeoCoordinates> = {
  BOM: { lat: 19.076, lng: 72.8777 },
  DEL: { lat: 28.6139, lng: 77.209 },
  BLR: { lat: 12.9716, lng: 77.5946 },
  HYD: { lat: 17.385, lng: 78.4867 },
  CCU: { lat: 22.5726, lng: 88.3639 },
  PNQ: { lat: 18.5204, lng: 73.8567 },
  AMD: { lat: 23.0225, lng: 72.5714 },
};

/**
 * Convert a live CatalogItem into a TourStop for the arbitrage engine.
 */
export function catalogItemToTourStop(item: CatalogItem, tourId: string): TourStop {
  const cityCode = item.cityCode ? item.cityCode.toUpperCase() : "BOM";
  const coords =
    item.coordinates || DEFAULT_COORDINATES[cityCode] || { lat: 19.076, lng: 72.8777 };

  const defaultTiers: TicketTier[] = [
    {
      tierId: "silver",
      name: "General Admission",
      priceINR: item.startingPriceINR || 1499,
      availability: "available",
    },
    {
      tierId: "gold",
      name: "Fan Pit / VIP",
      priceINR: Math.round((item.startingPriceINR || 1499) * 2.2),
      availability: "available",
    },
    {
      tierId: "vip",
      name: "Lounge Pass",
      priceINR: Math.round((item.startingPriceINR || 1499) * 4.5),
      availability: "low_stock",
    },
  ];

  return {
    id: item.id,
    tourId,
    artistName: item.title,
    tourName: item.description || item.title,
    cityCode,
    cityName: item.cityName || "India",
    venue: item.venue || `${item.cityName} Venue`,
    coordinates: coords,
    date: item.date || new Date().toISOString().slice(0, 10),
    ticketTiers: item.rawDetails?.ticketTiers || defaultTiers,
    startingPriceINR: item.startingPriceINR || 1499,
    source: (item.source as any) || "bookmyshow",
    externalTicketUrl: item.bookingUrl,
  };
}

/**
 * Group active live upcoming concerts and events into Tour objects.
 * Multi-city tours are prioritized first; single-event tours follow.
 */
export function extractLiveTours(catalogItems: CatalogItem[]): Tour[] {
  const today = new Date().toISOString().slice(0, 10);

  // Filter strictly to upcoming concerts & events
  const upcoming = catalogItems.filter((item) => {
    if (item.type === "movie") return false;
    if (!item.date) return true; // Keep ongoing/announced
    return item.date >= today;
  });

  if (upcoming.length === 0) {
    // Graceful baseline if scraper has not run yet
    return [
      {
        id: "live-national-radar",
        artist: "All-India Live Shows",
        tourName: "Nationwide Upcoming Concerts",
        stops: [],
      },
    ];
  }

  // Group by normalized artist or main title prefix
  const tourGroups = new Map<string, { artist: string; tourName: string; posterUrl: string; items: CatalogItem[] }>();

  for (const item of upcoming) {
    // Normalize artist name (e.g., 'Coldplay: Music of Spheres' -> 'Coldplay')
    const cleanKey = item.title
      .split(":")[0]
      .split("—")[0]
      .split("-")[0]
      .trim()
      .toLowerCase();

    if (!tourGroups.has(cleanKey)) {
      tourGroups.set(cleanKey, {
        artist: item.title.split(":")[0].trim(),
        tourName: item.description || item.title,
        posterUrl: item.posterUrl,
        items: [],
      });
    }

    tourGroups.get(cleanKey)!.items.push(item);
  }

  const tours: Tour[] = [];

  for (const [key, group] of tourGroups.entries()) {
    const tourId = key.replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "tour";
    const stops: TourStop[] = group.items.map((item) =>
      catalogItemToTourStop(item, tourId)
    );

    tours.push({
      id: tourId,
      artist: group.artist,
      tourName: group.tourName,
      posterUrl: group.posterUrl,
      stops,
    });
  }

  // Sort multi-city tours first, then by earliest show date
  tours.sort((a, b) => {
    if (b.stops.length !== a.stops.length) {
      return b.stops.length - a.stops.length;
    }
    const aDate = a.stops[0]?.date || "";
    const bDate = b.stops[0]?.date || "";
    return aDate.localeCompare(bDate);
  });

  return tours;
}
