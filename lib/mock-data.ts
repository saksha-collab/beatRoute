import { City, FlightQuote, LodgingQuote, StayPreference, Tour } from "./types";

export const CITIES: City[] = [
  {
    code: "BOM",
    name: "Mumbai",
    state: "Maharashtra",
    airportCode: "BOM",
    primaryStationCode: "MMCT",
    stationName: "Mumbai Central",
    coordinates: { lat: 19.0330, lng: 73.0297 }, // DY Patil Stadium / Navi Mumbai hub
    cabBaseRateINR: 1800, // airport/station to stadium + venue roundtrip
  },
  {
    code: "DEL",
    name: "Delhi NCR",
    state: "Delhi",
    airportCode: "DEL",
    primaryStationCode: "NDLS",
    stationName: "New Delhi Railway Station",
    coordinates: { lat: 28.5828, lng: 77.2344 }, // Jawaharlal Nehru Stadium
    cabBaseRateINR: 1500,
  },
  {
    code: "BLR",
    name: "Bengaluru",
    state: "Karnataka",
    airportCode: "BLR",
    primaryStationCode: "SBC",
    stationName: "KSR Bengaluru",
    coordinates: { lat: 13.0538, lng: 77.4697 }, // NICE Exhibition Grounds
    cabBaseRateINR: 2200, // Bangalore airport is far, higher transfers
  },
  {
    code: "IDR",
    name: "Indore",
    state: "Madhya Pradesh",
    airportCode: "IDR",
    primaryStationCode: "INDB",
    stationName: "Indore Junction",
    coordinates: { lat: 22.7244, lng: 75.8752 }, // Holkar Stadium
    cabBaseRateINR: 800, // Compact city, cheaper cabs
  },
  {
    code: "IXC",
    name: "Chandigarh",
    state: "Punjab/UT",
    airportCode: "IXC",
    primaryStationCode: "CDG",
    stationName: "Chandigarh Junction",
    coordinates: { lat: 30.7225, lng: 76.7681 }, // Sector 34 Exhibition Grounds
    cabBaseRateINR: 900,
  },
];

export const CITY_MAP: Record<string, City> = CITIES.reduce((acc, city) => {
  acc[city.code] = city;
  return acc;
}, {} as Record<string, City>);

