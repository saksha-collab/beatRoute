import { CityCode } from './types';

export interface SupportedCity {
  code: CityCode;
  name: string;
  aliases: string[];
  defaultLat: number;
  defaultLng: number;
}

export const SUPPORTED_INDIAN_CITIES: SupportedCity[] = [
  {
    code: 'BOM',
    name: 'Mumbai',
    aliases: ['mumbai', 'bombay', 'navi mumbai', 'thane'],
    defaultLat: 19.076,
    defaultLng: 72.8777,
  },
  {
    code: 'DEL',
    name: 'Delhi NCR',
    aliases: ['delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'faridabad', 'ghaziabad'],
    defaultLat: 28.6139,
    defaultLng: 77.209,
  },
  {
    code: 'BLR',
    name: 'Bengaluru',
    aliases: ['bengaluru', 'bangalore', 'whitefield', 'electronic city'],
    defaultLat: 12.9716,
    defaultLng: 77.5946,
  },
  {
    code: 'HYD',
    name: 'Hyderabad',
    aliases: ['hyderabad', 'secunderabad', 'cyberabad'],
    defaultLat: 17.385,
    defaultLng: 78.4867,
  },
  {
    code: 'CCU',
    name: 'Kolkata',
    aliases: ['kolkata', 'calcutta', 'howrah'],
    defaultLat: 22.5726,
    defaultLng: 88.3639,
  },
  {
    code: 'PNQ',
    name: 'Pune',
    aliases: ['pune', 'poona', 'pimpri'],
    defaultLat: 18.5204,
    defaultLng: 73.8567,
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
 * Resolve any raw city name (e.g. from Vercel x-vercel-ip-city header) to a standard CityCode.
 */
export function resolveCityCode(rawCity?: string | null): CityCode {
  if (!rawCity) return 'BOM';

  const clean = rawCity.trim().toLowerCase();

  for (const city of SUPPORTED_INDIAN_CITIES) {
    if (city.code.toLowerCase() === clean) return city.code;
    if (city.name.toLowerCase() === clean) return city.code;
    if (city.aliases.some((alias) => clean.includes(alias))) return city.code;
  }

  // Default fallback if not matched or international IP
  return 'BOM';
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
