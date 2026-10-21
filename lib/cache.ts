import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { CatalogItem } from './types';

export interface CacheEntry<T> {
  data: T;
  savedAt: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface CityCatalogCacheResult {
  items: CatalogItem[];
  exists: boolean;
  isStale: boolean;
  ageSeconds: number;
}

const ONE_HOUR_SECONDS = 3600;

// Initialize Upstash Redis if environment credentials exist (supports standard Upstash and Vercel KV)
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.BEATROUTE_KV_REST_API_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.BEATROUTE_KV_REST_API_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (redis) {
  console.log('[CacheManager] Upstash Redis connected for distributed 1-hour TTL caching.');
} else {
  console.log('[CacheManager] Upstash credentials not found. Using in-memory & local catalog.json cache.');
}

// In-memory fallback cache (used locally or if Redis is not configured)
const memoryCache = new Map<string, CacheEntry<CatalogItem[]>>();
const memoryLocks = new Map<string, number>();

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'lib/data/catalog.json');

/**
 * Retrieve cached catalog for a city with SWR age calculation.
 */
export async function getCachedCityCatalog(cityCode: string): Promise<CityCatalogCacheResult> {
  const normalizedCity = cityCode.toUpperCase();
  const cacheKey = `city:${normalizedCity}:catalog`;
  const now = Date.now();

  // 1. Try Upstash Redis if available
  if (redis) {
    try {
      const raw = await redis.get(cacheKey);
      const entry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as CacheEntry<CatalogItem[]> | null;
      if (entry && Array.isArray(entry.data)) {
        const ageSeconds = Math.round((now - entry.savedAt) / 1000);
        const isStale = now >= entry.expiresAt;
        return {
          items: entry.data,
          exists: true,
          isStale,
          ageSeconds: Math.max(0, ageSeconds),
        };
      }
    } catch (err: any) {
      console.warn(`[CacheManager] Redis read error for ${cacheKey}:`, err.message);
    }
  }

  // 2. Fallback: In-memory cache
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry) {
    const ageSeconds = Math.round((now - memEntry.savedAt) / 1000);
    const isStale = now >= memEntry.expiresAt;
    return {
      items: memEntry.data,
      exists: true,
      isStale,
      ageSeconds,
    };
  }

  // 3. Fallback: Local catalog.json baseline file
  try {
    if (fs.existsSync(LOCAL_CATALOG_FILE)) {
      const raw = fs.readFileSync(LOCAL_CATALOG_FILE, 'utf-8');
      const allItems: CatalogItem[] = JSON.parse(raw);
      const filtered = allItems.filter((i) => {
        if (normalizedCity === 'ALL') return true;
        if (i.type === 'movie' && (!i.cityCode || i.cityCode.toUpperCase() === 'ALL')) return true;
        return i.cityCode && i.cityCode.toUpperCase() === normalizedCity;
      });

      if (filtered.length > 0) {
        // Cache in memory with initial timestamp
        const initialEntry: CacheEntry<CatalogItem[]> = {
          data: filtered,
          savedAt: now,
          expiresAt: now + ONE_HOUR_SECONDS * 1000,
        };
        memoryCache.set(cacheKey, initialEntry);

        return {
          items: filtered,
          exists: true,
          isStale: false,
          ageSeconds: 0,
        };
      }
    }
  } catch (err: any) {
    console.warn(`[CacheManager] Local file read error:`, err.message);
  }

  return {
    items: [],
    exists: false,
    isStale: true,
    ageSeconds: Infinity,
  };
}

/**
 * Cache catalog items for a city with a 1-hour TTL.
 */
export async function setCachedCityCatalog(
  cityCode: string,
  items: CatalogItem[],
  ttlSeconds: number = ONE_HOUR_SECONDS
): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const cacheKey = `city:${normalizedCity}:catalog`;
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  const entry: CacheEntry<CatalogItem[]> = {
    data: items,
    savedAt: now,
    expiresAt,
  };

  // 1. Write to Redis if available
  if (redis) {
    try {
      await redis.set(cacheKey, entry, { ex: ttlSeconds * 2 }); // Allow stale reads up to 2x TTL
    } catch (err: any) {
      console.warn(`[CacheManager] Redis write error for ${cacheKey}:`, err.message);
    }
  }

  // 2. Write to memory cache
  memoryCache.set(cacheKey, entry);

  // 3. Persist to local catalog.json to maintain baseline data
  try {
    let allItems: CatalogItem[] = [];
    if (fs.existsSync(LOCAL_CATALOG_FILE)) {
      const raw = fs.readFileSync(LOCAL_CATALOG_FILE, 'utf-8');
      allItems = JSON.parse(raw);
    }

    const map = new Map<string, CatalogItem>();
    allItems.forEach((i) => map.set(i.id, i));
    items.forEach((i) => map.set(i.id, i));

    fs.writeFileSync(LOCAL_CATALOG_FILE, JSON.stringify(Array.from(map.values()), null, 2), 'utf-8');
  } catch (err: any) {
    // Non-blocking in serverless environments
  }
}

/**
 * Acquire an atomic Mutex Lock to prevent duplicate concurrent background scrapers.
 * Returns true if lock was acquired, false if another scrape is already in progress.
 */
export async function acquireRevalidationLock(
  cityCode: string,
  lockSeconds: number = 45
): Promise<boolean> {
  const normalizedCity = cityCode.toUpperCase();
  const lockKey = `lock:revalidate:${normalizedCity}`;

  if (redis) {
    try {
      const result = await redis.set(lockKey, '1', {
        nx: true,
        ex: lockSeconds,
      });
      return result === 'OK';
    } catch (err: any) {
      console.warn(`[CacheManager] Redis lock error:`, err.message);
    }
  }

  // In-memory lock fallback
  const now = Date.now();
  const existingLockTime = memoryLocks.get(lockKey);
  if (existingLockTime && now < existingLockTime) {
    return false; // Already locked
  }

  memoryLocks.set(lockKey, now + lockSeconds * 1000);
  return true;
}

/**
 * Release revalidation lock when scrape completes.
 */
export async function releaseRevalidationLock(cityCode: string): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const lockKey = `lock:revalidate:${normalizedCity}`;

  if (redis) {
    try {
      await redis.del(lockKey);
    } catch (err: any) {
      console.warn(`[CacheManager] Redis unlock error:`, err.message);
    }
  }

  memoryLocks.delete(lockKey);
}

/**
 * Graceful degradation: extend cache TTL by 15 minutes if a scrape fails.
 */
export async function extendCacheTTL(
  cityCode: string,
  extendSeconds: number = 900
): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const cacheKey = `city:${normalizedCity}:catalog`;

  const current = await getCachedCityCatalog(normalizedCity);
  if (current.exists && current.items.length > 0) {
    await setCachedCityCatalog(normalizedCity, current.items, extendSeconds);
    console.log(`[CacheManager] Gracefully extended cache for ${normalizedCity} by ${extendSeconds}s.`);
  }
}
