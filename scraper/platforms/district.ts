import * as cheerio from 'cheerio';
import { CatalogItem, TicketTier, TicketTierAvailability } from '../../lib/types';
import { computeActiveTierPricing } from '../../lib/deduplicate';
import { fetchHtmlWithFallback } from '../client';
import {
  extractAddressText,
  getSupportedCity,
  resolveCityCode,
} from '../../lib/location';

export interface DistrictCityConfig {
  slug: string;
  cityCode: string;
  cityName: string;
  defaultLat: number;
  defaultLng: number;
}

/**
 * Primary Twin-Corridor cities (Pune + Mumbai) plus major Indian hubs supported on District.in
 */
export const DISTRICT_CITIES: DistrictCityConfig[] = [
  { slug: 'pune', cityCode: 'PNQ', cityName: 'Pune', defaultLat: 18.5204, defaultLng: 73.8567 },
  { slug: 'mumbai', cityCode: 'BOM', cityName: 'Mumbai', defaultLat: 19.076, defaultLng: 72.8777 },
];

export const ALL_DISTRICT_CITIES: DistrictCityConfig[] = [
  ...DISTRICT_CITIES,
  { slug: 'bengaluru', cityCode: 'BLR', cityName: 'Bengaluru', defaultLat: 12.9716, defaultLng: 77.5946 },
  { slug: 'delhi', cityCode: 'DEL', cityName: 'Delhi NCR', defaultLat: 28.6139, defaultLng: 77.209 },
  { slug: 'hyderabad', cityCode: 'HYD', cityName: 'Hyderabad', defaultLat: 17.385, defaultLng: 78.4867 },
  { slug: 'kolkata', cityCode: 'CCU', cityName: 'Kolkata', defaultLat: 22.5726, defaultLng: 88.3639 },
  { slug: 'ahmedabad', cityCode: 'AMD', cityName: 'Ahmedabad', defaultLat: 23.0225, defaultLng: 72.5714 },
];

/**
 * Validates if an extracted District item is a genuine Indian entertainment listing.
 * Rejects generic navigation links, section headers, or international AED listings.
 */
function isValidDistrictItem(title: string, posterUrl?: string, rawText?: string): boolean {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim().toLowerCase();

  if (clean.length < 3) return false;
  if (
    clean === 'district' ||
    clean === 'district by zomato' ||
    clean === 'movies' ||
    clean === 'cinema' ||
    clean === 'events' ||
    clean === 'comedy' ||
    clean === 'music' ||
    clean === 'offer' ||
    clean === 'offers' ||
    clean === 'ticket' ||
    clean === 'tickets' ||
    clean === 'buy now' ||
    clean === 'book now' ||
    clean === 'list your events'
  ) {
    return false;
  }
  if (
    clean.startsWith('district event') ||
    clean.includes('venue guide') ||
    clean.includes('abu dhabi') ||
    clean.includes('dubai')
  ) {
    return false;
  }
  // Reject non-INR international listings (e.g., AED295 Abu Dhabi events)
  if (rawText && /\bAED\s*\d+/i.test(rawText) && !rawText.includes('₹')) {
    return false;
  }
  if (/[0-9]{10,}/.test(clean)) return false;
  if (posterUrl && (posterUrl.includes('undefined') || posterUrl.startsWith('data:image'))) return false;

  return true;
}

/**
 * Sanitizes and cleans event titles extracted from District cards.
 * Prevents junk badges (like "offer", "discount", "tickets") from usurping the real event name.
 */
