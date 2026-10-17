import * as cheerio from 'cheerio';
import { CatalogItem, ConcertEvent, TicketTier, TicketStatus, TicketTierAvailability } from '../../lib/types';
import { fetchHtmlWithFallback } from '../client';

export interface BMSCityConfig {
  slug: string;
  cityCode: string;
  cityName: string;
  defaultLat: number;
  defaultLng: number;
}

export const TOP_BMS_CITIES: BMSCityConfig[] = [
  { slug: 'mumbai', cityCode: 'BOM', cityName: 'Mumbai', defaultLat: 19.076, defaultLng: 72.8777 },
  { slug: 'national-capital-region-ncr', cityCode: 'DEL', cityName: 'Delhi NCR', defaultLat: 28.6139, defaultLng: 77.209 },
  { slug: 'bengaluru', cityCode: 'BLR', cityName: 'Bengaluru', defaultLat: 12.9716, defaultLng: 77.5946 },
  { slug: 'hyderabad', cityCode: 'HYD', cityName: 'Hyderabad', defaultLat: 17.385, defaultLng: 78.4867 },
  { slug: 'kolkata', cityCode: 'CCU', cityName: 'Kolkata', defaultLat: 22.5726, defaultLng: 88.3639 },
];

/**
 * Discover music event codes from a city's music explore page.
 */
export async function discoverEventsForCity(
  city: BMSCityConfig,
  limit = 3
): Promise<{ slug: string; code: string; url: string }[]> {
  const exploreUrl = `https://in.bookmyshow.com/explore/music-shows-${city.slug}`;
  console.log(`[BMS] Discovering events in ${city.cityName} (${exploreUrl})...`);

  try {
    const html = await fetchHtmlWithFallback(exploreUrl);
    const $ = cheerio.load(html);
    const discovered: { slug: string; code: string; url: string }[] = [];
    const seenCodes = new Set<string>();

    $('a[href*="/events/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const match = href.match(/\/events\/([^\/?#]+)\/(ET[0-9A-Za-z]+)/);
      if (match) {
        const slug = match[1];
        const code = match[2];
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          discovered.push({
            slug,
            code,
            url: `https://in.bookmyshow.com/events/${slug}/${code}`,
          });
        }
      }
    });

    console.log(`[BMS] Found ${discovered.length} total event links in ${city.cityName}. Picking top ${limit}.`);
    return discovered.slice(0, limit);
  } catch (err: any) {
    console.error(`[BMS] Failed to discover events for ${city.cityName}:`, err.message);
    return [];
  }
}

/**
 * Scrape individual BMS event page and parse Schema.org JSON-LD structured data.
 */
export async function scrapeEventDetails(
  eventMeta: { slug: string; code: string; url: string },
  city: BMSCityConfig
): Promise<ConcertEvent | null> {
  try {
    console.log(`[BMS] Scraping details for ${eventMeta.slug} (${eventMeta.code})...`);
    const html = await fetchHtmlWithFallback(eventMeta.url);
    const $ = cheerio.load(html);

    let eventSchema: any = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html();
        if (!text) return;
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (
            item['@type'] &&
            (item['@type'].includes('Event') || item['@type'] === 'MusicEvent' || item['@type'] === 'SocialEvent')
          ) {
            eventSchema = item;
            break;
          }
        }
      } catch {}
    });

    if (!eventSchema) {
      console.warn(`[BMS] No Event schema found in JSON-LD for ${eventMeta.slug}`);
      return null;
    }

    const name = eventSchema.name || eventMeta.slug.replace(/-/g, ' ');
    const description = eventSchema.description || '';
    const startDateRaw = eventSchema.startDate || '';
    const date = startDateRaw ? startDateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const time = eventSchema.doorTime ? `${eventSchema.doorTime} IST` : '19:00 IST';

    let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';
    if (eventSchema.image) {
      if (Array.isArray(eventSchema.image) && eventSchema.image.length > 0) {
        imageUrl = eventSchema.image[0];
      } else if (typeof eventSchema.image === 'string') {
        imageUrl = eventSchema.image;
      }
    }

    const venueName = eventSchema.location?.name || `${city.cityName} Venue`;
    const lat = Number(eventSchema.location?.geo?.latitude) || city.defaultLat;
    const lng = Number(eventSchema.location?.geo?.longitude) || city.defaultLng;

    const startingPrice = Number(eventSchema.offers?.lowPrice) || 499;
    const ticketTiers: TicketTier[] = [];

    if (Array.isArray(eventSchema.offers?.offers) && eventSchema.offers.offers.length > 0) {
      eventSchema.offers.offers.forEach((o: any, idx: number) => {
        const tierPrice = Number(o.price) || startingPrice;
        const tierName = o.name || `Tier ${idx + 1}`;
        const avail: TicketTierAvailability =
          o.availability && o.availability.includes('InStock') ? 'available' : 'sold_out';

        ticketTiers.push({
          tierId: `tier-${idx + 1}`,
          name: tierName,
          priceINR: tierPrice,
          availability: avail,
        });
      });
    } else {
      ticketTiers.push({
        tierId: 'tier-ga',
        name: 'General Admission',
        priceINR: startingPrice,
        availability: 'available',
      });
    }

    const ticketStatus: TicketStatus =
      eventSchema.eventStatus && eventSchema.eventStatus.includes('Cancelled')
        ? 'sold_out'
        : 'available';

    return {
      id: `bms-${eventMeta.code.toLowerCase()}`,
      artist: name,
      tourName: name,
      artistImageUrl: imageUrl,
      date,
      time,
      cityCode: city.cityCode,
      cityName: city.cityName,
      venue: venueName,
      coordinates: { lat, lng },
      genres: ['Live Music', 'BookMyShow Live'],
      startingPriceINR: startingPrice,
      ticketTiers,
      ticketStatus,
      bookingUrl: eventMeta.url,
      source: 'bookmyshow',
      highlights: ['Live performance discovered from BookMyShow', `Venue: ${venueName}`],
    };
  } catch (err: any) {
    console.error(`[BMS] Error parsing event details for ${eventMeta.slug}:`, err.message);
    return null;
  }
}

