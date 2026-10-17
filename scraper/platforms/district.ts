import * as cheerio from 'cheerio';
import { CatalogItem } from '../../lib/types';
import { fetchHtmlWithFallback } from '../client';
import { SUPPORTED_INDIAN_CITIES } from '../../lib/location';

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
 * Validates if an extracted item has legitimate, high-quality data.
 * Drops generic section names or malformed fallback strings.
 */
function isValidDistrictItem(title: string, posterUrl?: string): boolean {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim().toLowerCase();
  
  if (clean.length < 3) return false;
  if (clean === 'district' || clean === 'district by zomato') return false;
  if (clean === 'movies' || clean === 'cinema' || clean === 'events' || clean === 'comedy' || clean === 'music') return false;
  if (clean.startsWith('district event') || clean.includes('book navratri events') || clean.includes('venue guide')) return false;
  if (/[0-9]{10,}/.test(clean)) return false; // Rejects timestamped fallback IDs

  if (!posterUrl || posterUrl.includes('undefined')) return false;

  return true;
}

/**
 * Resolves city from address or venue text against known supported Indian hubs.
 */
function resolveCityFromLocationText(text?: string, defaultCity?: DistrictCityConfig): DistrictCityConfig {
  if (!text) return defaultCity || DISTRICT_CITIES[0];
  const lower = text.toLowerCase();

  for (const city of SUPPORTED_INDIAN_CITIES) {
    if (city.aliases.some((alias) => lower.includes(alias))) {
      return {
        slug: city.name.toLowerCase().replace(/\s+/g, '-'),
        cityCode: city.code,
        cityName: city.name,
        defaultLat: city.defaultLat,
        defaultLng: city.defaultLng,
      };
    }
  }

  return defaultCity || DISTRICT_CITIES[0];
}

/**
 * Scrapes live verified movies and events from District (by Zomato)
 */
export async function scrapeDistrictCatalog(city: DistrictCityConfig, limit = 10): Promise<CatalogItem[]> {
  console.log(`[District] Discovering verified movies & events for ${city.cityName}...`);
  const items: CatalogItem[] = [];

  try {
    const homeHtml = await fetchHtmlWithFallback('https://www.district.in');
    const $ = cheerio.load(homeHtml);

    // 1. Discover exact movie detail URLs (must end in -MV[0-9]+)
    const movieUrls = new Set<string>();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;
      if (/\/movies\/[a-zA-Z0-9_-]+-MV[0-9]+/i.test(fullUrl)) {
        movieUrls.add(fullUrl);
      }
    });

    const selectedMovieUrls = Array.from(movieUrls).slice(0, limit);
    console.log(`[District] Discovered ${movieUrls.size} movie links. Parsing ${selectedMovieUrls.length}...`);

    for (const url of selectedMovieUrls) {
      try {
        const movieHtml = await fetchHtmlWithFallback(url);
        const m$ = cheerio.load(movieHtml);

        // Deep extraction from Next.js __NEXT_DATA__
        let title = '';
        let description = '';
        let posterUrl = '';
        let languages: string[] = ['Hindi', 'English'];
        let duration: string | undefined;

        const nextData = m$('#__NEXT_DATA__').html();
        if (nextData) {
          try {
            const parsed = JSON.parse(nextData);
            const m = parsed.props?.pageProps?.data?.movieData?.meta?.movie;
            if (m) {
              title = m.name?.trim() || '';
              description = m.description || '';
              posterUrl = m.horizontal_poster || m.appImgPath || '';
              if (m.inLanguage) languages = [m.inLanguage];
              duration = m.duration_as_string;
            }
          } catch {}
        }

        // OpenGraph fallback
        if (!title) {
          const rawOgTitle = m$('meta[property="og:title"]').attr('content') || '';
          title = rawOgTitle.replace(/ \([0-9]{4}\).*|- Cast, Reviews.*$/i, '').trim();
          posterUrl = posterUrl || m$('meta[property="og:image"]').attr('content') || '';
          description = description || m$('meta[property="og:description"]').attr('content') || '';
        }

        // Validation gate
        if (!isValidDistrictItem(title, posterUrl)) {
          console.warn(`[District] Rejected invalid movie item: "${title}" (${url})`);
          continue;
        }

        const slugMatch = url.match(/\/movies\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1] : `movie-${Date.now()}`;

        items.push({
          id: `district-mv-${slug}`,
          type: 'movie',
          source: 'district',
          title,
          description: description || `Book movie tickets for ${title} on District by Zomato`,
          category: 'Cinema',
          languages,
          posterUrl,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: `${city.cityName} Theatres`,
          coordinates: { lat: city.defaultLat, lng: city.defaultLng },
          date: new Date().toISOString().slice(0, 10),
          startingPriceINR: 199,
          bookingUrl: url,
          rawDetails: {
            duration,
            censorRating: 'UA',
          },
        });
      } catch (err: any) {
        console.warn(`[District] Error parsing movie ${url}:`, err.message);
      }
    }

    // 2. Discover exact event detail URLs (must end in -buy-tickets)
    const eventUrls = new Set<string>();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;
      if (/\/events\/[a-zA-Z0-9_-]+-buy-tickets/i.test(fullUrl)) {
        eventUrls.add(fullUrl);
      }
    });

    const selectedEventUrls = Array.from(eventUrls).slice(0, limit);
    console.log(`[District] Discovered ${eventUrls.size} event links. Parsing ${selectedEventUrls.length}...`);

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
              if (item['@type'] === 'Event') {
                eventSchema = item;
                break;
              }
            }
          } catch {}
        });

        const title =
          eventSchema?.name?.trim() ||
          (e$('meta[property="og:title"]').attr('content') || '').replace(/- Buy Tickets.*$/i, '').trim();

        const posterUrl =
          eventSchema?.image ||
          e$('meta[property="og:image"]').attr('content') ||
          '';

        const description =
          eventSchema?.description ||
          e$('meta[property="og:description"]').attr('content') ||
          'Live event on District by Zomato';

        // Validation gate
        if (!isValidDistrictItem(title, posterUrl)) {
          console.warn(`[District] Rejected invalid event item: "${title}" (${url})`);
          continue;
        }

        const venueName = eventSchema?.location?.name || `${city.cityName} Arena`;
        const address = eventSchema?.location?.address || '';
        const eventCity = resolveCityFromLocationText(`${venueName} ${address}`, city);

        const lat = Number(eventSchema?.location?.geo?.latitude) || eventCity.defaultLat;
        const lng = Number(eventSchema?.location?.geo?.longitude) || eventCity.defaultLng;
        const startDate = eventSchema?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
        const price = Number(eventSchema?.offers?.lowPrice) || 499;

        const slugMatch = url.match(/\/events\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1].replace(/-buy-tickets.*/, '') : `event-${Date.now()}`;

        items.push({
          id: `district-ev-${slug}`,
          type: 'event',
          source: 'district',
          title,
          description,
          category: 'Live Event',
          posterUrl,
          cityCode: eventCity.cityCode,
          cityName: eventCity.cityName,
          venue: venueName,
          coordinates: { lat, lng },
          date: startDate,
          startingPriceINR: price,
          bookingUrl: url,
          rawDetails: {
            doorTime: eventSchema?.doorTime,
            locationAddress: address,
          },
        });
      } catch (err: any) {
        console.warn(`[District] Error parsing event ${url}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error(`[District] Discovery failed for ${city.cityName}:`, err.message);
  }

  return items;
}