export const FEATURED_TOURS: Tour[] = [
  {
    id: "coldplay",
    artist: "Coldplay",
    tourName: "Music of the Spheres World Tour",
    stops: [
      {
        id: "coldplay-bom",
        tourId: "coldplay",
        artistName: "Coldplay",
        tourName: "Music of the Spheres World Tour",
        cityCode: "BOM",
        cityName: "Mumbai",
        venue: "DY Patil Sports Stadium",
        coordinates: { lat: 19.0330, lng: 73.0297 },
        date: "2025-01-18",
        source: "curated_catalog",
        startingPriceINR: 9500,
        ticketTiers: [
          { tierId: "silver", name: "Standing Floor (GA)", priceINR: 9500, availability: "low_stock" },
          { tierId: "gold", name: "Premium Seated Level 2", priceINR: 18500, availability: "available" },
          { tierId: "vip", name: "Infinity VIP Lounge", priceINR: 35000, availability: "low_stock" },
        ],
      },
      {
        id: "coldplay-del",
        tourId: "coldplay",
        artistName: "Coldplay",
        tourName: "Music of the Spheres World Tour",
        cityCode: "DEL",
        cityName: "Delhi NCR",
        venue: "Jawaharlal Nehru Stadium",
        coordinates: { lat: 28.5828, lng: 77.2344 },
        date: "2025-01-25",
        source: "curated_catalog",
        startingPriceINR: 8500,
        ticketTiers: [
          { tierId: "silver", name: "Standing Floor (GA)", priceINR: 8500, availability: "available" },
          { tierId: "gold", name: "Premium Seated Level 2", priceINR: 16500, availability: "available" },
          { tierId: "vip", name: "Infinity VIP Lounge", priceINR: 32000, availability: "available" },
        ],
      },
      {
        id: "coldplay-blr",
        tourId: "coldplay",
        artistName: "Coldplay",
        tourName: "Music of the Spheres World Tour",
        cityCode: "BLR",
        cityName: "Bengaluru",
        venue: "NICE Exhibition Grounds",
        coordinates: { lat: 13.0538, lng: 77.4697 },
        date: "2025-02-02",
        source: "curated_catalog",
        startingPriceINR: 7000,
        ticketTiers: [
          { tierId: "silver", name: "Standing Floor (GA)", priceINR: 7000, availability: "available" },
          { tierId: "gold", name: "Premium Seated Level 2", priceINR: 13500, availability: "available" },
          { tierId: "vip", name: "Infinity VIP Lounge", priceINR: 28000, availability: "available" },
        ],
      },
      {
        id: "coldplay-idr",
        tourId: "coldplay",
        artistName: "Coldplay",
        tourName: "Music of the Spheres World Tour",
        cityCode: "IDR",
        cityName: "Indore",
        venue: "Holkar Cricket Stadium",
        coordinates: { lat: 22.7244, lng: 75.8752 },
        date: "2025-02-09",
        source: "curated_catalog",
        startingPriceINR: 4200,
        ticketTiers: [
          { tierId: "silver", name: "Standing Floor (GA)", priceINR: 4200, availability: "available" },
          { tierId: "gold", name: "Premium Seated Level 2", priceINR: 8500, availability: "available" },
          { tierId: "vip", name: "Infinity VIP Lounge", priceINR: 18000, availability: "available" },
        ],
      },
      {
        id: "coldplay-ixc",
        tourId: "coldplay",
        artistName: "Coldplay",
        tourName: "Music of the Spheres World Tour",
        cityCode: "IXC",
        cityName: "Chandigarh",
        venue: "Sector 34 Exhibition Grounds",
        coordinates: { lat: 30.7225, lng: 76.7681 },
        date: "2025-02-16",
        source: "curated_catalog",
        startingPriceINR: 4500,
        ticketTiers: [
          { tierId: "silver", name: "Standing Floor (GA)", priceINR: 4500, availability: "available" },
          { tierId: "gold", name: "Premium Seated Level 2", priceINR: 9000, availability: "available" },
          { tierId: "vip", name: "Infinity VIP Lounge", priceINR: 19500, availability: "available" },
        ],
      },
    ],
  },
  {
    id: "diljit-dosanjh",
    artist: "Diljit Dosanjh",
    tourName: "Dil-Luminati Tour India 2024–25",
    stops: [
      {
        id: "diljit-del",
        tourId: "diljit-dosanjh",
        artistName: "Diljit Dosanjh",
        tourName: "Dil-Luminati Tour",
        cityCode: "DEL",
        cityName: "Delhi NCR",
        venue: "JLN Stadium Arena",
        coordinates: { lat: 28.5828, lng: 77.2344 },
        date: "2024-10-26",
        source: "curated_catalog",
        startingPriceINR: 11000,
        ticketTiers: [
          { tierId: "silver", name: "Silver Zone", priceINR: 11000, availability: "low_stock" },
          { tierId: "gold", name: "Gold Fan Pit", priceINR: 19500, availability: "low_stock" },
          { tierId: "vip", name: "Dil-Luminati Lounge", priceINR: 36000, availability: "low_stock" },
        ],
      },
      {
        id: "diljit-ixc",
        tourId: "diljit-dosanjh",
        artistName: "Diljit Dosanjh",
        tourName: "Dil-Luminati Tour",
        cityCode: "IXC",
        cityName: "Chandigarh",
        venue: "Sector 34 Grounds",
        coordinates: { lat: 30.7225, lng: 76.7681 },
        date: "2024-12-14",
        source: "curated_catalog",
        startingPriceINR: 8500,
        ticketTiers: [
          { tierId: "silver", name: "Silver Zone", priceINR: 8500, availability: "available" },
          { tierId: "gold", name: "Gold Fan Pit", priceINR: 15000, availability: "available" },
          { tierId: "vip", name: "Dil-Luminati Lounge", priceINR: 28000, availability: "available" },
        ],
      },
      {
        id: "diljit-idr",
        tourId: "diljit-dosanjh",
        artistName: "Diljit Dosanjh",
        tourName: "Dil-Luminati Tour",
        cityCode: "IDR",
        cityName: "Indore",
        venue: "Holkar Stadium Grounds",
        coordinates: { lat: 22.7244, lng: 75.8752 },
        date: "2024-12-08",
        source: "curated_catalog",
        startingPriceINR: 3800,
        ticketTiers: [
          { tierId: "silver", name: "Silver Zone", priceINR: 3800, availability: "available" },
          { tierId: "gold", name: "Gold Fan Pit", priceINR: 7500, availability: "available" },
          { tierId: "vip", name: "Dil-Luminati Lounge", priceINR: 16000, availability: "available" },
        ],
      },
      {
        id: "diljit-blr",
        tourId: "diljit-dosanjh",
        artistName: "Diljit Dosanjh",
        tourName: "Dil-Luminati Tour",
        cityCode: "BLR",
        cityName: "Bengaluru",
        venue: "NICE Grounds Bangalore",
        coordinates: { lat: 13.0538, lng: 77.4697 },
        date: "2024-12-06",
        source: "curated_catalog",
        startingPriceINR: 6500,
        ticketTiers: [
          { tierId: "silver", name: "Silver Zone", priceINR: 6500, availability: "available" },
          { tierId: "gold", name: "Gold Fan Pit", priceINR: 12500, availability: "available" },
          { tierId: "vip", name: "Dil-Luminati Lounge", priceINR: 25000, availability: "available" },
        ],
      },
      {
        id: "diljit-bom",
        tourId: "diljit-dosanjh",
        artistName: "Diljit Dosanjh",
        tourName: "Dil-Luminati Tour",
        cityCode: "BOM",
        cityName: "Mumbai",
        venue: "Mahalaxmi Racecourse",
        coordinates: { lat: 18.9826, lng: 72.8228 },
        date: "2024-12-19",
        source: "curated_catalog",
        startingPriceINR: 9800,
        ticketTiers: [
          { tierId: "silver", name: "Silver Zone", priceINR: 9800, availability: "low_stock" },
          { tierId: "gold", name: "Gold Fan Pit", priceINR: 18000, availability: "available" },
          { tierId: "vip", name: "Dil-Luminati Lounge", priceINR: 34000, availability: "available" },
        ],
      },
    ],
  },
  {
    id: "karan-aujla",
    artist: "Karan Aujla",
    tourName: "It Was All A Dream Tour India",
    stops: [
      {
        id: "aujla-del",
        tourId: "karan-aujla",
        artistName: "Karan Aujla",
        tourName: "It Was All A Dream Tour",
        cityCode: "DEL",
        cityName: "Delhi NCR",
        venue: "Airia Mall Arena / JLN",
        coordinates: { lat: 28.5828, lng: 77.2344 },
        date: "2024-12-15",
        source: "curated_catalog",
        startingPriceINR: 6000,
        ticketTiers: [
          { tierId: "silver", name: "General Admission", priceINR: 6000, availability: "available" },
          { tierId: "gold", name: "Fan Pit Gold", priceINR: 11000, availability: "available" },
          { tierId: "vip", name: "Dream VIP Table", priceINR: 22000, availability: "available" },
        ],
      },
      {
        id: "aujla-ixc",
        tourId: "karan-aujla",
        artistName: "Karan Aujla",
        tourName: "It Was All A Dream Tour",
        cityCode: "IXC",
        cityName: "Chandigarh",
        venue: "CGC Landran Grounds",
        coordinates: { lat: 30.7225, lng: 76.7681 },
        date: "2024-12-07",
        source: "curated_catalog",
        startingPriceINR: 4800,
        ticketTiers: [
          { tierId: "silver", name: "General Admission", priceINR: 4800, availability: "available" },
          { tierId: "gold", name: "Fan Pit Gold", priceINR: 9000, availability: "available" },
          { tierId: "vip", name: "Dream VIP Table", priceINR: 18000, availability: "available" },
        ],
      },
      {
        id: "aujla-idr",
        tourId: "karan-aujla",
        artistName: "Karan Aujla",
        tourName: "It Was All A Dream Tour",
        cityCode: "IDR",
        cityName: "Indore",
        venue: "Labh Ganga Ground",
        coordinates: { lat: 22.7244, lng: 75.8752 },
        date: "2024-12-20",
        source: "curated_catalog",
        startingPriceINR: 2500,
        ticketTiers: [
          { tierId: "silver", name: "General Admission", priceINR: 2500, availability: "available" },
          { tierId: "gold", name: "Fan Pit Gold", priceINR: 5200, availability: "available" },
          { tierId: "vip", name: "Dream VIP Table", priceINR: 12000, availability: "available" },
        ],
      },
      {
        id: "aujla-blr",
        tourId: "karan-aujla",
        artistName: "Karan Aujla",
        tourName: "It Was All A Dream Tour",
        cityCode: "BLR",
        cityName: "Bengaluru",
        venue: "Manpho Convention Grounds",
        coordinates: { lat: 13.0538, lng: 77.4697 },
        date: "2024-12-13",
        source: "curated_catalog",
        startingPriceINR: 4000,
        ticketTiers: [
          { tierId: "silver", name: "General Admission", priceINR: 4000, availability: "available" },
          { tierId: "gold", name: "Fan Pit Gold", priceINR: 8000, availability: "available" },
          { tierId: "vip", name: "Dream VIP Table", priceINR: 17000, availability: "available" },
        ],
      },
      {
        id: "aujla-bom",
        tourId: "karan-aujla",
        artistName: "Karan Aujla",
        tourName: "It Was All A Dream Tour",
        cityCode: "BOM",
        cityName: "Mumbai",
        venue: "Dome SVP Stadium NSCI",
        coordinates: { lat: 18.9899, lng: 72.8164 },
        date: "2024-12-21",
        source: "curated_catalog",
        startingPriceINR: 7500,
        ticketTiers: [
          { tierId: "silver", name: "General Admission", priceINR: 7500, availability: "available" },
          { tierId: "gold", name: "Fan Pit Gold", priceINR: 13500, availability: "available" },
          { tierId: "vip", name: "Dream VIP Table", priceINR: 26000, availability: "available" },
        ],
      },
    ],
  },
];

