"use client";

import useSWR from 'swr';
import { CatalogItem } from '@/lib/types';

interface CatalogApiResponse {
  success: boolean;
  city: string;
  cityName: string;
  cacheStatus: 'HIT_FRESH' | 'HIT_STALE' | 'MISS_COLD' | 'REFRESHED' | 'FALLBACK_STALE';
  isStale: boolean;
  ageSeconds: number;
  ttlRemainingSeconds?: number;
  revalidating?: boolean;
  count: number;
  data: CatalogItem[];
  error?: string;
}

const fetcher = async (url: string): Promise<CatalogApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load catalog: HTTP ${res.status}`);
  }
  return res.json();
};

export function useCityCatalog(cityCode: string = 'BOM', type: string = 'all') {
  const queryUrl = `/api/catalog?city=${encodeURIComponent(cityCode)}&type=${encodeURIComponent(type)}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<CatalogApiResponse>(
    queryUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 15000, // 15s client deduping
    }
  );

  const forceRefresh = () => {
    return mutate(fetcher(`${queryUrl}&refresh=true`));
  };

  const ageMinutes = data?.ageSeconds ? Math.floor(data.ageSeconds / 60) : 0;

  return {
    items: data?.data || [],
    cityName: data?.cityName || cityCode,
    cacheStatus: data?.cacheStatus,
    isStale: data?.isStale ?? false,
    ageMinutes,
    isLoading,
    isValidating,
    error: error?.message || data?.error,
    refresh: forceRefresh,
  };
}
