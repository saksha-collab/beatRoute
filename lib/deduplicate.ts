import {
  CatalogItem,
  CatalogSource,
  PlatformListing,
  TicketStatus,
  TicketTier,
} from './types';

/**
 * Normalizes a movie, concert, or event title so cross-platform listings
 * (e.g., "Drishyam: The Conclusion" on District vs "Drishyam The Conclusion" on BMS)
 * match deterministically.
 */
export function normalizeEntityTitle(rawTitle: string): string {
  if (!rawTitle) return '';

  return rawTitle
    .toLowerCase()
    // Remove common ticketing suffixes & noise words
    .replace(/\b(movie tickets|buy tickets|tickets|live in concert|india tour|world tour)\b/gi, '')
    // Remove trailing city tags like "- mumbai", "| pune", "(bengaluru)"
    .replace(/[-|–—(\s]+(mumbai|pune|bengaluru|bangalore|delhi|delhi ncr|hyderabad|kolkata|ahmedabad)[)\s]*$/gi, '')
    // Remove year suffixes like (2026) or 2026
    .replace(/\(\d{4}\)/g, '')
    // Strip all non-alphanumeric characters (colons, hyphens, apostrophes)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inspects a list of scraped ticket tiers and computes:
 * 1. The lowest price tier that is actually AVAILABLE ('available' or 'low_stock')
 * 2. The lowest overall listed tier (including sold-out Early Bird tiers)
 * 3. Whether early phases are sold out (to warn the user against bait-and-switch pricing)
 * 4. Overall ticket status ('available' | 'low_stock' | 'sold_out')
 */
export function computeActiveTierPricing(
  tiers?: TicketTier[],
  fallbackPriceINR?: number
): {
  activePriceINR?: number;
  lowestListedPriceINR?: number;
  activePhaseName?: string;
  hasSoldOutEarlyPhases: boolean;
  ticketStatus: TicketStatus;
} {
  if (!tiers || tiers.length === 0) {
    return {
      activePriceINR: fallbackPriceINR,
      lowestListedPriceINR: fallbackPriceINR,
      activePhaseName: undefined,
      hasSoldOutEarlyPhases: false,
      ticketStatus: 'available',
    };
  }

  const validTiers = tiers.filter((t) => typeof t.priceINR === 'number' && t.priceINR >= 0);
  if (validTiers.length === 0) {
    return {
      activePriceINR: fallbackPriceINR,
      lowestListedPriceINR: fallbackPriceINR,
      activePhaseName: undefined,
      hasSoldOutEarlyPhases: false,
      ticketStatus: 'available',
    };
  }

  const sortedAll = [...validTiers].sort((a, b) => a.priceINR - b.priceINR);
  const lowestListedPriceINR = sortedAll[0].priceINR;

  const availableTiers = sortedAll.filter(
    (t) => t.availability === 'available' || t.availability === 'low_stock'
  );

  if (availableTiers.length === 0) {
    // Every single tier is sold out!
    return {
      activePriceINR: sortedAll[sortedAll.length - 1].priceINR,
      lowestListedPriceINR,
      activePhaseName: 'Sold Out',
      hasSoldOutEarlyPhases: true,
      ticketStatus: 'sold_out',
    };
  }

  const cheapestActive = availableTiers[0];
  const hasSoldOutEarlyPhases = sortedAll.some(
    (t) => t.availability === 'sold_out' && t.priceINR < cheapestActive.priceINR
  );

  const allLowStock = availableTiers.every((t) => t.availability === 'low_stock');

  return {
    activePriceINR: cheapestActive.priceINR,
    lowestListedPriceINR,
    activePhaseName: cheapestActive.name,
    hasSoldOutEarlyPhases,
    ticketStatus: allLowStock ? 'low_stock' : 'available',
  };
}

/**
 * Converts a single CatalogItem into a structured PlatformListing entry.
 */
function toPlatformListing(item: CatalogItem): PlatformListing {
  const rawTiers: TicketTier[] | undefined = item.rawDetails?.ticketTiers;
  const isMovie = item.type === 'movie';

  // Strip hardcoded fake movie prices (250 on BMS, 199 on District) when no real tier data exists
  const isFakeHardcodedMoviePrice =
    isMovie &&
    !rawTiers &&
    ((item.source === 'bookmyshow' && item.startingPriceINR === 250) ||
      (item.source === 'district' && item.startingPriceINR === 199));

  const tierMetrics = computeActiveTierPricing(
    rawTiers,
    isFakeHardcodedMoviePrice ? undefined : item.startingPriceINR
  );

  return {
    source: item.source,
    sourceId: item.id,
    bookingUrl: item.bookingUrl,
    startingPriceINR: tierMetrics.activePriceINR,
    lowestListedPriceINR: tierMetrics.lowestListedPriceINR,
    activePhaseName: tierMetrics.activePhaseName,
    ticketTiers: rawTiers,
    ticketStatus: item.rawDetails?.ticketStatus === 'sold_out' ? 'sold_out' : tierMetrics.ticketStatus,
    convenienceFeePercent: item.source === 'bookmyshow' ? 11.8 : 10.0,
  };
}

/**
 * Deduplicates and merges CatalogItems across BookMyShow, District, and other platforms.
 * - Groups items by (cityCode + type + normalizedTitle)
 * - Merges platform links into `listings: PlatformListing[]`
 * - Computes accurate active starting price from available tiers
 * - Marks whether an event is exclusive to one platform (`isExclusive`)
 */
export function deduplicateCatalog(items: CatalogItem[]): CatalogItem[] {
  const groups = new Map<string, CatalogItem[]>();

  for (const rawItem of items) {
    // Fix legacy BMS music events that were saved as 'event' instead of 'concert'
    const correctedType =
      rawItem.type === 'event' &&
      (rawItem.category?.toLowerCase().includes('music') ||
        rawItem.category?.toLowerCase().includes('concert') ||
        /concert|festival|sunburn|anyma|live in concert|tour|symphony|gig/i.test(rawItem.title))
        ? 'concert'
        : rawItem.type;

    const item: CatalogItem = {
      ...rawItem,
      type: correctedType,
    };

    const normTitle = normalizeEntityTitle(item.title);
    if (!normTitle) continue;

    const cityKey = (item.cityCode || 'ALL').toUpperCase();
    const key = `${cityKey}::${item.type}::${normTitle}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  const mergedCatalog: CatalogItem[] = [];

  for (const [, groupItems] of groups.entries()) {
    // Prefer item with richer metadata (e.g. valid poster, ticketTiers, longer description) as primary shell
    const sortedPrimary = [...groupItems].sort((a, b) => {
      const aHasTiers = Array.isArray(a.rawDetails?.ticketTiers) ? 1 : 0;
      const bHasTiers = Array.isArray(b.rawDetails?.ticketTiers) ? 1 : 0;
      if (bHasTiers !== aHasTiers) return bHasTiers - aHasTiers;
      return (b.description?.length || 0) - (a.description?.length || 0);
    });

    const primary = sortedPrimary[0];
    const listingsBySource = new Map<CatalogSource, PlatformListing>();

    for (const candidate of groupItems) {
      const listing = toPlatformListing(candidate);
      if (!listingsBySource.has(candidate.source)) {
        listingsBySource.set(candidate.source, listing);
      }
    }

    const listings = Array.from(listingsBySource.values());
    const availablePlatforms = listings.map((l) => l.source);

    // Compute best active price across all platforms for this item
    const activePrices = listings
      .filter((l) => l.ticketStatus !== 'sold_out' && typeof l.startingPriceINR === 'number')
      .map((l) => l.startingPriceINR as number);

    const allListedPrices = listings
      .filter((l) => typeof l.lowestListedPriceINR === 'number')
      .map((l) => l.lowestListedPriceINR as number);

    const bestActivePrice =
      activePrices.length > 0
        ? Math.min(...activePrices)
        : allListedPrices.length > 0
        ? Math.min(...allListedPrices)
        : undefined;

    const lowestListedPrice =
      allListedPrices.length > 0 ? Math.min(...allListedPrices) : bestActivePrice;

    const primaryListing = listings[0];
    const allSoldOut =
      listings.length > 0 && listings.every((l) => l.ticketStatus === 'sold_out');
    const anySoldOutEarly = listings.some(
      (l) =>
        typeof l.lowestListedPriceINR === 'number' &&
        typeof l.startingPriceINR === 'number' &&
        l.lowestListedPriceINR < l.startingPriceINR
    );

    mergedCatalog.push({
      ...primary,
      normalizedTitle: normalizeEntityTitle(primary.title),
      startingPriceINR: bestActivePrice,
      lowestListedPriceINR: lowestListedPrice,
      activePhaseName: primaryListing?.activePhaseName,
      hasSoldOutEarlyPhases: anySoldOutEarly,
      ticketStatus: allSoldOut ? 'sold_out' : primaryListing?.ticketStatus || 'available',
      listings,
      availablePlatforms,
      isExclusive: availablePlatforms.length === 1,
    });
  }

  return mergedCatalog;
}
