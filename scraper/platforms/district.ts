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
 * Major Indian metro hubs supported by BeatRoute for District scraping.
 */
export const DISTRICT_CITIES: DistrictCityConfig[] = [
  { slug: 'pune', cityCode: 'PNQ', cityName: 'Pune', defaultLat: 18.5204, defaultLng: 73.8567 },
  { slug: 'mumbai', cityCode: 'BOM', cityName: 'Mumbai', defaultLat: 19.076, defaultLng: 72.8777 },
  { slug: 'delhi', cityCode: 'DEL', cityName: 'Delhi NCR', defaultLat: 28.6139, defaultLng: 77.209 },
  { slug: 'bengaluru', cityCode: 'BLR', cityName: 'Bengaluru', defaultLat: 12.9716, defaultLng: 77.5946 },
  { slug: 'hyderabad', cityCode: 'HYD', cityName: 'Hyderabad', defaultLat: 17.385, defaultLng: 78.4867 },
  { slug: 'kolkata', cityCode: 'CCU', cityName: 'Kolkata', defaultLat: 22.5726, defaultLng: 88.3639 },
  { slug: 'ahmedabad', cityCode: 'AMD', cityName: 'Ahmedabad', defaultLat: 23.0225, defaultLng: 72.5714 },
];

/**
 * Validates if an extracted District item has legitimate title and poster data.
 */
function isValidDistrictItem(title: string, posterUrl?: string): boolean {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim().toLowerCase();

  if (clean.length < 3) return false;
  if (clean === 'district' || clean === 'district by zomato') return false;
  if (
    clean === 'movies' ||
    clean === 'cinema' ||
    clean === 'events' ||
    clean === 'comedy' ||
    clean === 'music'
  ) {
    return false;
  }
  if (
    clean.startsWith('district event') ||
    clean.includes('book navratri events') ||
    clean.includes('venue guide')
  ) {
    return false;
  }
  if (/[0-9]{10,}/.test(clean)) return false;
  if (!posterUrl || posterUrl.includes('undefined')) return false;

  return true;
}

/**
 * Scrapes live verified movies and events from District (by Zomato) for a specific city.
 */