/**
 * Discover & Scrape Movies from BookMyShow for a given city
 */
export async function scrapeBMSMovies(city: BMSCityConfig, limit = 5): Promise<CatalogItem[]> {
  const exploreUrl = `https://in.bookmyshow.com/explore/movies-${city.slug}`;
  console.log(`[BMS] Discovering movies in ${city.cityName} (${exploreUrl})...`);
  const items: CatalogItem[] = [];

  try {
    const html = await fetchHtmlWithFallback(exploreUrl);
    const $ = cheerio.load(html);
    const movieUrls = new Set<string>();

    $('a[href*="/movies/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('ET')) {
        const fullUrl = href.startsWith('http') ? href : `https://in.bookmyshow.com${href}`;
        movieUrls.add(fullUrl);
      }
    });

    const selectedUrls = Array.from(movieUrls).slice(0, limit);
    console.log(`[BMS] Found ${movieUrls.size} movies. Scraping details for ${selectedUrls.length}...`);

    for (const url of selectedUrls) {
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

        const codeMatch = url.match(/(ET[0-9A-Za-z]+)/);
        const code = codeMatch ? codeMatch[1].toLowerCase() : `bms-mv-${Date.now()}`;
        const title = movieSchema?.name || url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Movie';
        const poster =
          movieSchema?.image ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

        items.push({
          id: `bms-mv-${code}`,
          type: 'movie',
          source: 'bookmyshow',
          title,
          description: movieSchema?.description || `Book movie tickets for ${title} on BookMyShow in ${city.cityName}`,
          category: 'Cinema',
          languages: movieSchema?.inLanguage ? [movieSchema.inLanguage] : ['Hindi', 'English'],
          posterUrl: poster,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: `${city.cityName} Cinemas`,
          coordinates: { lat: city.defaultLat, lng: city.defaultLng },
          date: movieSchema?.datePublished || new Date().toISOString().slice(0, 10),
          startingPriceINR: 250,
          bookingUrl: url,
          rating: movieSchema?.aggregateRating?.ratingValue
            ? `${movieSchema.aggregateRating.ratingValue}/10`
            : undefined,
          rawDetails: {
            duration: movieSchema?.duration,
          },
        });
      } catch (err: any) {
        console.warn(`[BMS] Error scraping movie ${url}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error(`[BMS] Movies discovery failed for ${city.cityName}:`, err.message);
  }

  return items;
}

/**
 * Scrape unified BMS catalog (both events and movies) for a city.
 */
export async function scrapeBMSCatalog(city: BMSCityConfig, limit = 3): Promise<CatalogItem[]> {
  const catalog: CatalogItem[] = [];

  // 1. Scrape Events
  const events = await discoverEventsForCity(city, limit);
  for (const ev of events) {
    const details = await scrapeEventDetails(ev, city);
    if (details) {
      catalog.push({
        id: details.id,
        type: 'event',
        source: 'bookmyshow',
        title: details.artist,
        description: details.highlights ? details.highlights.join(' • ') : undefined,
        category: details.genres[0] || 'Concert',
        posterUrl: details.artistImageUrl,
        cityCode: details.cityCode,
        cityName: details.cityName,
        venue: details.venue,
        coordinates: details.coordinates,
        date: details.date,
        time: details.time,
        startingPriceINR: details.startingPriceINR,
        bookingUrl: details.bookingUrl,
        rawDetails: {
          ticketTiers: details.ticketTiers,
          ticketStatus: details.ticketStatus,
        },
      });
    }
  }

  // 2. Scrape Movies
  const movies = await scrapeBMSMovies(city, limit);
  catalog.push(...movies);

  return catalog;
}
