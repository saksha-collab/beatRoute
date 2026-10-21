import * as cheerio from 'cheerio';
import {
  CatalogItem,
  CatalogItemType,
  TicketTier,
  TicketTierAvailability,
} from '../../lib/types';
import { computeActiveTierPricing } from '../../lib/deduplicate';
import { fetchHtmlWithFallback } from '../client';
import {
  extractAddressText,
  getSupportedCity,
  resolveCityCode,
} from '../../lib/location';

export interface BMSCityConfig {
  slug: string;
  cityCode: string;
  cityName: string;
  defaultLat: number;
  defaultLng: number;
}

/**
 * Focused Twin-Corridor MVP cities (Pune + Mumbai) for deep, high-accuracy scraping.
 */
export const TOP_BMS_CITIES: BMSCityConfig[] = [
  { slug: 'pune', cityCode: 'PNQ', cityName: 'Pune', defaultLat: 18.5204, defaultLng: 73.8567 },
  { slug: 'mumbai', cityCode: 'BOM', cityName: 'Mumbai', defaultLat: 19.076, defaultLng: 72.8777 },
];

export const ALL_BMS_CITIES: BMSCityConfig[] = [
  ...TOP_BMS_CITIES,
  { slug: 'bengaluru', cityCode: 'BLR', cityName: 'Bengaluru', defaultLat: 12.9716, defaultLng: 77.5946 },
  { slug: 'national-capital-region-ncr', cityCode: 'DEL', cityName: 'Delhi NCR', defaultLat: 28.6139, defaultLng: 77.209 },
  { slug: 'hyderabad', cityCode: 'HYD', cityName: 'Hyderabad', defaultLat: 17.385, defaultLng: 78.4867 },
  { slug: 'kolkata', cityCode: 'CCU', cityName: 'Kolkata', defaultLat: 22.5726, defaultLng: 88.3639 },
  { slug: 'ahmedabad', cityCode: 'AMD', cityName: 'Ahmedabad', defaultLat: 23.0225, defaultLng: 72.5714 },
];

interface DiscoveredBMSEvent {
  slug: string;
  code: string;
  url: string;
  defaultType: CatalogItemType;
  defaultCategory: string;
}

/**
 * Discover both Music Concerts AND Comedy/Live Events for a city on BookMyShow.
 */