// Curated round-trip flight quotes between cities
export const FLIGHT_QUOTES: Record<string, FlightQuote> = {
  "BOM-DEL": { origin: "BOM", destination: "DEL", roundTripFareINR: 7600, airline: "IndiGo", durationMinutes: 135, stops: 0, source: "estimated_baseline" },
  "DEL-BOM": { origin: "DEL", destination: "BOM", roundTripFareINR: 7600, airline: "Air India", durationMinutes: 140, stops: 0, source: "estimated_baseline" },

  "BOM-IDR": { origin: "BOM", destination: "IDR", roundTripFareINR: 5900, airline: "IndiGo", durationMinutes: 85, stops: 0, source: "estimated_baseline" },
  "IDR-BOM": { origin: "IDR", destination: "BOM", roundTripFareINR: 5900, airline: "IndiGo", durationMinutes: 85, stops: 0, source: "estimated_baseline" },

  "BOM-BLR": { origin: "BOM", destination: "BLR", roundTripFareINR: 6200, airline: "Akasa Air", durationMinutes: 105, stops: 0, source: "estimated_baseline" },
  "BLR-BOM": { origin: "BLR", destination: "BOM", roundTripFareINR: 6200, airline: "Akasa Air", durationMinutes: 110, stops: 0, source: "estimated_baseline" },

  "BOM-IXC": { origin: "BOM", destination: "IXC", roundTripFareINR: 8800, airline: "IndiGo", durationMinutes: 145, stops: 0, source: "estimated_baseline" },
  "IXC-BOM": { origin: "IXC", destination: "BOM", roundTripFareINR: 8800, airline: "IndiGo", durationMinutes: 145, stops: 0, source: "estimated_baseline" },

  "DEL-BLR": { origin: "DEL", destination: "BLR", roundTripFareINR: 8900, airline: "Vistara / AI", durationMinutes: 170, stops: 0, source: "estimated_baseline" },
  "BLR-DEL": { origin: "BLR", destination: "DEL", roundTripFareINR: 8900, airline: "IndiGo", durationMinutes: 175, stops: 0, source: "estimated_baseline" },

  "DEL-IDR": { origin: "DEL", destination: "IDR", roundTripFareINR: 5600, airline: "IndiGo", durationMinutes: 90, stops: 0, source: "estimated_baseline" },
  "IDR-DEL": { origin: "IDR", destination: "DEL", roundTripFareINR: 5600, airline: "IndiGo", durationMinutes: 90, stops: 0, source: "estimated_baseline" },

  "DEL-IXC": { origin: "DEL", destination: "IXC", roundTripFareINR: 5200, airline: "IndiGo", durationMinutes: 60, stops: 0, source: "estimated_baseline" },
  "IXC-DEL": { origin: "IXC", destination: "DEL", roundTripFareINR: 5200, airline: "IndiGo", durationMinutes: 60, stops: 0, source: "estimated_baseline" },

  "BLR-IDR": { origin: "BLR", destination: "IDR", roundTripFareINR: 7400, airline: "IndiGo", durationMinutes: 120, stops: 0, source: "estimated_baseline" },
  "IDR-BLR": { origin: "IDR", destination: "BLR", roundTripFareINR: 7400, airline: "IndiGo", durationMinutes: 120, stops: 0, source: "estimated_baseline" },

  "BLR-IXC": { origin: "BLR", destination: "IXC", roundTripFareINR: 9800, airline: "IndiGo", durationMinutes: 185, stops: 0, source: "estimated_baseline" },
  "IXC-BLR": { origin: "IXC", destination: "BLR", roundTripFareINR: 9800, airline: "IndiGo", durationMinutes: 185, stops: 0, source: "estimated_baseline" },

  "IDR-IXC": { origin: "IDR", destination: "IXC", roundTripFareINR: 8200, airline: "IndiGo (1-stop)", durationMinutes: 240, stops: 1, source: "estimated_baseline" },
  "IXC-IDR": { origin: "IXC", destination: "IDR", roundTripFareINR: 8200, airline: "IndiGo (1-stop)", durationMinutes: 240, stops: 1, source: "estimated_baseline" },
};