export async function scrapeDistrictCatalog(
  city: DistrictCityConfig,
  limit = 10
): Promise<CatalogItem[]> {
  console.log(`[District] Discovering verified movies & events for ${city.cityName}...`);
  const items: CatalogItem[] = [];

  try {
    // Fetch both main discovery feed and city-scoped routes
    const candidateUrls = [
      `https://www.district.in/events/${city.slug}`,
      `https://www.district.in/movies/${city.slug}`,
      'https://www.district.in',
    ];

    const movieUrls = new Set<string>();
    const eventUrls = new Set<string>();

    for (const feedUrl of candidateUrls) {
      try {
        const html = await fetchHtmlWithFallback(feedUrl);
        const $ = cheerio.load(html);

        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const fullUrl = href.startsWith('http') ? href : `https://www.district.in${href}`;

          if (/\/movies\/[a-zA-Z0-9_-]+-MV[0-9]+/i.test(fullUrl)) {
            movieUrls.add(fullUrl);
          } else if (/\/events\/[a-zA-Z0-9_-]+-buy-tickets/i.test(fullUrl)) {
            eventUrls.add(fullUrl);
          }
        });
      } catch {}
    }

    // 1. Parse Discovered Movies for this City
    const selectedMovieUrls = Array.from(movieUrls).slice(0, limit);
    console.log(
      `[District] Discovered ${movieUrls.size} movie links for ${city.cityName}. Parsing ${selectedMovieUrls.length}...`
    );

    for (const url of selectedMovieUrls) {
      try {
        const movieHtml = await fetchHtmlWithFallback(url);
        const m$ = cheerio.load(movieHtml);

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
              if (m.inLanguage) {
                languages = Array.isArray(m.inLanguage) ? m.inLanguage : [m.inLanguage];
              }
              duration = m.duration_as_string;
            }
          } catch {}
        }

        if (!title) {
          const rawOgTitle = m$('meta[property="og:title"]').attr('content') || '';
          title = rawOgTitle.replace(/ \([0-9]{4}\).*|- Cast, Reviews.*$/i, '').trim();
          posterUrl = posterUrl || m$('meta[property="og:image"]').attr('content') || '';
          description = description || m$('meta[property="og:description"]').attr('content') || '';
        }

        if (!isValidDistrictItem(title, posterUrl)) continue;

        const slugMatch = url.match(/\/movies\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch ? slugMatch[1] : `movie-${Date.now()}`;

        items.push({
          id: `district-mv-${city.cityCode.toLowerCase()}-${slug}`,
          type: 'movie',
          source: 'district',
          title,
          description:
            description ||
            `Compare District, BookMyShow & Multiplex checkout fees and card offers for ${title} in ${city.cityName}.`,
          category: 'Cinema',
          languages,
          posterUrl,
          cityCode: city.cityCode,
          cityName: city.cityName,
          venue: `PVR INOX, Cinépolis & Partner Theatres (${city.cityName})`,
          coordinates: { lat: city.defaultLat, lng: city.defaultLng },
          date: new Date().toISOString().slice(0, 10),
          startingPriceINR: undefined, // Evaluated dynamically in the Movie Checkout Calculator
          bookingUrl: url,
          rawDetails: {
            duration,
            censorRating: 'UA',
            lastVerifiedAt: new Date().toISOString(),
          },
        });
      } catch (err: any) {
        console.warn(`[District] Error parsing movie ${url}:`, err.message);
      }
    }

    // 2. Parse Discovered Live Events & Concerts
    const selectedEventUrls = Array.from(eventUrls).slice(0, limit);
    console.log(
      `[District] Discovered ${eventUrls.size} event links. Parsing ${selectedEventUrls.length}...`
    );

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
              if (item['@type'] && item['@type'].includes('Event')) {
                eventSchema = item;
                break;
              }
            }
          } catch {}
        });

        const title =
          eventSchema?.name?.trim() ||
          (e$('meta[property="og:title"]').attr('content') || '')
            .replace(/- Buy Tickets.*$/i, '')
            .trim();

        const posterUrl =
          (Array.isArray(eventSchema?.image) ? eventSchema.image[0] : eventSchema?.image) ||
          e$('meta[property="og:image"]').attr('content') ||
          '';

        const cleanDesc = (
          eventSchema?.description ||
          e$('meta[property="og:description"]').attr('content') ||
          'Live event on District by Zomato'
        )
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!isValidDistrictItem(title, posterUrl)) continue;

        const venueName = (eventSchema?.location?.name || `${city.cityName} Arena`).trim();
        const addressText = extractAddressText(eventSchema?.location?.address);
        const resolvedCityCode = resolveCityCode(
          `${venueName} ${addressText} ${title}`,
          city.cityCode
        );
        const eventCity = getSupportedCity(resolvedCityCode);

        const lat = Number(eventSchema?.location?.geo?.latitude) || eventCity.defaultLat;
        const lng = Number(eventSchema?.location?.geo?.longitude) || eventCity.defaultLng;
        const startDate =
          eventSchema?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
        const rawLowPrice = Number(eventSchema?.offers?.lowPrice) || 499;

        const ticketTiers: TicketTier[] = [];
        if (Array.isArray(eventSchema?.offers?.offers) && eventSchema.offers.offers.length > 0) {
          eventSchema.offers.offers.forEach((o: any, idx: number) => {
            const avail: TicketTierAvailability =
              o.availability && o.availability.includes('InStock') ? 'available' : 'sold_out';
            ticketTiers.push({
              tierId: `dist-tier-${idx + 1}`,
              name: o.name || `Phase ${idx + 1}`,
              priceINR: Number(o.price) || rawLowPrice,
              availability: avail,
            });
          });
        }

        const tierMetrics = computeActiveTierPricing(
          ticketTiers.length > 0 ? ticketTiers : undefined,
          rawLowPrice
        );

        const slugMatch = url.match(/\/events\/([a-zA-Z0-9_-]+)/);
        const slug = slugMatch
          ? slugMatch[1].replace(/-buy-tickets.*/, '')
          : `event-${Date.now()}`;

        const keywords = (eventSchema?.keywords || '').toLowerCase();
        const combinedText = `${title.toLowerCase()} ${keywords}`;
        const isMusic =
          /music|concert|festival|dandiya|band|dj|singer|acoustic|gig|sufi|rock|techno|boiler/i.test(
            combinedText
          );
        const isComedy = /comedy|standup|stand-up|comic|open mic/i.test(combinedText);

        items.push({
          id: `district-ev-${slug}`,
          type: isMusic ? 'concert' : 'event',
          source: 'district',
          title,
          description: cleanDesc,
          category: isMusic ? 'Concert' : isComedy ? 'Stand-up Comedy' : 'Live Event',
          posterUrl,
          cityCode: eventCity.code,
          cityName: eventCity.name,
          venue: venueName,
          coordinates: { lat, lng },
          date: startDate,
          startingPriceINR: tierMetrics.activePriceINR,
          lowestListedPriceINR: tierMetrics.lowestListedPriceINR,
          activePhaseName: tierMetrics.activePhaseName,
          hasSoldOutEarlyPhases: tierMetrics.hasSoldOutEarlyPhases,
          ticketStatus: tierMetrics.ticketStatus,
          bookingUrl: url,
          rawDetails: {
            doorTime: eventSchema?.doorTime,
            locationAddress: addressText,
            ticketTiers: ticketTiers.length > 0 ? ticketTiers : undefined,
            ticketStatus: tierMetrics.ticketStatus,
            lastVerifiedAt: new Date().toISOString(),
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
