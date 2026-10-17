import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TOP_BMS_CITIES, scrapeBMSCatalog, scrapeEventDetails, discoverEventsForCity } from './platforms/bms';
import { DISTRICT_CITIES, scrapeDistrictCatalog } from './platforms/district';
import { CatalogItem, ConcertEvent } from '../lib/types';
import { setCachedCityCatalog } from '../lib/cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const CATALOG_FILE_PATH = path.join(__dirname, '../lib/data/catalog.json');
const EVENTS_FILE_PATH = path.join(__dirname, '../lib/data/events.json');

async function main() {
  console.log('====================================================');
  console.log('🚀 BeatRoute Unified Master Scraper (BMS + District)');
  console.log('====================================================');

  const catalogMap = new Map<string, CatalogItem>();

  // 1. Load existing catalog.json if available
  if (fs.existsSync(CATALOG_FILE_PATH)) {
    try {
      const rawCatalog = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const parsed: CatalogItem[] = JSON.parse(rawCatalog);
      parsed.forEach((item) => catalogMap.set(item.id, item));
      console.log(`[Storage] Loaded ${catalogMap.size} existing items from catalog.json.`);
    } catch (e: any) {
      console.warn('[Storage] Could not parse catalog.json, will rebuild:', e.message);
    }
  }

  // 2. Also import existing events from events.json to ensure full backwards compatibility
  let existingEvents: ConcertEvent[] = [];
  if (fs.existsSync(EVENTS_FILE_PATH)) {
    try {
      const rawEvents = fs.readFileSync(EVENTS_FILE_PATH, 'utf-8');
      existingEvents = JSON.parse(rawEvents);
      console.log(`[Storage] Loaded ${existingEvents.length} existing events from events.json.`);

      for (const ev of existingEvents) {
        if (!catalogMap.has(ev.id)) {
          catalogMap.set(ev.id, {
            id: ev.id,
            type: 'concert',
            source: ev.source,
            title: ev.artist,
            description: ev.tourName,
            category: ev.genres?.[0] || 'Concert',
            posterUrl: ev.artistImageUrl,
            cityCode: ev.cityCode,
            cityName: ev.cityName,
            venue: ev.venue,
            coordinates: ev.coordinates,
            date: ev.date,
            time: ev.time,
            startingPriceINR: ev.startingPriceINR,
            bookingUrl: ev.bookingUrl,
            rawDetails: {
              ticketTiers: ev.ticketTiers,
              ticketStatus: ev.ticketStatus,
              highlights: ev.highlights,
            },
          });
        }
      }
    } catch (e: any) {
      console.warn('[Storage] Could not read events.json:', e.message);
    }
  }

  // 3. Scrape District (by Zomato) for Top Hubs
  console.log('\n--- 🎟️ Scraping District by Zomato (Movies & Events) ---');
  for (const city of DISTRICT_CITIES.slice(0, 3)) { // Top 3 hubs for batch cycle
    try {
      const districtItems = await scrapeDistrictCatalog(city, 3);
      districtItems.forEach((item) => {
        const isNew = !catalogMap.has(item.id);
        catalogMap.set(item.id, item);
        console.log(`${isNew ? '✨ [NEW]' : '🔄 [UPDATE]'} [District] ${item.type.toUpperCase()}: ${item.title} (${item.cityName})`);
      });
    } catch (err: any) {
      console.error(`Error scraping District for ${city.cityName}:`, err.message);
    }
  }

  // 4. Scrape BookMyShow (Events & Movies) for Top Hubs
  console.log('\n--- 🎫 Scraping BookMyShow (Movies & Events) ---');
  for (const city of TOP_BMS_CITIES.slice(0, 3)) {
    try {
      const bmsItems = await scrapeBMSCatalog(city, 2);
      bmsItems.forEach((item) => {
        const isNew = !catalogMap.has(item.id);
        catalogMap.set(item.id, item);
        console.log(`${isNew ? '✨ [NEW]' : '🔄 [UPDATE]'} [BMS] ${item.type.toUpperCase()}: ${item.title} (${item.cityName})`);
      });
    } catch (err: any) {
      console.error(`Error scraping BMS for ${city.cityName}:`, err.message);
    }
  }

  // 5. Save updated catalog.json
  const finalCatalog = Array.from(catalogMap.values()).sort((a, b) => {
    return (a.date || '').localeCompare(b.date || '');
  });

  fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(finalCatalog, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${finalCatalog.length} total catalog items to ${CATALOG_FILE_PATH}`);

  // 6. Keep events.json synchronized for active UI compatibility
  const eventsForFeed: ConcertEvent[] = [];
  const seenEventIds = new Set<string>();

  // Add all existing curated and live events
  for (const ev of existingEvents) {
    eventsForFeed.push(ev);
    seenEventIds.add(ev.id);
  }

  // Add any newly discovered events from District
  for (const item of finalCatalog) {
    if (item.type !== 'movie' && !seenEventIds.has(item.id)) {
      eventsForFeed.push({
        id: item.id,
        artist: item.title,
        tourName: item.description || item.title,
        artistImageUrl: item.posterUrl,
        date: item.date || new Date().toISOString().slice(0, 10),
        time: item.time || '19:00 IST',
        cityCode: item.cityCode,
        cityName: item.cityName,
        venue: item.venue || `${item.cityName} Venue`,
        coordinates: item.coordinates || { lat: 19.076, lng: 72.8777 },
        genres: [item.category, 'District Live'],
        startingPriceINR: item.startingPriceINR || 499,
        ticketTiers: [
          {
            tierId: 'tier-ga',
            name: 'General Entry',
            priceINR: item.startingPriceINR || 499,
            availability: 'available',
          },
        ],
        ticketStatus: 'available',
        bookingUrl: item.bookingUrl,
        source: item.source as any,
        highlights: ['Live event discovered from District by Zomato'],
      });
      seenEventIds.add(item.id);
    }
  }

  eventsForFeed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(eventsForFeed, null, 2), 'utf-8');
  console.log(`💾 Synchronized ${eventsForFeed.length} live events to ${EVENTS_FILE_PATH}`);

  // 7. Dual-Sync: Seed Upstash Redis cache for each scraped city
  console.log('\n--- ⚡ Dual-Sync: Seeding Redis Cache ---');
  const cityItemsMap = new Map<string, CatalogItem[]>();
  for (const item of finalCatalog) {
    if (item.cityCode) {
      const code = item.cityCode.toUpperCase();
      if (!cityItemsMap.has(code)) cityItemsMap.set(code, []);
      cityItemsMap.get(code)!.push(item);
    }
  }

  for (const [code, items] of cityItemsMap.entries()) {
    try {
      await setCachedCityCatalog(code, items, 3600);
      console.log(`[Cache Sync] Seeded ${items.length} items into cache for city ${code}.`);
    } catch (err: any) {
      console.warn(`[Cache Sync] Could not seed cache for ${code}:`, err.message);
    }
  }

  console.log('====================================================');
  console.log('🎉 Unified Scraping cycle completed successfully!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal Scraper Error:', err);
  process.exit(1);
});
