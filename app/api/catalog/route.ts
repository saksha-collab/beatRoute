import { NextRequest, NextResponse } from 'next/server';
import { CatalogItem } from '@/lib/types';
import {
  getCachedCityCatalog,
  setCachedCityCatalog,
  acquireRevalidationLock,
  releaseRevalidationLock,
  extendCacheTTL,
} from '@/lib/cache';
import { resolveCityCode, getCityName } from '@/lib/location';
import { TOP_BMS_CITIES, scrapeBMSCatalog } from '@/scraper/platforms/bms';
import { DISTRICT_CITIES, scrapeDistrictCatalog } from '@/scraper/platforms/district';

export const dynamic = 'force-dynamic';

/**
 * Execute live scraping for BMS and District for a given city code.
 */
async function scrapeCityFresh(cityCode: string): Promise<CatalogItem[]> {
  const bmsCity =
    TOP_BMS_CITIES.find((c) => c.cityCode.toUpperCase() === cityCode.toUpperCase()) ||
    TOP_BMS_CITIES[0];
  const districtCity =
    DISTRICT_CITIES.find((c) => c.cityCode.toUpperCase() === cityCode.toUpperCase()) ||
    DISTRICT_CITIES[0];

  console.log(`[ScrapeEngine] Triggering live scrape for ${cityCode} (${getCityName(cityCode)})...`);

  const [bmsResult, districtResult] = await Promise.allSettled([
    scrapeBMSCatalog(bmsCity, 3),
    scrapeDistrictCatalog(districtCity, 3),
  ]);

  const items: CatalogItem[] = [];
  if (bmsResult.status === 'fulfilled') items.push(...bmsResult.value);
  if (districtResult.status === 'fulfilled') items.push(...districtResult.value);

  return items;
}

function filterActiveItems(items: CatalogItem[], typeParam?: string | null): CatalogItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let list = items.filter((item) => {
    if (item.type === 'movie') {
      if (item.date && item.date < thirtyDaysAgo) return false;
      return true;
    }
    if (!item.date) return true;
    return item.date >= today;
  });
  if (typeParam && typeParam !== 'all') {
    list = list.filter((i) => i.type === typeParam);
  }
  return list;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Resolve Location: Query param > Vercel Edge IP header > Default BOM
  const rawCity = searchParams.get('city') || request.headers.get('x-vercel-ip-city');
  const cityCode = resolveCityCode(rawCity);
  const typeParam = searchParams.get('type'); // 'all' | 'movie' | 'event' | 'concert'
  const forceRefresh = searchParams.get('refresh') === 'true';

  // 2. Check 1-Hour TTL Cache
  const cacheResult = await getCachedCityCatalog(cityCode);

  // SCENARIO A: Fresh Cache Hit (< 1 Hour Old)
  if (cacheResult.exists && !cacheResult.isStale && !forceRefresh) {
    const filtered = filterActiveItems(cacheResult.items, typeParam);

    return NextResponse.json({
      success: true,
      city: cityCode,
      cityName: getCityName(cityCode),
      cacheStatus: 'HIT_FRESH',
      isStale: false,
      ageSeconds: cacheResult.ageSeconds,
      ttlRemainingSeconds: Math.max(0, 3600 - cacheResult.ageSeconds),
      count: filtered.length,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  }

  // SCENARIO B: Stale Cache Hit (> 1 Hour Old) -> SWR Background Revalidation
  if (cacheResult.exists && cacheResult.isStale && !forceRefresh) {
    // Attempt to acquire Mutex lock for background revalidation
    acquireRevalidationLock(cityCode, 60).then(async (acquired) => {
      if (acquired) {
        try {
          console.log(`[SWR] Acquired lock for ${cityCode}. Revalidating in background...`);
          const freshItems = await scrapeCityFresh(cityCode);
          if (freshItems.length > 0) {
            await setCachedCityCatalog(cityCode, freshItems, 3600);
            console.log(`[SWR] Successfully updated ${cityCode} cache with ${freshItems.length} fresh items.`);
          }
        } catch (err: any) {
          console.warn(`[SWR] Background scrape failed for ${cityCode}:`, err.message);
          await extendCacheTTL(cityCode, 900); // Extend by 15 mins on error
        } finally {
          await releaseRevalidationLock(cityCode);
        }
      } else {
        console.log(`[SWR] Revalidation lock already held for ${cityCode}. Skipping duplicate scrape.`);
      }
    });

    const filtered = filterActiveItems(cacheResult.items, typeParam);

    // Return existing data immediately to client with SWR flag
    return NextResponse.json({
      success: true,
      city: cityCode,
      cityName: getCityName(cityCode),
      cacheStatus: 'HIT_STALE',
      isStale: true,
      ageSeconds: cacheResult.ageSeconds,
      revalidating: true,
      count: filtered.length,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  }

  // SCENARIO C: Cold City (Never cached before) OR Force Refresh
  console.log(`[Cache] Cold request for ${cityCode}. Awaiting initial scrape...`);
  const lockAcquired = await acquireRevalidationLock(cityCode, 60);

  try {
    const freshItems = await scrapeCityFresh(cityCode);
    if (freshItems.length > 0) {
      await setCachedCityCatalog(cityCode, freshItems, 3600);
    }

    const filtered = filterActiveItems(freshItems, typeParam);

    return NextResponse.json({
      success: true,
      city: cityCode,
      cityName: getCityName(cityCode),
      cacheStatus: forceRefresh ? 'REFRESHED' : 'MISS_COLD',
      isStale: false,
      ageSeconds: 0,
      ttlRemainingSeconds: 3600,
      count: filtered.length,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`[Scraper] Initial scrape failed for ${cityCode}:`, err.message);

    // Fall back to any stale data if available
    if (cacheResult.items.length > 0) {
      await extendCacheTTL(cityCode, 900);
      return NextResponse.json({
        success: true,
        city: cityCode,
        cityName: getCityName(cityCode),
        cacheStatus: 'FALLBACK_STALE',
        isStale: true,
        count: cacheResult.items.length,
        data: cacheResult.items,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        city: cityCode,
        error: `Could not fetch events for ${getCityName(cityCode)}: ${err.message}`,
      },
      { status: 502 }
    );
  } finally {
    if (lockAcquired) {
      await releaseRevalidationLock(cityCode);
    }
  }
}
