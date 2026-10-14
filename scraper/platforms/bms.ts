import * as cheerio from 'cheerio';
import { ConcertEvent, TicketTier, TicketStatus, TicketTierAvailability } from '../../lib/types';

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

function buildScraperApiUrl(targetUrl: string, apiKey: string): string {
  return `https://api.scraperapi.com?api_key=${apiKey}&country_code=in&url=${encodeURIComponent(targetUrl)}`;
}

/**
 * Fetch HTML using Node.js native fetch with timeout
 */
async function fetchHtml(targetUrl: string, apiKey: string): Promise<string> {
  const url = buildScraperApiUrl(targetUrl, apiKey);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.text();
}

/**
 * Discover music event codes from a city's music explore page.
 */
export async function discoverEventsForCity(
  city: BMSCityConfig,
  apiKey: string,
  limit = 2
): Promise<{ slug: string; code: string; url: string }[]> {
  const exploreUrl = `https://in.bookmyshow.com/explore/music-shows-${city.slug}`;
  console.log(`[BMS] Discovering events in ${city.cityName} (${exploreUrl})...`);

  try {
    const html = await fetchHtml(exploreUrl, apiKey);
    const $ = cheerio.load(html);
    const discovered: { slug: string; code: string; url: string }[] = [];
    const seenCodes = new Set<string>();

    $('a[href*="/events/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      // Matches /events/event-slug/ET00123456
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
 * Scrape individual event page and parse Schema.org JSON-LD structured data.
 */
export async function scrapeEventDetails(
  eventMeta: { slug: string; code: string; url: string },
  city: BMSCityConfig,
  apiKey: string
): Promise<ConcertEvent | null> {
  try {
    console.log(`[BMS] Scraping details for ${eventMeta.slug} (${eventMeta.code})...`);
    const html = await fetchHtml(eventMeta.url, apiKey);
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
      } catch {
        // ignore json parse errors
      }
    });

    if (!eventSchema) {
      console.warn(`[BMS] No Event schema found in JSON-LD for ${eventMeta.slug}`);
      return null;
    }

    // Extract fields
    const name = eventSchema.name || eventMeta.slug.replace(/-/g, ' ');
    const description = eventSchema.description || '';
    const startDateRaw = eventSchema.startDate || '';
    const date = startDateRaw ? startDateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const time = eventSchema.doorTime ? `${eventSchema.doorTime} IST` : '19:00 IST';

    // Image handling
    let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';
    if (eventSchema.image) {
      if (Array.isArray(eventSchema.image) && eventSchema.image.length > 0) {
        imageUrl = eventSchema.image[0];
      } else if (typeof eventSchema.image === 'string') {
        imageUrl = eventSchema.image;
      }
    }

    // Venue & Coordinates
    const venueName = eventSchema.location?.name || `${city.cityName} Venue`;
    const lat = Number(eventSchema.location?.geo?.latitude) || city.defaultLat;
    const lng = Number(eventSchema.location?.geo?.longitude) || city.defaultLng;

    // Pricing & Tiers
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

    const concertEvent: ConcertEvent = {
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
      highlights: [
        'Live performance discovered from BookMyShow',
        `Venue: ${venueName}`,
      ],
    };

    return concertEvent;
  } catch (err: any) {
    console.error(`[BMS] Error parsing event details for ${eventMeta.slug}:`, err.message);
    return null;
  }
}
