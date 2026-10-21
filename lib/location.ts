import { CityCode } from './types';

export interface SupportedCity {
  code: CityCode;
  name: string;
  aliases: string[];
  defaultLat: number;
  defaultLng: number;
}

/**
 * Primary Twin-Corridor hubs (Pune & Mumbai) sit first, followed by major Indian metros.
 */
export const SUPPORTED_INDIAN_CITIES: SupportedCity[] = [
  {
    code: 'PNQ',
    name: 'Pune',
    aliases: [
      'pune',
      'poona',
      'pimpri',
      'chinchwad',
      'koregaon park',
      'viman nagar',
      'baner',
      'balewadi',
      'wakad',
      'kothrud',
      'hadapsar',
      'kharadi',
      'hinjewadi',
      'magarpatta',
      'shivajinagar',
    ],
    defaultLat: 18.5204,
    defaultLng: 73.8567,
  },
  {
    code: 'BOM',
    name: 'Mumbai',
    aliases: [
      'mumbai',
      'bombay',
      'navi mumbai',
      'thane',
      'mahalaxmi',
      'worli',
      'bandra',
      'bkc',
      'andheri',
      'juhu',
      'lower parel',
      'goregaon',
      'powai',
      'kurla',
      'byculla',
      'nariman point',
      'dy patil',
    ],
    defaultLat: 19.076,
    defaultLng: 72.8777,
  },
  {
    code: 'BLR',
    name: 'Bengaluru',
    aliases: ['bengaluru', 'bangalore', 'whitefield', 'electronic city', 'koramangala', 'indiranagar'],
    defaultLat: 12.9716,
    defaultLng: 77.5946,
  },
  {
    code: 'DEL',
    name: 'Delhi NCR',
    aliases: ['delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'faridabad', 'ghaziabad'],
    defaultLat: 28.6139,
    defaultLng: 77.209,
  },
  {
    code: 'HYD',
    name: 'Hyderabad',
    aliases: ['hyderabad', 'secunderabad', 'cyberabad', 'gachibowli', 'hitec city'],
    defaultLat: 17.385,
    defaultLng: 78.4867,
  },
  {
    code: 'CCU',
    name: 'Kolkata',
    aliases: ['kolkata', 'calcutta', 'howrah', 'salt lake'],
    defaultLat: 22.5726,
    defaultLng: 88.3639,
  },
  {
    code: 'AMD',
    name: 'Ahmedabad',
    aliases: ['ahmedabad', 'gandhinagar'],
    defaultLat: 23.0225,
    defaultLng: 72.5714,
  },
];

/**
 * Safely flattens Schema.org PostalAddress objects or raw strings into searchable text.
 * Prevents `[object Object]` bugs when JSON-LD `location.address` is an object.
 */
export function extractAddressText(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const obj = address as Record<string, unknown>;
    return [
      obj.name,
      obj.streetAddress,
      obj.addressLocality,
      obj.addressRegion,
      obj.postalCode,
    ]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .join(', ');
  }
  return '';
}

/**
 * Resolve any raw city name or venue/address string to a standard CityCode.
 */
export function resolveCityCode(rawCity?: string | null, fallback: CityCode = 'PNQ'): CityCode {
  if (!rawCity) return fallback;

  const clean = rawCity.trim().toLowerCase();

  for (const city of SUPPORTED_INDIAN_CITIES) {
    if (city.code.toLowerCase() === clean) return city.code;
    if (city.name.toLowerCase() === clean) return city.code;
  }

  for (const city of SUPPORTED_INDIAN_CITIES) {
    if (city.aliases.some((alias) => clean.includes(alias))) return city.code;
  }

  return fallback;
}

/**
 * Get full SupportedCity metadata by CityCode.
 */
export function getSupportedCity(cityCode: string): SupportedCity {
  return (
    SUPPORTED_INDIAN_CITIES.find((c) => c.code.toUpperCase() === cityCode.toUpperCase()) ||
    SUPPORTED_INDIAN_CITIES[0]
  );
}

/**
 * Get human-readable city name by CityCode.
 */
export function getCityName(cityCode: string): string {
  const match = SUPPORTED_INDIAN_CITIES.find(
    (c) => c.code.toUpperCase() === cityCode.toUpperCase()
  );
  return match ? match.name : cityCode;
}
