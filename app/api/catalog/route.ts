import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CatalogItem } from '@/lib/types';
import { TOP_BMS_CITIES, scrapeBMSCatalog } from '@/scraper/platforms/bms';
import { DISTRICT_CITIES, scrapeDistrictCatalog } from '@/scraper/platforms/district';

export const dynamic = 'force-dynamic';

const CATALOG_PATH = path.join(process.cwd(), 'lib/data/catalog.json');

function readCatalog(): CatalogItem[] {
  try {
    if (fs.existsSync(CATALOG_PATH)) {
      const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read catalog.json:', err);
  }
  return [];
}

function writeCatalog(items: CatalogItem[]): void {
  try {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write catalog.json:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityParam = (searchParams.get('city') || 'BOM').toUpperCase();
  const typeParam = searchParams.get('type'); // 'all' | 'movie' | 'event' | 'concert'
  const forceRefresh = searchParams.get('refresh') === 'true';

  let catalog = readCatalog();

  // Filter existing items for requested city
  let cityItems = catalog.filter((item) => item.cityCode.toUpperCase() === cityParam);

  // If no items exist for this city or forceRefresh requested, live-scrape on demand
  if (cityItems.length === 0 || forceRefresh) {
    console.log(`[API /api/catalog] Live loading fresh data for city: ${cityParam}`);

    const bmsCity = TOP_BMS_CITIES.find((c) => c.cityCode.toUpperCase() === cityParam) || TOP_BMS_CITIES[0];
    const districtCity = DISTRICT_CITIES.find((c) => c.cityCode.toUpperCase() === cityParam) || DISTRICT_CITIES[0];

    try {
      const [freshBms, freshDistrict] = await Promise.allSettled([
        scrapeBMSCatalog(bmsCity, 3),
        scrapeDistrictCatalog(districtCity, 3),
      ]);

      const newItems: CatalogItem[] = [];
      if (freshBms.status === 'fulfilled') newItems.push(...freshBms.value);
      if (freshDistrict.status === 'fulfilled') newItems.push(...freshDistrict.value);

      if (newItems.length > 0) {
        // Merge into catalogMap
        const map = new Map<string, CatalogItem>();
        catalog.forEach((item) => map.set(item.id, item));
        newItems.forEach((item) => map.set(item.id, item));

        catalog = Array.from(map.values());
        writeCatalog(catalog);

        cityItems = catalog.filter((item) => item.cityCode.toUpperCase() === cityParam);
      }
    } catch (err: any) {
      console.warn(`[API /api/catalog] Live scrape warning for ${cityParam}:`, err.message);
    }
  }

  // Filter by type if requested
  if (typeParam && typeParam !== 'all') {
    cityItems = cityItems.filter((item) => item.type === typeParam);
  }

  return NextResponse.json({
    success: true,
    city: cityParam,
    count: cityItems.length,
    data: cityItems,
    timestamp: new Date().toISOString(),
  });
}
