import { ConcertEvent } from '../types';
import eventsJson from './events.json';

export const ALL_INDIAN_CONCERTS = eventsJson as ConcertEvent[];

/**
 * Filter concerts by city code (e.g. 'BOM', 'DEL', 'BLR', 'AMD').
 * Returns all if cityCode is 'ALL'.
 */
export function filterConcertsByCity(cityCode: string): ConcertEvent[] {
  if (!cityCode || cityCode === "ALL") {
    return ALL_INDIAN_CONCERTS;
  }
  return ALL_INDIAN_CONCERTS.filter(
    (c) => c.cityCode.toUpperCase() === cityCode.toUpperCase()
  );
}

/**
 * Search concerts by artist name, tour name, venue, or genre keyword.
 */
export function searchConcerts(query: string): ConcertEvent[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return ALL_INDIAN_CONCERTS;

  return ALL_INDIAN_CONCERTS.filter((c) => {
    return (
      c.artist.toLowerCase().includes(clean) ||
      c.tourName.toLowerCase().includes(clean) ||
      c.cityName.toLowerCase().includes(clean) ||
      c.venue.toLowerCase().includes(clean) ||
      c.genres.some((g) => g.toLowerCase().includes(clean))
    );
  });
}

/**
 * Get distinct cities hosting concerts with event counts for filter chips.
 */
export function getCityFilterOptions(): { code: string; name: string; count: number }[] {
  const cityCounts: Record<string, { name: string; count: number }> = {};

  for (const concert of ALL_INDIAN_CONCERTS) {
    if (!cityCounts[concert.cityCode]) {
      cityCounts[concert.cityCode] = { name: concert.cityName, count: 0 };
    }
    cityCounts[concert.cityCode].count++;
  }

  const list = Object.entries(cityCounts).map(([code, data]) => ({
    code,
    name: data.name,
    count: data.count,
  }));

  // Sort descending by concert count
  list.sort((a, b) => b.count - a.count);

  return [
    { code: "ALL", name: "All India", count: ALL_INDIAN_CONCERTS.length },
    ...list,
  ];
}