export async function discoverEventsForCity(
  city: BMSCityConfig,
  limitPerVertical = 10
): Promise<DiscoveredBMSEvent[]> {
  const verticals: { path: string; type: CatalogItemType; category: string }[] = [
    { path: `music-shows-${city.slug}`, type: 'concert', category: 'Concert' },
    { path: `comedy-shows-${city.slug}`, type: 'event', category: 'Stand-up Comedy' },
    { path: `events-${city.slug}`, type: 'event', category: 'Live Event' },
  ];

  const discovered: DiscoveredBMSEvent[] = [];
  const seenCodes = new Set<string>();

  for (const vertical of verticals) {
    const exploreUrl = `https://in.bookmyshow.com/explore/${vertical.path}`;
    console.log(`[BMS] Discovering ${vertical.category} in ${city.cityName} (${exploreUrl})...`);

    try {
      const html = await fetchHtmlWithFallback(exploreUrl);
      const $ = cheerio.load(html);
      let countForVertical = 0;

      $('a[href*="/events/"]').each((_, el) => {
        if (countForVertical >= limitPerVertical) return;
        const href = $(el).attr('href');
        if (!href) return;

        const match = href.match(/\/events\/([^\/?#]+)\/(ET[0-9A-Za-z]+)/);
        if (match) {
          const slug = match[1];
          const code = match[2].toUpperCase();
          if (!seenCodes.has(code)) {
            seenCodes.add(code);
            countForVertical++;
            discovered.push({
              slug,
              code,
              url: `https://in.bookmyshow.com/events/${slug}/${code}`,
              defaultType: vertical.type,
              defaultCategory: vertical.category,
            });
          }
        }
      });
    } catch (err: any) {
      console.warn(`[BMS] Failed to discover ${vertical.path} for ${city.cityName}:`, err.message);
    }
  }

  console.log(`[BMS] Discovered ${discovered.length} unique live events/concerts in ${city.cityName}.`);
  return discovered;
}

/**
 * Scrape an individual BMS event page, resolve its true venue city, and compute
 * the lowest ACTIVE available phase price (avoiding sold-out Early Bird bait-and-switch).
 */
export async function scrapeEventDetails(
  eventMeta: DiscoveredBMSEvent,
  city: BMSCityConfig
): Promise<CatalogItem | null> {
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
            (item['@type'].includes('Event') ||
              item['@type'] === 'MusicEvent' ||
              item['@type'] === 'SocialEvent' ||
              item['@type'] === 'ComedyEvent')
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

    const title = (eventSchema.name || eventMeta.slug.replace(/-/g, ' ')).trim();
    const description = (eventSchema.description || '').trim();
    const startDateRaw = eventSchema.startDate || '';
    const date = startDateRaw ? startDateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const time = eventSchema.doorTime ? `${eventSchema.doorTime} IST` : '19:00 IST';

    let imageUrl =
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';
    if (eventSchema.image) {
      if (Array.isArray(eventSchema.image) && eventSchema.image.length > 0) {
        imageUrl = eventSchema.image[0];
      } else if (typeof eventSchema.image === 'string') {
        imageUrl = eventSchema.image;
      }
    }

    const venueName = (eventSchema.location?.name || `${city.cityName} Venue`).trim();
    const addressText = extractAddressText(eventSchema.location?.address);

    // Resolve the actual venue city so a Mumbai festival promoted on a Pune page stays in BOM
    const resolvedCityCode = resolveCityCode(
      `${venueName} ${addressText} ${title}`,
      city.cityCode
    );
    const resolvedCityMeta = getSupportedCity(resolvedCityCode);

    const lat = Number(eventSchema.location?.geo?.latitude) || resolvedCityMeta.defaultLat;
    const lng = Number(eventSchema.location?.geo?.longitude) || resolvedCityMeta.defaultLng;

    const rawLowPrice = Number(eventSchema.offers?.lowPrice) || 499;
    const ticketTiers: TicketTier[] = [];

    if (Array.isArray(eventSchema.offers?.offers) && eventSchema.offers.offers.length > 0) {
      eventSchema.offers.offers.forEach((o: any, idx: number) => {
        const tierPrice = Number(o.price) || rawLowPrice;
        const tierName = o.name || `Phase ${idx + 1}`;
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
        priceINR: rawLowPrice,
        availability: 'available',
      });
    }

    // Calculate true active tier price (ignores sold-out Early Bird tiers)
    const tierPricing = computeActiveTierPricing(ticketTiers, rawLowPrice);
    const isCancelled =
      typeof eventSchema.eventStatus === 'string' &&
      eventSchema.eventStatus.includes('Cancelled');

    const isConcertType =
      eventMeta.defaultType === 'concert' ||
      eventSchema['@type'] === 'MusicEvent' ||
      /concert|music|festival|sunburn|anyma|dj|live in concert|symphony|gig|tour/i.test(
        `${title} ${description}`
      );

    const isComedy = /comedy|standup|stand-up|comic|open mic/i.test(`${title} ${description}`);

    return {
      id: `bms-${eventMeta.code.toLowerCase()}`,
      type: isConcertType ? 'concert' : 'event',
      source: 'bookmyshow',
      title,
      description: description || `${title} at ${venueName}`,
      category: isConcertType
        ? 'Concert'
        : isComedy
        ? 'Stand-up Comedy'
        : eventMeta.defaultCategory,
      posterUrl: imageUrl,
      cityCode: resolvedCityMeta.code,
      cityName: resolvedCityMeta.name,
      venue: venueName,
      coordinates: { lat, lng },
      date,
      time,
      startingPriceINR: tierPricing.activePriceINR,
      lowestListedPriceINR: tierPricing.lowestListedPriceINR,
      activePhaseName: tierPricing.activePhaseName,
      hasSoldOutEarlyPhases: tierPricing.hasSoldOutEarlyPhases,
      ticketStatus: isCancelled ? 'sold_out' : tierPricing.ticketStatus,
      bookingUrl: eventMeta.url,
      rawDetails: {
        ticketTiers,
        ticketStatus: isCancelled ? 'sold_out' : tierPricing.ticketStatus,
        addressText,
        lastVerifiedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error(`[BMS] Error parsing event details for ${eventMeta.slug}:`, err.message);
    return null;
  }
}

/**
 * Discover & Scrape Movies from BookMyShow for a given city.
 * Does NOT inject fake ₹250 prices—movies route into the Step 3 Fee & Card Calculator.
 */
export async function scrapeBMSMovies(
  city: BMSCityConfig,
  limit = 12
): Promise<CatalogItem[]> {
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
    console.log(`[BMS] Found ${movieUrls.size} movies in ${city.cityName}. Scraping top ${selectedUrls.length}...`);

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
        const code = codeMatch ? codeMatch[1].toLowerCase() : `mv-${Date.now()}`;
        const title = (
          movieSchema?.name ||
          url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ||
          'Movie'
        ).trim();

        const poster =
          movieSchema?.image ||
          m$('meta[property="og:image"]').attr('content') ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

        items.push({
          id: `bms-mv-${city.cityCode.toLowerCase()}-${code}`,
          type: 'movie',
          source: 'bookmyshow',
          title,
          description:
            movieSchema?.description ||
            `Compare BookMyShow, District & Multiplex checkout fees and card offers for ${title} in ${city.cityName}.`,
          category: 'Cinema',
          languages: movieSchema?.inLanguage
            ? Array.isArray(movieSchema.inLanguage)
              ? movieSchema.inLanguage
              : [movieSchema.inLanguage]
            : ['Hindi', 'English'],
          posterUrl: poster,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: `PVR INOX, Cinépolis & Local Cinemas (${city.cityName})`,
          coordinates: { lat: city.defaultLat, lng: city.defaultLng },
          date: movieSchema?.datePublished || new Date().toISOString().slice(0, 10),
          startingPriceINR: undefined, // Calculated dynamically via Movie Checkout Calculator
          bookingUrl: url,
          rating: movieSchema?.aggregateRating?.ratingValue
            ? `${movieSchema.aggregateRating.ratingValue}/10`
            : undefined,
          rawDetails: {
            duration: movieSchema?.duration,
            lastVerifiedAt: new Date().toISOString(),
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
 * Scrape unified BMS catalog (concerts, live events, and movies) for a city.
 */
export async function scrapeBMSCatalog(
  city: BMSCityConfig,
  limitPerCategory = 8
): Promise<CatalogItem[]> {
  const catalog: CatalogItem[] = [];

  // 1. Scrape Concerts & Live Events
  const discoveredEvents = await discoverEventsForCity(city, limitPerCategory);
  for (const ev of discoveredEvents) {
    const item = await scrapeEventDetails(ev, city);
    if (item) {
      catalog.push(item);
    }
  }

  // 2. Scrape Now-Showing Movies
  const movies = await scrapeBMSMovies(city, limitPerCategory);
  catalog.push(...movies);

  return catalog;
}
