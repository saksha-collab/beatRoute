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

/**
 * Fetch HTML content prioritizing anyIP residential proxy, falling back to ScraperAPI.
 */
export async function fetchHtmlWithFallback(targetUrl: string, timeoutMs = 30000): Promise<string> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
  };

  // 1. Try anyIP residential proxy first if configured
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

      console.warn(`[ProxyClient] anyIP returned HTTP ${res.status} for ${targetUrl}. Falling back to ScraperAPI...`);
    } catch (err: any) {
      console.warn(`[ProxyClient] anyIP fetch error for ${targetUrl}: ${err.message}. Falling back to ScraperAPI...`);
    }
  }

  // 2. Fallback to ScraperAPI
  if (scraperApiKey) {
    const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&country_code=in&url=${encodeURIComponent(targetUrl)}`;
    const res = await undiciFetch(scraperUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
    });

    if (res.ok) {
      return await res.text();
    }
    throw new Error(`ScraperAPI error HTTP ${res.status}: ${res.statusText}`);
  }

  // 3. Direct fetch as last resort
  console.warn(`[ProxyClient] No proxies available. Attempting direct connection for ${targetUrl}...`);
  const directRes = await undiciFetch(targetUrl, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!directRes.ok) {
    throw new Error(`Direct fetch HTTP ${directRes.status}: ${directRes.statusText}`);
  }
  return await directRes.text();
}
