import { ProxyAgent, fetch as undiciFetch } from 'undici';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const anyIpProxyUrl = process.env.ANYIP_PROXY_URL;
const scraperApiKey = process.env.SCRAPER_API_KEY;

let proxyDispatcher: ProxyAgent | null = null;
if (anyIpProxyUrl) {
  try {
    proxyDispatcher = new ProxyAgent(anyIpProxyUrl);
    console.log('[ProxyClient] Initialized anyIP Residential Proxy dispatcher.');
  } catch (err: any) {
    console.warn('[ProxyClient] Failed to initialize anyIP dispatcher:', err.message);
  }
}

export interface FetchOptions {
  render?: boolean;              // Headless Chromium rendering via ScraperAPI (bypasses Cloudflare & dynamic JS)
  waitForSelector?: string;      // CSS selector to wait for (e.g. 'a[href*="/events/"]')
  countryCode?: string;          // Geolocation (default: 'in')
  timeoutMs?: number;            // Request timeout in milliseconds
  premium?: boolean;             // Residential IP pool for bot-heavy domains
  headers?: Record<string, string>;
}

const DEFAULT_BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
  'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

/**
 * Builds the ScraperAPI URL with anti-bot options (render=true for Cloudflare bypass, country_code=in).
 */
export function buildScraperApiUrl(targetUrl: string, options: FetchOptions = {}): string {
  const params = new URLSearchParams();
  if (scraperApiKey) {
    params.set('api_key', scraperApiKey);
  }
  params.set('url', targetUrl);
  params.set('country_code', options.countryCode || 'in');

  if (options.render) {
    params.set('render', 'true');
  }
  if (options.waitForSelector) {
    params.set('wait_for_selector', options.waitForSelector);
  }
  if (options.premium) {
    params.set('premium', 'true');
  }

  return `https://api.scraperapi.com?${params.toString()}`;
}

/**
 * Fetch HTML content with resilient multi-tier fallback:
 * 1. If `render: true` or anti-bot target: Use ScraperAPI with headless Chromium (`render=true`, `country_code=in`).
 * 2. If residential proxy configured: Use anyIP proxy.
 * 3. Fallback to direct fetch with authentic browser headers.
 */
export async function fetchHtmlWithFallback(
  targetUrl: string,
  optionsOrTimeout: FetchOptions | number = {}
): Promise<string> {
  const options: FetchOptions =
    typeof optionsOrTimeout === 'number'
      ? { timeoutMs: optionsOrTimeout }
      : optionsOrTimeout;

  const timeoutMs = options.timeoutMs || (options.render ? 60000 : 30000);
  const headers = { ...DEFAULT_BROWSER_HEADERS, ...(options.headers || {}) };

  // Tier 1: When JavaScript rendering / Cloudflare bypass is explicitly requested, prioritize ScraperAPI
  if (options.render && scraperApiKey) {
    try {
      const scraperUrl = buildScraperApiUrl(targetUrl, options);
      console.log(`[ScraperAPI] Requesting JS-rendered page for ${targetUrl} (render=true, country=in)...`);
      const res = await undiciFetch(scraperUrl, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
      });

      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 500) {
          return text;
        }
      }

      const bodyText = await res.text().catch(() => '');
      if (res.status === 403 && bodyText.includes('exhausted the API Credits')) {
        console.warn(
          `[ScraperAPI] Monthly credits exhausted (HTTP 403). Refill at https://dashboard.scraperapi.com/billing. Falling back to residential proxy/direct...`
        );
      } else {
        console.warn(`[ScraperAPI] HTTP ${res.status}: ${res.statusText}. Falling back...`);
      }
    } catch (err: any) {
      console.warn(`[ScraperAPI] Render fetch failed for ${targetUrl}: ${err.message}. Falling back...`);
    }
  }

  // Tier 2: anyIP residential proxy
  if (proxyDispatcher) {
    try {
      const res = await undiciFetch(targetUrl, {
        dispatcher: proxyDispatcher,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) {
        return await res.text();
      }

      console.warn(`[ProxyClient] anyIP returned HTTP ${res.status} for ${targetUrl}. Falling back...`);
    } catch (err: any) {
      console.warn(`[ProxyClient] anyIP fetch error for ${targetUrl}: ${err.message}. Falling back...`);
    }
  }

  // Tier 3: Standard ScraperAPI (without render if not already tried)
  if (!options.render && scraperApiKey) {
    try {
      const scraperUrl = buildScraperApiUrl(targetUrl, options);
      const res = await undiciFetch(scraperUrl, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
      });

      if (res.ok) {
        return await res.text();
      }

      console.warn(`[ScraperAPI] Standard fetch returned HTTP ${res.status}. Falling back to direct...`);
    } catch (err: any) {
      console.warn(`[ScraperAPI] Standard fetch error for ${targetUrl}: ${err.message}. Falling back to direct...`);
    }
  }

  // Tier 4: Direct connection with authentic browser headers
  console.warn(`[ProxyClient] Attempting direct browser connection for ${targetUrl}...`);
  const directRes = await undiciFetch(targetUrl, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!directRes.ok) {
    throw new Error(`Direct fetch HTTP ${directRes.status}: ${directRes.statusText}`);
  }

  return await directRes.text();
}
