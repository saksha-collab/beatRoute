import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CatalogItem } from '@/lib/types';
import { deduplicateCatalog } from '@/lib/deduplicate';
import { getCachedCityCatalog, setCachedCityCatalog } from '@/lib/cache';
import { resolveCityCode, getCityName } from '@/lib/location';
import { sanitizeCatalogItem } from '@/scraper/index';

export const dynamic = 'force-dynamic';

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'lib/data/catalog.json');

function filterAndDeduplicate(
  items: CatalogItem[],
  cityCode: string,
  typeParam?: string | null
): CatalogItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const normalizedCity = cityCode.toUpperCase();

  const sanitized = items.map(sanitizeCatalogItem);
  const deduplicated = deduplicateCatalog(sanitized);

  let list = deduplicated.filter((item) => {
    const matchesCity =
      normalizedCity === 'ALL' ||
      (item.cityCode && item.cityCode.toUpperCase() === normalizedCity);
    if (!matchesCity) return false;

    if (item.type === 'movie') {
      return !item.date || item.date >= thirtyDaysAgo;
    }
    return !item.date || item.date >= today;
  });

  if (typeParam && typeParam !== 'all') {
    list = list.filter((i) => i.type === typeParam);
  }

  return list;
}

/**
 * Fast, Read-Only Catalog Endpoint (<30ms response).
 * Never blocks user HTTP requests on live web scraping—reads exclusively from
 * Upstash Redis or the verified `lib/data/catalog.json` snapshot produced by `npm run scrape`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rawCity = searchParams.get('city') || request.headers.get('x-vercel-ip-city') || 'PNQ';
  const cityCode = rawCity.toUpperCase() === 'ALL' ? 'ALL' : resolveCityCode(rawCity, 'PNQ');
  const typeParam = searchParams.get('type');

  // 1. Check Redis / In-Memory Cache first
  if (cityCode !== 'ALL') {
    const cacheResult = await getCachedCityCatalog(cityCode);
    if (cacheResult.exists && cacheResult.items.length > 0) {
      const filtered = filterAndDeduplicate(cacheResult.items, cityCode, typeParam);
      return NextResponse.json({
        success: true,
        city: cityCode,
        cityName: getCityName(cityCode),
        cacheStatus: cacheResult.isStale ? 'HIT_STALE' : 'HIT_FRESH',
        isStale: cacheResult.isStale,
        ageSeconds: cacheResult.ageSeconds,
        count: filtered.length,
        data: filtered,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 2. Fallback: Read directly from local verified catalog.json snapshot
  try {
    if (fs.existsSync(LOCAL_CATALOG_FILE)) {
      const raw = fs.readFileSync(LOCAL_CATALOG_FILE, 'utf-8');
      const allItems: CatalogItem[] = JSON.parse(raw);
      const filtered = filterAndDeduplicate(allItems, cityCode, typeParam);

      if (cityCode !== 'ALL' && filtered.length > 0) {
        await setCachedCityCatalog(cityCode, filtered, 12 * 3600);
      }

      return NextResponse.json({
        success: true,
        city: cityCode,
        cityName: cityCode === 'ALL' ? 'All India' : getCityName(cityCode),
        cacheStatus: 'HIT_SNAPSHOT',
        isStale: false,
        ageSeconds: 0,
        count: filtered.length,
        data: filtered,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error(`[CatalogAPI] Snapshot read error for ${cityCode}:`, err.message);
  }

  return NextResponse.json({
    success: true,
    city: cityCode,
    cityName: cityCode === 'ALL' ? 'All India' : getCityName(cityCode),
    cacheStatus: 'EMPTY',
    isStale: false,
    ageSeconds: 0,
    count: 0,
    data: [],
    timestamp: new Date().toISOString(),
  });
}
