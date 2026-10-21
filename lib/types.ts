export type CityCode = 'PNQ' | 'BOM' | 'BLR' | 'DEL' | 'HYD' | 'CCU' | 'AMD' | string;

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface City {
  code: CityCode;
  name: string;
  state: string;
  airportCode?: string;
  primaryStationCode?: string;
  stationName?: string;
  coordinates: GeoCoordinates;
  cabBaseRateINR?: number;
}

export type CatalogItemType = 'movie' | 'concert' | 'event';
export type CatalogSource = 'bookmyshow' | 'district' | 'skillbox' | 'sortmyscene' | 'curated_catalog' | 'live_api';

export type TicketTierAvailability = 'available' | 'low_stock' | 'sold_out';
export type TicketStatus = 'available' | 'low_stock' | 'sold_out' | 'announced';

export interface TicketTier {
  tierId: string;
  name: string; // e.g. 'Early Bird', 'GA Phase 1', 'VIP Lounge'
  priceINR: number;
  availability: TicketTierAvailability;
}

/**
 * Represents a single platform's listing for a movie, concert, or live event.
 * When an item appears on both BookMyShow and District, both listings are
 * merged into `CatalogItem.listings`.
 */
export interface PlatformListing {
  source: CatalogSource;
  sourceId: string;
  bookingUrl: string;
  startingPriceINR?: number; // Active available tier price (undefined for movies with variable showtimes)
  lowestListedPriceINR?: number; // Original headline price (e.g. sold-out Early Bird)
  activePhaseName?: string; // e.g. 'Phase 2' or 'General Admission'
  ticketTiers?: TicketTier[];
  ticketStatus?: TicketStatus;
  convenienceFeePercent?: number; // Typical platform booking fee (~10% + 18% GST)
  lastVerifiedAt?: string;
}

export interface CatalogItem {
  id: string; // Canonical ID after deduplication (or platform ID pre-merge)
  type: CatalogItemType;
  source: CatalogSource; // Primary source (or 'bookmyshow' / 'district')
  title: string;
  normalizedTitle?: string;
  description?: string;
  category: string; // e.g. 'Concert', 'Cinema', 'Stand-up Comedy', 'Nightlife'
  languages?: string[];
  posterUrl: string;
  bannerUrl?: string;
  cityCode: CityCode;
  cityName: string;
  venue?: string; // Cinema chain or concert arena
  coordinates?: GeoCoordinates;
  date?: string; // 'YYYY-MM-DD'
  time?: string; // e.g. '19:00 IST'
  startingPriceINR?: number; // Lowest currently AVAILABLE price across platforms
  lowestListedPriceINR?: number; // Lowest price including sold-out early phases (for transparency)
  activePhaseName?: string; // Name of the lowest currently available tier
  hasSoldOutEarlyPhases?: boolean; // True if Early Bird / Phase 1 is sold out
  ticketStatus?: TicketStatus;
  bookingUrl: string;
  rating?: string;
  rawDetails?: Record<string, any>;

  // Multi-platform aggregation fields (populated by lib/deduplicate.ts)
  listings?: PlatformListing[];
  availablePlatforms?: CatalogSource[];
  isExclusive?: boolean; // True if locked to a single ticketing partner
}

/**
 * Indian Credit/Debit Card Offer Rules for Step 3 (Movie & Event Checkout Calculator)
 */
export interface BankCardOffer {
  id: string;
  bankName: string; // e.g. 'ICICI Bank', 'Axis Bank', 'IDFC FIRST Bank', 'HDFC Bank'
  cardName: string; // e.g. 'Sapphiro', 'MyZone', 'Wealth / Select', 'Diners Club Privilege'
  platform: 'bookmyshow' | 'district' | 'pvr_direct';
  applicableTo: ('movie' | 'concert' | 'event')[];
  offerType: 'bogo' | 'percentage' | 'flat';
  maxDiscountINR: number; // e.g. 500 for Sapphiro BOGO, 200 for Axis MyZone
  discountPercent?: number; // e.g. 100 for BOGO, 25 for 25% off
  minTickets: number; // e.g. 2 for BOGO
  validDays?: string[]; // e.g. ['Fri', 'Sat', 'Sun'] or all days
  termsSummary: string; // e.g. 'Buy 1 Get 1 free up to ₹500 on second ticket'
}

export interface MovieCheckoutOption {
  platform: 'bookmyshow' | 'district' | 'pvr_direct';
  platformName: string;
  bookingUrl?: string;
  ticketCount: number;
  baseTicketPriceINR: number;
  baseSubtotalINR: number;
  convenienceFeePerTicketINR: number;
  gstOnFeeINR: number;
  totalConvenienceFeeINR: number;
  appliedCardOffer?: BankCardOffer;
  cardDiscountINR: number;
  netPayableINR: number;
  savingsVsHighestINR: number;
  isCheapest: boolean;
}

/**
 * Legacy type aliases retained solely for backward compatibility during Step 1-2 transition
 */
export interface ConcertEvent {
  id: string;
  artist: string;
  tourName: string;
  artistImageUrl: string;
  date: string;
  time?: string;
  cityCode: CityCode;
  cityName: string;
  venue: string;
  coordinates: GeoCoordinates;
  genres: string[];
  startingPriceINR: number;
  ticketTiers: TicketTier[];
  ticketStatus: TicketStatus;
  bookingUrl: string;
  source: CatalogSource;
  highlights?: string[];
}