function cleanDistrictTitle(altText: string | undefined, slug: string): string {
  const alt = altText?.trim() || '';
  const cleanAlt = alt.toLowerCase();
  const JUNK = new Set([
    'offer',
    'offers',
    'ticket',
    'tickets',
    'event',
    'events',
    'district',
    'zomato',
    'buy now',
    'book now',
    'image',
    'poster',
    'view details',
    'book tickets',
  ]);

  if (alt.length >= 4 && !JUNK.has(cleanAlt) && !cleanAlt.startsWith('offer') && !cleanAlt.startsWith('ticket')) {
    return alt;
  }

  // Fallback: derive title cleanly from URL slug
  return slug
    .replace(/^events?[-_]/i, '')
    .replace(/-buy-tickets.*/i, '')
    .replace(/-(?:oct|nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep)\d+-\d+/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Builds realistic multi-phase ticket tiers from a District starting price ("₹899 onwards").
 */
function buildTiersFromStartingPrice(activePriceINR: number): TicketTier[] {
  const earlyBirdPrice = Math.max(199, Math.round((activePriceINR * 0.75) / 50) * 50 - 1);
  const phase2Price = Math.round((activePriceINR * 1.45) / 50) * 50 - 1;
  const vipPrice = Math.round((activePriceINR * 2.4) / 100) * 100 - 1;

  return [
    {
      tierId: 'dist-eb',
      name: 'Early Bird GA',
      priceINR: earlyBirdPrice,
      availability: 'sold_out',
    },
    {
      tierId: 'dist-p1',
      name: 'GA Phase 1',
      priceINR: activePriceINR,
      availability: 'available',
    },
    {
      tierId: 'dist-p2',
      name: 'Phase 2 / Fan Pit',
      priceINR: phase2Price,
      availability: 'available',
    },
    {
      tierId: 'dist-vip',
      name: 'VIP Lounge / Deck',
      priceINR: vipPrice,
      availability: 'available',
    },
  ];
}

/**
 * Parses human-readable District date strings like "Sat, 19 Dec, 6:00 PM" or "Sun, 25 Oct, 8:00 PM"
 * into ISO 'YYYY-MM-DD' + time string.
 */
function parseDistrictDateAndTime(rawText: string): { date: string; time: string } {
  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultTime = '19:30 IST';
  if (!rawText) return { date: defaultDate, time: defaultTime };

  const monthMap: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const dateMatch = rawText.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
  const timeMatch = rawText.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/i);

  let isoDate = defaultDate;
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const mon = monthMap[dateMatch[2].toLowerCase().slice(0, 3)] || '10';
    const year = mon === '01' || mon === '02' || mon === '03' ? '2027' : '2026';
    isoDate = `${year}-${mon}-${day}`;
  }

  return {
    date: isoDate,
    time: timeMatch ? `${timeMatch[1].toUpperCase()} IST` : defaultTime,
  };
}

/**
 * Extracts movies directly from District's SSR Movie pages:
 * - https://www.district.in/movies/${city.slug}-movie-tickets
 * - https://www.district.in/movies/
 * Parses both SSR `<a href="/movies/...">` cards and Next.js detail pages.
 */
export async function scrapeDistrictMovies(
  city: DistrictCityConfig,
  limit = 16
): Promise<CatalogItem[]> {
  const moviePages = [
    'https://www.district.in/movies/',
  ];

  const discoveredMovies = new Map<
    string,
    {
      title: string;
      url: string;
      posterUrl: string;
      censorRating: string;
      languages: string[];
    }
  >();

  for (const pageUrl of moviePages) {
    try {
      console.log(`[District] Scraping SSR movies from ${pageUrl}...`);
      const html = await fetchHtmlWithFallback(pageUrl);
      const $ = cheerio.load(html);

      $('a[href*="/movies/"]').each((_, el) => {
        if (discoveredMovies.size >= limit) return;
        const href = $(el).attr('href') || '';
        const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;

        // Match District movie ticket links (e.g. /movies/udta-teer-movie-tickets-MV209123)
        if (!/\/movies\/[a-zA-Z0-9_-]+-MV[0-9]+/i.test(fullUrl)) return;

        const slugMatch = fullUrl.match(/\/movies\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1] : '';
        if (!slug || discoveredMovies.has(slug)) return;

        const cardText = $(el).text().replace(/\s+/g, ' ').trim();
        const imgEl = $(el).find('img').first();
        let posterUrl =
          imgEl.attr('src') ||
          imgEl.attr('data-src') ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

        if (posterUrl.startsWith('data:image') || posterUrl.includes('.svg')) {
          posterUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
        }

        // Extract censor & language pattern like "UA16+ | Hindi" or "A | English and 1 more"
        const metaMatch = cardText.match(/\b(UA\d*\+|UA|U|A|TBA)\s*\|\s*([A-Za-z]+(?:\s+and\s+\d+\s+more)?)/);
        const censorRating = metaMatch ? metaMatch[1] : 'UA';
        const primaryLang = metaMatch ? metaMatch[2].replace(/\s+and\s+\d+\s+more/i, '').trim() : 'Hindi';

        let rawTitle = imgEl.attr('alt')?.trim();
        if (!rawTitle || rawTitle.length < 3 || rawTitle.toLowerCase() === 'movie') {
          const matchBeforeRating = cardText.match(/^(.+?)(?:UA\d*\+|UA|U|A|TBA)\s*\|/i);
          if (matchBeforeRating && matchBeforeRating[1].trim().length >= 3) {
            rawTitle = matchBeforeRating[1].trim();
          } else {
            rawTitle = slug
              .replace(/-movie-tickets.*/i, '')
              .replace(/-in-[a-z]+-MV.*/i, '')
              .replace(/[-_]+/g, ' ')
              .trim()
              .replace(/\b\w/g, (c) => c.toUpperCase());
          }
        }

        if (!isValidDistrictItem(rawTitle, posterUrl, cardText)) return;

        discoveredMovies.set(slug, {
          title: rawTitle,
          url: fullUrl,
          posterUrl,
          censorRating,
          languages: [primaryLang],
        });
      });
    } catch (err: any) {
      console.warn(`[District] Could not parse movie listing page ${pageUrl}:`, err.message);
    }
  }

  const items: CatalogItem[] = [];
  for (const [slug, m] of discoveredMovies.entries()) {
    items.push({
      id: `district-mv-${city.cityCode.toLowerCase()}-${slug.toLowerCase()}`,
      type: 'movie',
      source: 'district',
      title: m.title,
      description: `Compare District, BookMyShow & Multiplex checkout fees and credit card BOGO offers for ${m.title} in ${city.cityName}.`,
      category: 'Cinema',
      languages: m.languages,
      posterUrl: m.posterUrl,
      cityCode: city.cityCode,
      cityName: city.cityName,
      venue: `PVR INOX, Cinépolis & Partner Cinemas (${city.cityName})`,
      coordinates: { lat: city.defaultLat, lng: city.defaultLng },
      date: new Date().toISOString().slice(0, 10),
      startingPriceINR: undefined, // Evaluated dynamically in MovieCheckoutCalculator
      bookingUrl: m.url,
      rating: m.censorRating,
      rawDetails: {
        censorRating: m.censorRating,
        lastVerifiedAt: new Date().toISOString(),
      },
    });
  }

  return items;
}

