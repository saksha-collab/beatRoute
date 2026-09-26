import { CityCode, RailRouteQuote } from "../types";

/**
 * Curated Deterministic Indian Railways Fare Matrix.
 * Distances, durations, and base one-way fares are mapped from official Indian Railways telescopic distance slabs.
 * The calculation engine multiplies by 2 to compute complete round-trip costs.
 */
export const RAIL_CORRIDORS: Record<string, RailRouteQuote> = {
  // Mumbai <-> Delhi
  "BOM-DEL": {
    origin: "BOM",
    destination: "DEL",
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani Express",
    trainType: "Rajdhani",
    distanceKm: 1384,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "3AC": { fareINR: 1750, durationMinutes: 955, departureTime: "17:00", arrivalTime: "08:55" },
      "2AC": { fareINR: 2490, durationMinutes: 955, departureTime: "17:00", arrivalTime: "08:55" },
    },
  },
  "DEL-BOM": {
    origin: "DEL",
    destination: "BOM",
    trainNumber: "12952",
    trainName: "New Delhi Mumbai Rajdhani",
    trainType: "Rajdhani",
    distanceKm: 1384,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "3AC": { fareINR: 1750, durationMinutes: 950, departureTime: "16:55", arrivalTime: "08:45" },
      "2AC": { fareINR: 2490, durationMinutes: 950, departureTime: "16:55", arrivalTime: "08:45" },
    },
  },

  // Mumbai <-> Indore
  "BOM-IDR": {
    origin: "BOM",
    destination: "IDR",
    trainNumber: "12961",
    trainName: "Avantika SF Express",
    trainType: "Superfast",
    distanceKm: 829,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 440, durationMinutes: 790, departureTime: "20:55", arrivalTime: "10:05" },
      "3AC": { fareINR: 1180, durationMinutes: 790, departureTime: "20:55", arrivalTime: "10:05" },
      "2AC": { fareINR: 1680, durationMinutes: 790, departureTime: "20:55", arrivalTime: "10:05" },
    },
  },
  "IDR-BOM": {
    origin: "IDR",
    destination: "BOM",
    trainNumber: "12962",
    trainName: "Avantika SF Express",
    trainType: "Superfast",
    distanceKm: 829,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 440, durationMinutes: 795, departureTime: "17:40", arrivalTime: "06:55" },
      "3AC": { fareINR: 1180, durationMinutes: 795, departureTime: "17:40", arrivalTime: "06:55" },
      "2AC": { fareINR: 1680, durationMinutes: 795, departureTime: "17:40", arrivalTime: "06:55" },
    },
  },

  // Delhi <-> Chandigarh
  "DEL-IXC": {
    origin: "DEL",
    destination: "IXC",
    trainNumber: "12005",
    trainName: "New Delhi - Kalka Shatabdi",
    trainType: "Shatabdi",
    distanceKm: 244,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "VANDE_BHARAT": { fareINR: 890, durationMinutes: 195, departureTime: "17:15", arrivalTime: "20:30" },
      "3AC": { fareINR: 520, durationMinutes: 240, departureTime: "07:40", arrivalTime: "11:40" },
      "2AC": { fareINR: 760, durationMinutes: 240, departureTime: "07:40", arrivalTime: "11:40" },
      "SL": { fareINR: 185, durationMinutes: 260, departureTime: "06:40", arrivalTime: "11:00" },
    },
  },
  "IXC-DEL": {
    origin: "IXC",
    destination: "DEL",
    trainNumber: "12006",
    trainName: "Kalka - New Delhi Shatabdi",
    trainType: "Shatabdi",
    distanceKm: 244,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "VANDE_BHARAT": { fareINR: 890, durationMinutes: 195, departureTime: "06:53", arrivalTime: "10:15" },
      "3AC": { fareINR: 520, durationMinutes: 240, departureTime: "17:25", arrivalTime: "21:25" },
      "2AC": { fareINR: 760, durationMinutes: 240, departureTime: "17:25", arrivalTime: "21:25" },
      "SL": { fareINR: 185, durationMinutes: 260, departureTime: "18:25", arrivalTime: "22:45" },
    },
  },

  // Delhi <-> Indore
  "DEL-IDR": {
    origin: "DEL",
    destination: "IDR",
    trainNumber: "12920",
    trainName: "Malwa SF Express",
    trainType: "Superfast",
    distanceKm: 843,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 450, durationMinutes: 820, departureTime: "20:30", arrivalTime: "10:10" },
      "3AC": { fareINR: 1190, durationMinutes: 820, departureTime: "20:30", arrivalTime: "10:10" },
      "2AC": { fareINR: 1710, durationMinutes: 820, departureTime: "20:30", arrivalTime: "10:10" },
    },
  },
  "IDR-DEL": {
    origin: "IDR",
    destination: "DEL",
    trainNumber: "12919",
    trainName: "Malwa SF Express",
    trainType: "Superfast",
    distanceKm: 843,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 450, durationMinutes: 830, departureTime: "12:15", arrivalTime: "02:05" },
      "3AC": { fareINR: 1190, durationMinutes: 830, departureTime: "12:15", arrivalTime: "02:05" },
      "2AC": { fareINR: 1710, durationMinutes: 830, departureTime: "12:15", arrivalTime: "02:05" },
    },
  },

  // Mumbai <-> Bengaluru
  "BOM-BLR": {
    origin: "BOM",
    destination: "BLR",
    trainNumber: "11301",
    trainName: "Udyan Express",
    trainType: "Express",
    distanceKm: 1136,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 540, durationMinutes: 1410, departureTime: "08:10", arrivalTime: "07:40" },
      "3AC": { fareINR: 1440, durationMinutes: 1410, departureTime: "08:10", arrivalTime: "07:40" },
      "2AC": { fareINR: 2090, durationMinutes: 1410, departureTime: "08:10", arrivalTime: "07:40" },
    },
  },
  "BLR-BOM": {
    origin: "BLR",
    destination: "BOM",
    trainNumber: "11302",
    trainName: "Udyan Express",
    trainType: "Express",
    distanceKm: 1136,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 540, durationMinutes: 1435, departureTime: "20:45", arrivalTime: "20:40" },
      "3AC": { fareINR: 1440, durationMinutes: 1435, departureTime: "20:45", arrivalTime: "20:40" },
      "2AC": { fareINR: 2090, durationMinutes: 1435, departureTime: "20:45", arrivalTime: "20:40" },
    },
  },

  // Delhi <-> Bengaluru
  "DEL-BLR": {
    origin: "DEL",
    destination: "BLR",
    trainNumber: "12628",
    trainName: "Karnataka Express",
    trainType: "Superfast",
    distanceKm: 2408,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 890, durationMinutes: 1965, departureTime: "20:20", arrivalTime: "05:05" },
      "3AC": { fareINR: 2360, durationMinutes: 1965, departureTime: "20:20", arrivalTime: "05:05" },
      "2AC": { fareINR: 3450, durationMinutes: 1965, departureTime: "20:20", arrivalTime: "05:05" },
    },
  },
  "BLR-DEL": {
    origin: "BLR",
    destination: "DEL",
    trainNumber: "12627",
    trainName: "Karnataka Express",
    trainType: "Superfast",
    distanceKm: 2408,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 890, durationMinutes: 1970, departureTime: "19:20", arrivalTime: "04:10" },
      "3AC": { fareINR: 2360, durationMinutes: 1970, departureTime: "19:20", arrivalTime: "04:10" },
      "2AC": { fareINR: 3450, durationMinutes: 1970, departureTime: "19:20", arrivalTime: "04:10" },
    },
  },

  // Bengaluru <-> Indore
  "BLR-IDR": {
    origin: "BLR",
    destination: "IDR",
    trainNumber: "19302",
    trainName: "Yesvantpur - Indore Weekly Express",
    trainType: "Express",
    distanceKm: 1845,
    frequency: "Weekly",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 710, durationMinutes: 1935, departureTime: "15:50", arrivalTime: "00:05" },
      "3AC": { fareINR: 1910, durationMinutes: 1935, departureTime: "15:50", arrivalTime: "00:05" },
      "2AC": { fareINR: 2790, durationMinutes: 1935, departureTime: "15:50", arrivalTime: "00:05" },
    },
  },
  "IDR-BLR": {
    origin: "IDR",
    destination: "BLR",
    trainNumber: "19301",
    trainName: "Indore - Yesvantpur Weekly Express",
    trainType: "Express",
    distanceKm: 1845,
    frequency: "Weekly",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 710, durationMinutes: 1935, departureTime: "23:00", arrivalTime: "07:15" },
      "3AC": { fareINR: 1910, durationMinutes: 1935, departureTime: "23:00", arrivalTime: "07:15" },
      "2AC": { fareINR: 2790, durationMinutes: 1935, departureTime: "23:00", arrivalTime: "07:15" },
    },
  },

  // Mumbai <-> Chandigarh
  "BOM-IXC": {
    origin: "BOM",
    destination: "IXC",
    trainNumber: "12925",
    trainName: "Paschim SF Express",
    trainType: "Superfast",
    distanceKm: 1618,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 670, durationMinutes: 1730, departureTime: "11:25", arrivalTime: "16:15" },
      "3AC": { fareINR: 1770, durationMinutes: 1730, departureTime: "11:25", arrivalTime: "16:15" },
      "2AC": { fareINR: 2560, durationMinutes: 1730, departureTime: "11:25", arrivalTime: "16:15" },
    },
  },
  "IXC-BOM": {
    origin: "IXC",
    destination: "BOM",
    trainNumber: "12926",
    trainName: "Paschim SF Express",
    trainType: "Superfast",
    distanceKm: 1618,
    frequency: "Daily",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 670, durationMinutes: 1740, departureTime: "12:20", arrivalTime: "17:20" },
      "3AC": { fareINR: 1770, durationMinutes: 1740, departureTime: "12:20", arrivalTime: "17:20" },
      "2AC": { fareINR: 2560, durationMinutes: 1740, departureTime: "12:20", arrivalTime: "17:20" },
    },
  },

  // Indore <-> Chandigarh
  "IDR-IXC": {
    origin: "IDR",
    destination: "IXC",
    trainNumber: "19307",
    trainName: "Indore - Chandigarh Express",
    trainType: "Express",
    distanceKm: 1120,
    frequency: "Bi-weekly",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 520, durationMinutes: 1350, departureTime: "05:30", arrivalTime: "04:00" },
      "3AC": { fareINR: 1410, durationMinutes: 1350, departureTime: "05:30", arrivalTime: "04:00" },
      "2AC": { fareINR: 2040, durationMinutes: 1350, departureTime: "05:30", arrivalTime: "04:00" },
    },
  },
  "IXC-IDR": {
    origin: "IXC",
    destination: "IDR",
    trainNumber: "19308",
    trainName: "Chandigarh - Indore Express",
    trainType: "Express",
    distanceKm: 1120,
    frequency: "Bi-weekly",
    source: "curated_baseline",
    classes: {
      "SL": { fareINR: 520, durationMinutes: 1350, departureTime: "16:30", arrivalTime: "15:00" },
      "3AC": { fareINR: 1410, durationMinutes: 1350, departureTime: "16:30", arrivalTime: "15:00" },
      "2AC": { fareINR: 2040, durationMinutes: 1350, departureTime: "16:30", arrivalTime: "15:00" },
    },
  },
};

/**
 * Retrieves deterministic rail route quote between any two cities.
 */
export function getRailQuote(origin: CityCode, destination: CityCode): RailRouteQuote | null {
  if (origin === destination) return null;
  const key = `${origin}-${destination}`;
  return RAIL_CORRIDORS[key] || null;
}
