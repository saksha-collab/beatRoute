import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TOP_BMS_CITIES, discoverEventsForCity, scrapeEventDetails } from './platforms/bms';
import { ConcertEvent } from '../lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const EVENTS_FILE_PATH = path.join(__dirname, '../lib/data/events.json');

async function main() {
  console.log('==============================================');
  console.log('🚀 BeatRoute Automated Live Discovery Engine');
  console.log('==============================================');

  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: SCRAPER_API_KEY environment variable is missing.');
    console.error('Please configure it in .env or GitHub Secrets.');
    process.exit(1);
  }

  // 1. Read existing events
  let existingEvents: ConcertEvent[] = [];
  try {
    const raw = fs.readFileSync(EVENTS_FILE_PATH, 'utf-8');
    existingEvents = JSON.parse(raw);
    console.log(`[Storage] Loaded ${existingEvents.length} existing events.`);
  } catch (err: any) {
    console.warn('[Storage] Could not read existing events.json:', err.message);
  }

  // Map existing events by ID
  const eventMap = new Map<string, ConcertEvent>();
  existingEvents.forEach((ev) => eventMap.set(ev.id, ev));

  let newlyAddedCount = 0;
  let updatedCount = 0;

  // 2. Iterate through cities
  for (const city of TOP_BMS_CITIES) {
    console.log(`\n--- Fetching live shows for ${city.cityName} (${city.cityCode}) ---`);
    const discovered = await discoverEventsForCity(city, apiKey, 2); // 2 per city for balanced quota

    for (const item of discovered) {
      const details = await scrapeEventDetails(item, city, apiKey);
      if (details) {
        if (!eventMap.has(details.id)) {
          newlyAddedCount++;
          console.log(`✨ [NEW] Added: ${details.artist} (${details.cityName})`);
        } else {
          updatedCount++;
          console.log(`🔄 [UPDATE] Refreshed: ${details.artist} (${details.cityName})`);
        }
        eventMap.set(details.id, details);
      }
    }
  }

  // 3. Sort chronologically
  const mergedEvents = Array.from(eventMap.values()).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // 4. Save to events.json
  fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(mergedEvents, null, 2), 'utf-8');
  console.log('\n==============================================');
  console.log(`🎉 Scraping cycle finished!`);
  console.log(`   - Total catalog events: ${mergedEvents.length}`);
  console.log(`   - Newly added: ${newlyAddedCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Saved to: ${EVENTS_FILE_PATH}`);
  console.log('==============================================');
}

main().catch((err) => {
  console.error('Fatal Scraper Error:', err);
  process.exit(1);
});