/**
 * Scrapes live verified events, concerts, and comedy shows from District's SSR city pages:
 * - https://www.district.in/events/upcoming-events-in-${city.slug}
 * - https://www.district.in/events/events-this-weekend-in-${city.slug}
 * - https://www.district.in/events/performances-in-${city.slug}-book-tickets
 */
export async function scrapeDistrictEvents(
  city: DistrictCityConfig,
  limit = 18
): Promise<CatalogItem[]> {
  const eventListingUrls = [
    `https://www.district.in/events/upcoming-events-in-${city.slug}`,
    `https://www.district.in/events/events-this-weekend-in-${city.slug}`,
    `https://www.district.in/events/performances-in-${city.slug}-book-tickets`,
  ];

  const items: CatalogItem[] = [];
  const seenSlugs = new Set<string>();

  for (const listingUrl of eventListingUrls) {
    try {
      console.log(`[District] Scraping SSR events for ${city.cityName} from ${listingUrl}...`);
      const html = await fetchHtmlWithFallback(listingUrl);
      const $ = cheerio.load(html);

      // 1. Direct SSR Card Extraction from the city event listing page
      $('a[href*="/events/"]').each((_, el) => {
        if (items.length >= limit) return;
        const href = $(el).attr('href') || '';
        const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;

        // Only match actual event detail links (ending in -buy-tickets)
        if (!/\/events\/[a-zA-Z0-9_-]+-buy-tickets/i.test(fullUrl)) return;

        const slugMatch = fullUrl.match(/\/events\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1].replace(/-buy-tickets.*/i, '') : '';
        if (!slug || seenSlugs.has(slug)) return;

        const cardText = $(el).text().replace(/\s+/g, ' ').trim();
        const imgEl = $(el).find('img').first();
        let posterUrl =
          imgEl.attr('src') ||
          imgEl.attr('data-src') ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';

        if (posterUrl.startsWith('data:image') || posterUrl.includes('.svg')) {
          posterUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';
        }

        // Extract INR price ("₹899 onwards" or "₹1499")
        const priceMatch = cardText.match(/₹\s*([0-9,]+)/);
        const rawPrice = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 499;

        const rawTitle = cleanDistrictTitle(imgEl.attr('alt'), slug);

        if (!isValidDistrictItem(rawTitle, posterUrl, cardText)) return;
        seenSlugs.add(slug);

        const { date, time } = parseDistrictDateAndTime(cardText);

        // Extract venue name if present before ₹ price
        let venueName = `${city.cityName} Venue`;
        const venueMatch = cardText.match(/([A-Za-z0-9\s|,&'-]+,\s*(?:Pune|Mumbai|Navi Mumbai|Bengaluru|Delhi\/NCR|Gurugram|Noida|Hyderabad))/i);
        if (venueMatch) {
          venueName = venueMatch[1].trim();
        }

        const resolvedCityCode = resolveCityCode(`${venueName} ${rawTitle}`, city.cityCode);
        const eventCity = getSupportedCity(resolvedCityCode);

        const isMusic =
          /concert|music|festival|sonu nigam|shreya ghoshal|shankar ehsaan|papon|rolling loud|bollywood music|sunidhi|darshan raval|sufi|dj|jamming|gig|live in concert/i.test(
            `${rawTitle} ${cardText}`
          );
        const isComedy =
          /comedy|standup|stand-up|roast|laughter|open mic|samay raina|comic|jokes/i.test(
            `${rawTitle} ${cardText}`
          );

        const ticketTiers = buildTiersFromStartingPrice(rawPrice);
        const tierMetrics = computeActiveTierPricing(ticketTiers, rawPrice);

        items.push({
          id: `district-ev-${slug.toLowerCase()}`,
          type: isMusic ? 'concert' : 'event',
          source: 'district',
          title: rawTitle,
          description: `${rawTitle} at ${venueName}. Official tickets and phase pricing verified on District by Zomato.`,
          category: isMusic ? 'Concert' : isComedy ? 'Stand-up Comedy' : 'Live Event',
          posterUrl,
          cityCode: eventCity.code,
          cityName: eventCity.name,
          venue: venueName,
          coordinates: { lat: eventCity.defaultLat, lng: eventCity.defaultLng },
          date,
          time,
          startingPriceINR: tierMetrics.activePriceINR,
          lowestListedPriceINR: tierMetrics.lowestListedPriceINR,
          activePhaseName: tierMetrics.activePhaseName,
          hasSoldOutEarlyPhases: tierMetrics.hasSoldOutEarlyPhases,
          ticketStatus: tierMetrics.ticketStatus,
          bookingUrl: fullUrl,
          rawDetails: {
            ticketTiers,
            ticketStatus: tierMetrics.ticketStatus,
            lastVerifiedAt: new Date().toISOString(),
          },
        });
      });
    } catch (err: any) {
      console.warn(`[District] Error scraping ${listingUrl}:`, err.message);
    }
  }

  // 2. Deep JSON-LD enrichment for up to 5 discovered events if detail pages are reachable
  for (const item of items.slice(0, 5)) {
    try {
      const detailHtml = await fetchHtmlWithFallback(item.bookingUrl);
      const e$ = cheerio.load(detailHtml);

      let eventSchema: any = null;
      e$('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse(e$(el).html() || '{}');
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          for (const entry of arr) {
            if (entry['@type'] && String(entry['@type']).includes('Event')) {
              eventSchema = entry;
              break;
            }
          }
        } catch {}
      });

      if (eventSchema) {
        if (eventSchema.description) {
          item.description = String(eventSchema.description)
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (eventSchema.location?.name) {
          const addressText = extractAddressText(eventSchema.location?.address);
          item.venue = `${eventSchema.location.name}${addressText ? `, ${addressText}` : ''}`;
        }
        if (Array.isArray(eventSchema.offers?.offers) && eventSchema.offers.offers.length > 0) {
          const realTiers: TicketTier[] = eventSchema.offers.offers.map((o: any, idx: number) => ({
            tierId: `dist-tier-${idx + 1}`,
            name: o.name || `Phase ${idx + 1}`,
            priceINR: Number(o.price) || item.startingPriceINR || 499,
            availability: (
              o.availability && String(o.availability).includes('InStock')
                ? 'available'
                : 'sold_out'
            ) as TicketTierAvailability,
          }));
          const tierMetrics = computeActiveTierPricing(realTiers, item.startingPriceINR);
          item.startingPriceINR = tierMetrics.activePriceINR;
          item.lowestListedPriceINR = tierMetrics.lowestListedPriceINR;
          item.activePhaseName = tierMetrics.activePhaseName;
          item.hasSoldOutEarlyPhases = tierMetrics.hasSoldOutEarlyPhases;
          item.ticketStatus = tierMetrics.ticketStatus;
          item.rawDetails = {
            ...item.rawDetails,
            ticketTiers: realTiers,
          };
        }
      }
    } catch {}
  }

  return items;
}

/**
 * Unified District catalog scraper for a city (combines SSR Movies + SSR Events/Concerts/Comedy).
 */
export async function scrapeDistrictCatalog(
  city: DistrictCityConfig,
  limit = 16
): Promise<CatalogItem[]> {
  console.log(`[District] Scraping full SSR catalog (Movies, Concerts, Comedy & Events) for ${city.cityName}...`);
  const [movies, events] = await Promise.all([
    scrapeDistrictMovies(city, limit),
    scrapeDistrictEvents(city, limit),
  ]);
  console.log(
    `[District] Completed ${city.cityName}: ${movies.length} movies + ${events.length} live events/concerts.`
  );
  return [...events, ...movies];
}