export const LODGING_RATES: Record<string, Record<StayPreference, LodgingQuote>> = {
  BOM: {
    budget: { cityCode: "BOM", baseRatePerNightINR: 2800, hotelTier: "budget", surgeMultiplier: 1.4 },
    comfort: { cityCode: "BOM", baseRatePerNightINR: 5200, hotelTier: "comfort", surgeMultiplier: 1.5 },
    luxury: { cityCode: "BOM", baseRatePerNightINR: 11000, hotelTier: "luxury", surgeMultiplier: 1.6 },
  },
  DEL: {
    budget: { cityCode: "DEL", baseRatePerNightINR: 2200, hotelTier: "budget", surgeMultiplier: 1.3 },
    comfort: { cityCode: "DEL", baseRatePerNightINR: 4200, hotelTier: "comfort", surgeMultiplier: 1.4 },
    luxury: { cityCode: "DEL", baseRatePerNightINR: 9500, hotelTier: "luxury", surgeMultiplier: 1.5 },
  },
  BLR: {
    budget: { cityCode: "BLR", baseRatePerNightINR: 2000, hotelTier: "budget", surgeMultiplier: 1.3 },
    comfort: { cityCode: "BLR", baseRatePerNightINR: 3800, hotelTier: "comfort", surgeMultiplier: 1.4 },
    luxury: { cityCode: "BLR", baseRatePerNightINR: 8500, hotelTier: "luxury", surgeMultiplier: 1.5 },
  },
  IDR: {
    budget: { cityCode: "IDR", baseRatePerNightINR: 1400, hotelTier: "budget", surgeMultiplier: 1.25 },
    comfort: { cityCode: "IDR", baseRatePerNightINR: 2600, hotelTier: "comfort", surgeMultiplier: 1.3 },
    luxury: { cityCode: "IDR", baseRatePerNightINR: 5800, hotelTier: "luxury", surgeMultiplier: 1.4 },
  },
  IXC: {
    budget: { cityCode: "IXC", baseRatePerNightINR: 1600, hotelTier: "budget", surgeMultiplier: 1.25 },
    comfort: { cityCode: "IXC", baseRatePerNightINR: 3000, hotelTier: "comfort", surgeMultiplier: 1.3 },
    luxury: { cityCode: "IXC", baseRatePerNightINR: 6500, hotelTier: "luxury", surgeMultiplier: 1.4 },
  },
};
