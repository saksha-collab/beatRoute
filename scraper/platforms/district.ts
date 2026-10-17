import * as cheerio from 'cheerio';
import { CatalogItem } from '../../lib/types';
import { fetchHtmlWithFallback } from '../client';

export interface DistrictCityConfig {
  slug: string;
  cityCode: string;
  cityName: string;
  defaultLat: number;
  defaultLng: number;
}

export const DISTRICT_CITIES: DistrictCityConfig[] = [
  { slug: 'mumbai', cityCode: 'BOM', cityName: 'Mumbai', defaultLat: 19.076, defaultLng: 72.8777 },
  { slug: 'delhi', cityCode: 'DEL', cityName: 'Delhi NCR', defaultLat: 28.6139, defaultLng: 77.209 },
  { slug: 'bengaluru', cityCode: 'BLR', cityName: 'Bengaluru', defaultLat: 12.9716, defaultLng: 77.5946 },
  { slug: 'hyderabad', cityCode: 'HYD', cityName: 'Hyderabad', defaultLat: 17.385, defaultLng: 78.4867 },
  { slug: 'pune', cityCode: 'PNQ', cityName: 'Pune', defaultLat: 18.5204, defaultLng: 73.8567 },
  { slug: 'kolkata', cityCode: 'CCU', cityName: 'Kolkata', defaultLat: 22.5726, defaultLng: 88.3639 },
  { slug: 'ahmedabad', cityCode: 'AMD', cityName: 'Ahmedabad', defaultLat: 23.0225, defaultLng: 72.5714 },
];

/**
 * Scrapes live movies and events from District (by Zomato)
 */
export async function scrapeDistrictCatalog(city: DistrictCityConfig, limit = 5): Promise<CatalogItem[]> {
  console.log(`[District] Discovering movies & events for ${city.cityName}...`);
  const items: CatalogItem[] = [];

  try {
    const homeHtml = await fetchHtmlWithFallback('https://www.district.in');
    const $ = cheerio.load(homeHtml);

    // 1. Extract Movie links from District
    const movieUrls = new Set<string>();
    $('a[href*="/movies/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;
        movieUrls.add(fullUrl);
      }
    });

    // Also match in inline script regex
    const rawMatches = homeHtml.match(/https:\/\/www\.district\.in\/movies\/[a-zA-Z0-9_-]+/g) || [];
    rawMatches.forEach((u) => movieUrls.add(u));

    const selectedMovieUrls = Array.from(movieUrls).slice(0, limit);
    console.log(`[District] Found ${movieUrls.size} movies. Scraping details for ${selectedMovieUrls.length}...`);

    for (const url of selectedMovieUrls) {
      try {
        const movieHtml = await fetchHtmlWithFallback(url);
        const m$ = cheerio.load(movieHtml);

        let movieSchema: any = null;
        m$('script[type="application/ld+json"]').each((_, el) => {
          try {
            const parsed = JSON.parse(m$(el).html() || '{}');
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of arr) {
              if (item['@type'] === 'Movie' || item['name']) {
                movieSchema = item;
                break;
              }
            }
          } catch {}
        });

        const slugMatch = url.match(/\/movies\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1] : `district-movie-${Date.now()}`;
        const title = movieSchema?.name || slug.replace(/-movie-tickets.*|-/g, ' ').trim();
        const poster =
          movieSchema?.image ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
        const rating = movieSchema?.aggregateRating?.ratingValue
          ? `${movieSchema.aggregateRating.ratingValue}/10`
          : undefined;

        items.push({
          id: `district-mv-${slug.slice(-10)}`,
          type: 'movie',
          source: 'district',
          title,
          description: movieSchema?.description || `Book movie tickets for ${title} on District by Zomato`,
          category: 'Cinema',
          languages: movieSchema?.inLanguage ? [movieSchema.inLanguage] : ['Hindi', 'English'],
          posterUrl: poster,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: `${city.cityName} Theatres`,
          coordinates: { lat: city.defaultLat, lng: city.defaultLng },
          date: movieSchema?.datePublished || new Date().toISOString().slice(0, 10),
          startingPriceINR: 199,
          bookingUrl: url,
          rating,
          rawDetails: {
            duration: movieSchema?.duration,
            censorRating: 'UA',
          },
        });
      } catch (err: any) {
        console.warn(`[District] Failed to scrape movie ${url}:`, err.message);
      }
    }

    // 2. Extract Event links from District
    const eventUrls = new Set<string>();
    $('a[href*="/events/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;
        eventUrls.add(fullUrl);
      }
    });

    const rawEventMatches = homeHtml.match(/https:\/\/www\.district\.in\/events\/[a-zA-Z0-9_-]+/g) || [];
    rawEventMatches.forEach((u) => eventUrls.add(u));

    const selectedEventUrls = Array.from(eventUrls).slice(0, limit);
    console.log(`[District] Found ${eventUrls.size} events. Scraping details for ${selectedEventUrls.length}...`);

    for (const url of selectedEventUrls) {
      try {
        const eventHtml = await fetchHtmlWithFallback(url);
        const e$ = cheerio.load(eventHtml);

        let eventSchema: any = null;
        e$('script[type="application/ld+json"]').each((_, el) => {
          try {
            const parsed = JSON.parse(e$(el).html() || '{}');
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of arr) {
              if (item['@type'] === 'Event' || (item['@type'] && item['@type'].includes('Event'))) {
                eventSchema = item;
                break;
              }
            }
          } catch {}
        });

        const slugMatch = url.match(/\/events\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1] : `district-event-${Date.now()}`;
        const title = eventSchema?.name || slug.replace(/-buy-tickets.*|-/g, ' ').trim();
        const poster =
          eventSchema?.image ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';
        const venueName = eventSchema?.location?.name || `${city.cityName} Arena`;
        const lat = Number(eventSchema?.location?.geo?.latitude) || city.defaultLat;
        const lng = Number(eventSchema?.location?.geo?.longitude) || city.defaultLng;

        items.push({
          id: `district-ev-${slug.slice(-12)}`,
          type: 'event',
          source: 'district',
          title,
          description: eventSchema?.description || `Live event booking on District by Zomato`,
          category: 'Live Event',
          posterUrl: poster,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: venueName,
          coordinates: { lat, lng },
          date: eventSchema?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          startingPriceINR: Number(eventSchema?.offers?.lowPrice) || 499,
          bookingUrl: url,
          rawDetails: {
            doorTime: eventSchema?.doorTime,
            locationAddress: eventSchema?.location?.address,
          },
        });
      } catch (err: any) {
        console.warn(`[District] Failed to scrape event ${url}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error(`[District] Discovery failed for ${city.cityName}:`, err.message);
  }

  return items;
}
