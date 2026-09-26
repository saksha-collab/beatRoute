export type CityCode = 'BOM' | 'DEL' | 'BLR' | 'IDR' | 'IXC' | 'PNQ' | string;

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface City {
  code: CityCode;
  name: string;
  state: string;
  airportCode: string;
  primaryStationCode: string;
  stationName: string;
  coordinates: GeoCoordinates;
  cabBaseRateINR: number;
}

export type ArtistId = 'karan-aujla' | 'diljit-dosanjh' | 'coldplay' | string;
export type ConcertSource = 'live_api' | 'curated_catalog';

export interface TicketTier {
  tierId: string;
  name: string; // e.g. 'Silver (GA)', 'Gold (Fan Pit)', 'VIP Lounge'
  priceINR: number;
  availability: 'available' | 'low_stock' | 'sold_out';
}

export interface TourStop {
  id: string;
  tourId: ArtistId;
  artistName: string;
  tourName: string;
  cityCode: CityCode;
  cityName: string;
  venue: string;
  coordinates: GeoCoordinates;
  date: string; // 'YYYY-MM-DD'
  ticketTiers: TicketTier[];
  startingPriceINR: number;
  source: ConcertSource;
  externalTicketUrl?: string;
}

export interface Tour {
  id: ArtistId;
  artist: string;
  tourName: string;
  posterUrl?: string;
  stops: TourStop[];
}

export type TransitMode = 'flight' | 'rail';
export type RailClass = 'SL' | '3AC' | '2AC' | 'VANDE_BHARAT';
export type StayPreference = 'budget' | 'comfort' | 'luxury';
export type TrainType = 'Superfast' | 'Rajdhani' | 'Vande Bharat' | 'Express' | 'Shatabdi';

export interface RailClassFare {
  fareINR: number; // One-way base fare (engine multiplies x2 for round-trip)
  durationMinutes: number;
  departureTime: string;
  arrivalTime: string;
}

export interface RailRouteQuote {
  origin: CityCode;
  destination: CityCode;
  trainNumber: string;
  trainName: string;
  trainType: TrainType;
  distanceKm: number;
  frequency: string;
  classes: Partial<Record<RailClass, RailClassFare>>;
  source: 'curated_baseline';
}

export interface FlightQuote {
  origin: CityCode;
  destination: CityCode;
  roundTripFareINR: number;
  airline: string;
  durationMinutes: number;
  stops: number;
  source: 'amadeus' | 'estimated_baseline';
}

export interface LodgingQuote {
  cityCode: CityCode;
  baseRatePerNightINR: number;
  hotelTier: StayPreference;
  surgeMultiplier: number;
}

// Complete Arbitrage Result for Matrix comparison
export interface ArbitrageResult {
  destinationCity: City;
  tourStop: TourStop;
  selectedTier: TicketTier;
  transitMode: TransitMode;
  selectedRailClass?: RailClass;
  
  // Cost breakdown
  ticketCostINR: number;
  transitCostINR: number; // Round-trip
  lodgingCostINR: number; // 1-night concert stay
  localCabCostINR: number; // Airport/station + venue transfers
  totalTripCostINR: number;
  
  // Transit metadata
  transitDurationMinutes: number;
  transitDetails: {
    mode: TransitMode;
    carrierOrTrainName: string;
    carrierNumber?: string;
    isEstimatedBaseline: boolean;
  };

  // Comparative Arbitrage
  isHomeCity: boolean;
  homeCityTotalCostINR: number | null;
  netSavingsINR: number | null; // positive = travelling saves money, negative = traveling costs more
  arbitrageRank: number; // 1 = highest savings / best value
  isSweetSpot: boolean; // optimized balance of savings vs transit travel duration
  badges: string[]; // e.g. ["Cheapest Ticket", "Fastest Rail", "Sweet Spot Pick"]
}

// Map Marker & Expense Planner Integration Contracts
export interface CalculatorPrefillPayload {
  tourStop: TourStop;
  selectedTierId?: string;
  defaultOriginCityCode?: CityCode;
}

export interface TripItineraryBreakdown {
  originCity: City;
  destinationStop: TourStop;
  selectedTier: TicketTier;
  transitMode: TransitMode;
  railClass?: RailClass;
  stayPreference: StayPreference;
  
  ticketINR: number;
  transitINR: number;
  lodgingINR: number;
  cabINR: number;
  totalINR: number;
  transitDurationMinutes: number;
  isEstimatedBaseline: boolean;
}

// API Error Contract
export type ApiErrorCode = 'NO_CONCERTS' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'INVALID_QUERY' | 'AUTH_REQUIRED';

export interface ConcertApiResponse {
  success: boolean;
  data?: TourStop[];
  error?: string;
  code?: ApiErrorCode;
  source: ConcertSource;
}
