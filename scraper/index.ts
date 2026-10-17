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

  // 2. Scrape District (by Zomato) for Top Hubs
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

  // 3. Scrape BookMyShow (Events & Movies) for Top Hubs
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

  // 4. Filter & Prune: Strictly upcoming events (date >= today) and active movies
  const today = new Date().toISOString().slice(0, 10);
  const finalCatalog = Array.from(catalogMap.values())
    .filter((item) => {
      if (item.type === 'movie') return true;
      if (!item.date) return true;
      return item.date >= today;
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(finalCatalog, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${finalCatalog.length} active live catalog items (pruned expired shows) to ${CATALOG_FILE_PATH}`);

  // 5. Keep events.json synchronized with active live concerts/events only
  const eventsForFeed: ConcertEvent[] = [];
  for (const item of finalCatalog) {
    if (item.type !== 'movie') {
      eventsForFeed.push({
        id: item.id,
        artist: item.title,
        tourName: item.description || item.title,
        artistImageUrl: item.posterUrl,
        date: item.date || today,
        time: item.time || '19:00 IST',
        cityCode: item.cityCode,
        cityName: item.cityName,
        venue: item.venue || `${item.cityName} Venue`,
        coordinates: item.coordinates || { lat: 19.076, lng: 72.8777 },
        genres: [item.category, item.source === 'district' ? 'District Live' : 'BookMyShow Live'],
        startingPriceINR: item.startingPriceINR || 499,
        ticketTiers: item.rawDetails?.ticketTiers || [
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
        highlights: [`Live event discovered from ${item.source === 'district' ? 'District by Zomato' : 'BookMyShow'}`],
      });
    }
  }

  eventsForFeed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(eventsForFeed, null, 2), 'utf-8');
  console.log(`💾 Synchronized ${eventsForFeed.length} active live events to ${EVENTS_FILE_PATH}`);

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
