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

const TWELVE_HOURS_SECONDS = 12 * 3600;
const CACHE_SCHEMA_VERSION = 'v2';

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

// In-memory fallback cache
const memoryCache = new Map<string, CacheEntry<CatalogItem[]>>();
const memoryLocks = new Map<string, number>();

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'lib/data/catalog.json');

/**
 * Retrieve cached catalog for a city with versioned key (city:v2:CODE:catalog)
 * so legacy pre-deduplication Redis entries are automatically bypassed.
 */
export async function getCachedCityCatalog(cityCode: string): Promise<CityCatalogCacheResult> {
  const normalizedCity = cityCode.toUpperCase();
  const cacheKey = `city:${CACHE_SCHEMA_VERSION}:${normalizedCity}:catalog`;
  const now = Date.now();

  // 1. Try Upstash Redis if available
  if (redis) {
    try {
      const entry = (await redis.get(cacheKey)) as CacheEntry<CatalogItem[]> | null;
      if (entry && Array.isArray(entry.data) && entry.data.length > 0) {
        const ageSeconds = Math.round((now - entry.savedAt) / 1000);
        const isStale = now >= entry.expiresAt;
        return {
          items: entry.data,
          exists: true,
          isStale,
          ageSeconds,
        };
      }
    } catch (err: any) {
      console.warn(`[CacheManager] Redis read error for ${cacheKey}:`, err.message);
    }
  }

  // 2. Fallback: In-memory cache
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry && memEntry.data.length > 0) {
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
        if (i.type === 'movie' && (!i.cityCode || i.cityCode.toUpperCase() === 'ALL')) {
          return true;
        }
        return i.cityCode && i.cityCode.toUpperCase() === normalizedCity;
      });

      if (filtered.length > 0) {
        const initialEntry: CacheEntry<CatalogItem[]> = {
          data: filtered,
          savedAt: now,
          expiresAt: now + TWELVE_HOURS_SECONDS * 1000,
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
 * Cache catalog items for a city with a 12-hour TTL under the v2 schema namespace.
 */
export async function setCachedCityCatalog(
  cityCode: string,
  items: CatalogItem[],
  ttlSeconds: number = TWELVE_HOURS_SECONDS
): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const cacheKey = `city:${CACHE_SCHEMA_VERSION}:${normalizedCity}:catalog`;
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  const entry: CacheEntry<CatalogItem[]> = {
    data: items,
    savedAt: now,
    expiresAt,
  };

  if (redis) {
    try {
      await redis.set(cacheKey, entry, { ex: ttlSeconds * 2 });
    } catch (err: any) {
      console.warn(`[CacheManager] Redis write error for ${cacheKey}:`, err.message);
    }
  }

  memoryCache.set(cacheKey, entry);
}

export async function acquireRevalidationLock(
  cityCode: string,
  lockSeconds: number = 45
): Promise<boolean> {
  const normalizedCity = cityCode.toUpperCase();
  const lockKey = `lock:${CACHE_SCHEMA_VERSION}:${normalizedCity}`;

  if (redis) {
    try {
      const result = await redis.set(lockKey, '1', {
        nx: true,
        ex: lockSeconds,
      });
      return result === 'OK';
    } catch {}
  }

  const now = Date.now();
  const existingLockTime = memoryLocks.get(lockKey);
  if (existingLockTime && now < existingLockTime) {
    return false;
  }

  memoryLocks.set(lockKey, now + lockSeconds * 1000);
  return true;
}

export async function releaseRevalidationLock(cityCode: string): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const lockKey = `lock:${CACHE_SCHEMA_VERSION}:${normalizedCity}`;

  if (redis) {
    try {
      await redis.del(lockKey);
    } catch {}
  }

  memoryLocks.delete(lockKey);
}

export async function extendCacheTTL(
  cityCode: string,
  extendSeconds: number = 900
): Promise<void> {
  const normalizedCity = cityCode.toUpperCase();
  const current = await getCachedCityCatalog(normalizedCity);
  if (current.exists && current.items.length > 0) {
    await setCachedCityCatalog(normalizedCity, current.items, extendSeconds);
  }
}
