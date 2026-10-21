import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TOP_BMS_CITIES, scrapeBMSCatalog } from './platforms/bms';
import { DISTRICT_CITIES, scrapeDistrictCatalog } from './platforms/district';
import { CatalogItem } from '../lib/types';
import { deduplicateCatalog, computeActiveTierPricing } from '../lib/deduplicate';
import { getSupportedCity, resolveCityCode } from '../lib/location';
import { setCachedCityCatalog } from '../lib/cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const CATALOG_FILE_PATH = path.join(__dirname, '../lib/data/catalog.json');

/**
 * Repairs any legacy catalog items (fixes venue city resolution, reclassifies
 * BMS music shows to 'concert', strips fake hardcoded 250/199 movie prices,
 * and recalculates active available tier prices).
 */
export function sanitizeCatalogItem(item: CatalogItem): CatalogItem {
  // 1. Re-verify city from venue + title so Mumbai shows never sit under PNQ/HYD
  const detectedCode = resolveCityCode(
    `${item.venue || ''} ${item.title || ''}`,
    item.cityCode || 'PNQ'
  );
  const cityMeta = getSupportedCity(detectedCode);

  // 2. Reclassify BMS music events as 'concert'
  const isMusic =
    item.type === 'concert' ||
    (item.type === 'event' &&
      /concert|music|festival|sunburn|anyma|live in concert|symphony|gig|dj/i.test(
        `${item.title} ${item.category || ''}`
      ));

  // 3. Recompute active phase pricing or strip fake movie price
  const rawTiers = item.rawDetails?.ticketTiers;
  const isFakeMoviePrice =
    item.type === 'movie' &&
    !rawTiers &&
    ((item.source === 'bookmyshow' && item.startingPriceINR === 250) ||
      (item.source === 'district' && item.startingPriceINR === 199));

  const tierMetrics = computeActiveTierPricing(
    rawTiers,
    isFakeMoviePrice ? undefined : item.startingPriceINR
  );

  return {
    ...item,
    type: item.type === 'movie' ? 'movie' : isMusic ? 'concert' : 'event',
    cityCode: cityMeta.code,
    cityName: cityMeta.name,
    coordinates:
      item.cityCode !== cityMeta.code
        ? { lat: cityMeta.defaultLat, lng: cityMeta.defaultLng }
        : item.coordinates || { lat: cityMeta.defaultLat, lng: cityMeta.defaultLng },
    startingPriceINR: tierMetrics.activePriceINR,
    lowestListedPriceINR: tierMetrics.lowestListedPriceINR,
    activePhaseName: tierMetrics.activePhaseName,
    hasSoldOutEarlyPhases: tierMetrics.hasSoldOutEarlyPhases,
    ticketStatus: tierMetrics.ticketStatus,
  };
}

async function main() {
  console.log('==============================================================');
  console.log('🚀 BeatRoute 2.0 Master Scraper (Pune PNQ + Mumbai BOM Focus)');
  console.log('==============================================================');

  const catalogMap = new Map<string, CatalogItem>();

  // 1. Load & sanitize existing catalog.json snapshot
  if (fs.existsSync(CATALOG_FILE_PATH)) {
    try {
      const rawCatalog = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const parsed: CatalogItem[] = JSON.parse(rawCatalog);
      parsed.forEach((rawItem) => {
        const clean = sanitizeCatalogItem(rawItem);
        catalogMap.set(clean.id, clean);
      });
      console.log(`[Storage] Loaded & sanitized ${catalogMap.size} existing items from catalog.json.`);
    } catch (e: any) {
      console.warn('[Storage] Could not parse catalog.json, will rebuild:', e.message);
    }
  }

  // 2. Scrape District by Zomato for Twin-Corridor Hubs (Pune & Mumbai, limit=12 per city)
  console.log('--- 🎟️ Scraping District by Zomato (Pune & Mumbai) ---');
  for (const city of DISTRICT_CITIES) {
    try {
      const districtItems = await scrapeDistrictCatalog(city, 12);
      districtItems.forEach((rawItem) => {
        const item = sanitizeCatalogItem(rawItem);
        const isNew = !catalogMap.has(item.id);
        catalogMap.set(item.id, item);
        console.log(
          `${isNew ? '✨ [NEW]' : '🔄 [UPDATE]'} [District] ${item.type.toUpperCase()}: ${item.title} (${item.cityName})`
        );
      });
    } catch (err: any) {
      console.error(`Error scraping District for ${city.cityName}:`, err.message);
    }
  }

  // 3. Scrape BookMyShow for Twin-Corridor Hubs (Pune & Mumbai, limit=10 per category)
  console.log('--- 🎫 Scraping BookMyShow (Pune & Mumbai) ---');
  for (const city of TOP_BMS_CITIES) {
    try {
      const bmsItems = await scrapeBMSCatalog(city, 10);
      bmsItems.forEach((rawItem) => {
        const item = sanitizeCatalogItem(rawItem);
        const isNew = !catalogMap.has(item.id);
        catalogMap.set(item.id, item);
        console.log(
          `${isNew ? '✨ [NEW]' : '🔄 [UPDATE]'} [BMS] ${item.type.toUpperCase()}: ${item.title} (${item.cityName})`
        );
      });
    } catch (err: any) {
      console.error(`Error scraping BMS for ${city.cityName}:`, err.message);
    }
  }

  // 4. Filter active items & run Cross-Platform Deduplication
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const activeItems = Array.from(catalogMap.values()).filter((item) => {
    if (item.type === 'movie') {
      return !item.date || item.date >= thirtyDaysAgo;
    }
    return !item.date || item.date >= today;
  });

  const finalCatalog = deduplicateCatalog(activeItems).sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );

  fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(finalCatalog, null, 2), 'utf-8');
  console.log(
    `💾 Saved ${finalCatalog.length} deduplicated, verified catalog items to ${CATALOG_FILE_PATH}`
  );

  // 5. Seed Upstash Redis cache per city (12-hour TTL for scheduled scrape-and-store)
  console.log('--- ⚡ Seeding City Catalog Cache (12h TTL) ---');
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
      await setCachedCityCatalog(code, items, 12 * 3600);
      console.log(`[Cache Sync] Seeded ${items.length} deduplicated items for city ${code}.`);
    } catch (err: any) {
      console.warn(`[Cache Sync] Could not seed cache for ${code}:`, err.message);
    }
  }

  console.log('==============================================================');
  console.log('🎉 Scheduled Scrape & Deduplication Completed Successfully!');
  console.log('==============================================================');
}

// Only execute main() when invoked directly via CLI (`npm run scrape`)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((err) => {
    console.error('Fatal Scraper Error:', err);
    process.exit(1);
  });
}
