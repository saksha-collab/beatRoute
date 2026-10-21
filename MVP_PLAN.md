# BeatRoute 2.0 — Indian Entertainment Aggregator MVP Plan

## 1. Market Reality & Product Refocus

Based on how the Indian entertainment and ticketing ecosystem operates, **Movies** and **Live Events/Concerts** follow two completely different supply-chain models:

1. **Movies are Non-Exclusive (Checkout & Card Offer Problem):**
   - Major multiplexes (PVR INOX, Cinépolis, City Pride, etc.) list the exact same showtimes and base seat prices across **BookMyShow**, **District by Zomato**, and their **Direct Cinema Apps**.
   - However, the final payable amount varies by **₹100 to ₹350+ per booking** due to **Internet Handling / Convenience Fees** (~₹30–₹100/ticket + 18% GST) and **Bank Credit/Debit Card BOGO & Discount Offers** (e.g., ICICI Sapphiro, Axis MyZone, IDFC First, HDFC Diners).
2. **Live Concerts & Events are Mostly Exclusive (Discovery & Phase-Pricing Problem):**
   - Marquee concerts and festivals (Lollapalooza India, Sunburn, Coldplay, Zomato Feeding India Concert) lock in exclusive ticketing and co-production deals with either **BookMyShow Live** or **District**.
   - Smaller indie, electronic, and comedy gigs fragment across **BookMyShow**, **District**, **SortMyScene**, **SkillBox**, and **Swiggy Scenes**.
   - Furthermore, platforms display the lowest **Early Bird** price (`From ₹699`) on listing cards even when Early Bird and Phase 1 tiers are completely sold out and only `Phase 3 (₹1,999)` remains.

---

## 2. Codebase Audit: What to Keep, Refactor, and Cut

The current `beatroute` repository mixes an older **IRCTC/Flight Travel Arbitrage Engine** with a **BookMyShow + District Scraper**. To build a clean, focused Indian Entertainment Aggregator, we will streamline the codebase as follows:

| Current Module / Files | Action | Why |
| :--- | :--- | :--- |
| `app/tokens.css`, `components/ui/*`, `lib/cache.ts`, `lib/location.ts` | **Keep** | Clean design tokens, `nuqs` URL state sync, Upstash Redis caching, and city hub coordinates are well-built and reusable. |
| `scraper/platforms/bms.ts`, `scraper/platforms/district.ts`, `scraper/client.ts`, `scraper/index.ts` | **Refactor** | Fix 4 critical data bugs: (1) BMS concerts saved as `type: 'event'` instead of `'concert'`, (2) Sold-out Early Bird prices shown as `startingPriceINR`, (3) `[object Object]` address bug causing Mumbai festivals to resolve to Pune/Hyderabad, and (4) hardcoded fake movie prices (`₹250` on BMS vs `₹199` on District). |
| `components/discovery/*` (`hybrid-aggregator-feed.tsx`, `aggregator-card.tsx`, `sticky-preview-panel.tsx`) | **Refactor** | Upgrade from 1-to-1 raw scraper cards to **Merged Multi-Platform Entities** with side-by-side platform badges, active tier progression, and the Movie Checkout Calculator. |
| `lib/arbitrage.ts`, `lib/data/rail-fares.ts`, `lib/data/all-concerts.ts`, `lib/mock-data.ts`, `components/matrix/*`, `components/planner/*`, `components/search/*` | **Remove** | Removes legacy train/flight/hotel travel arbitrage bloat (~40% of files) so the app is 100% focused on entertainment discovery and price/offer comparison. |
| `components/feed/*`, `lib/data/events.json`, `scraper/platforms/zomato.ts` | **Remove** | Unused legacy feed components and redundant `zomato.ts` re-export. |

---

## 3. Target Clean Directory Structure

```text
beatroute/
├── app/
│   ├── api/catalog/route.ts         # Serves deduplicated, city-filtered entertainment catalog
│   ├── layout.tsx                   # Root layout + NuqsAdapter
│   ├── page.tsx                     # Focused 3-Tab Dashboard: Concerts, Movies, Comedy & Events
│   ├── globals.css
│   └── tokens.css
├── components/
│   ├── ui/                          # Reusable primitives (Button, Card, Badge, Sheet, Skeleton, Tabs)
│   ├── navigation/                  # HeaderNav (City Switcher + My Cards Wallet Pill), CitySelectorModal
│   ├── discovery/
│   │   ├── hybrid-aggregator-feed.tsx
│   │   ├── aggregator-card.tsx      # Shows Exclusive vs. Multi-Platform badges & real active price
│   │   ├── aggregator-search-bar.tsx
│   │   ├── category-tabs.tsx        # Concerts | Movies | Comedy & Events
│   │   └── sticky-preview-panel.tsx # Context-aware right panel (Tier Breakdown OR Movie Checkout Calculator)
│   ├── calculators/
│   │   ├── movie-checkout-calculator.tsx # Compares BMS vs District vs Direct Multiplex (PVR/Cinépolis)
│   │   └── card-wallet-selector.tsx      # Saves user's bank cards in localStorage (names only, zero PCI risk)
│   └── map/
│       └── venue-mini-map.tsx       # Lightweight CartoDB Dark Matter map for event venues
├── lib/
│   ├── types.ts                     # Clean domain types (CatalogItem, UnifiedEntity, PlatformOffer, BankCardOffer)
│   ├── deduplicate.ts               # Cross-platform fuzzy title + city matcher (merges BMS + District)
│   ├── movie-pricing.ts             # Convenience fee + GST + Credit Card BOGO/Discount math engine
│   ├── location.ts                  # Supported Indian cities (PNQ, BOM, BLR, DEL, HYD, CCU, AMD)
│   ├── cache.ts                     # Upstash Redis caching
│   └── data/
│       ├── catalog.json             # Normalized live scraped catalog
│       └── bank-offers.ts           # Curated Indian credit/debit card offers for BMS, District & PVR
└── scraper/
    ├── client.ts                    # HTML fetcher with proxy fallback
    ├── index.ts                     # Unified scraper runner
    └── platforms/
        ├── bms.ts                   # BookMyShow scraper (Concerts, Events, Movies)
        └── district.ts              # District by Zomato scraper (Concerts, Events, Movies)
```

---

## 4. Step-by-Step MVP Execution Plan (One by One)

### Step 1: Codebase Cleanup & Cross-Platform Deduplication Engine
- **Goal:** Strip out the travel/rail arbitrage modules and create a clean data model where identical movies or shared events across BookMyShow and District merge into a single entity.
- **Deliverables:**
  1. Remove unused travel arbitrage files (`lib/arbitrage.ts`, `lib/data/rail-fares.ts`, `components/matrix/`, `components/planner/`, `components/feed/`, `scraper/platforms/zomato.ts`).
  2. Update `lib/types.ts` to introduce `PlatformSourceListing` (holding per-platform `bookingUrl`, `startingPriceINR`, `ticketTiers`, and `exclusive: boolean`) inside a unified item model.
  3. Create `lib/deduplicate.ts` to normalize titles (stripping punctuation/subtitles like `"Drishyam: The Conclusion"` vs `"Drishyam The Conclusion"`) and merge matching items in the same city into a single card with both `BookMyShow` and `District` links.

### Step 2: Fix BMS & District Scrapers + "True Active Phase Pricing" (Concerts & Events)
- **Goal:** Ensure live event discovery is 100% accurate and eliminates the "From ₹699 (Sold Out)" bait-and-switch.
- **Deliverables:**
  1. **Fix Concert Classification in `scraper/platforms/bms.ts`:** Tag music shows and concerts as `type: 'concert'` instead of `type: 'event'`, and add a comedy/workshop discovery pass for `type: 'event'`.
  2. **Fix City Resolution in `scraper/platforms/bms.ts`:** Extract `eventSchema.location?.address?.addressLocality` properly instead of coercing an object to `"[object Object]"`, preventing Mumbai festivals (like Anyma or Sunburn at Mahalaxmi Race Course) from being assigned to Pune or Hyderabad.
  3. **Compute Real Active Starting Price:** Calculate `startingPriceINR` from the **lowest tier with `availability === 'available'`** (whilst preserving sold-out Early Bird tiers in `ticketTiers` so the UI can show price progression), and mark the event `sold_out` if all tiers are exhausted.
  4. **Remove Hardcoded Fake Movie Prices:** Stop injecting fake `250` (BMS) and `199` (District) prices into movie items so movie cards route cleanly into the Checkout Calculator.

### Step 3: Build the "Smart Movie Checkout & Card Offer Calculator" (Movies Tab)
- **Goal:** Give moviegoers a real reason to open BeatRoute before booking any movie ticket in India.
- **Deliverables:**
  1. Create `lib/data/bank-offers.ts` with verified Indian card rules (e.g., ICICI Sapphiro BOGO up to ₹500 on BMS, Axis MyZone BOGO up to ₹200 on District, IDFC First Wealth/Select offers, HDFC Diners/Times Card, and Direct PVR INOX / Cinépolis app perks).
  2. Create `lib/movie-pricing.ts` to compute net payable checkout totals across **BookMyShow**, **District**, and **Direct Multiplex App (PVR INOX / Cinépolis)**:
     $$	ext{Net Payable} = (	ext{Base Ticket} 	imes 	ext{Qty}) + (	ext{Platform Convenience Fee} 	imes 1.18	ext{ GST}) - 	ext{Applicable Card Discount}$$
  3. Build `components/calculators/movie-checkout-calculator.tsx` inside the right-hand `StickyPreviewPanel` whenever a user selects a Movie—complete with a 1-click **"My Cards" selector** stored in `localStorage`.

### Step 4: Upgrade the Unified Discovery Feed & Preview Panel UI
- **Goal:** Bring the merged data, concert tier progression bar, and movie fee calculator together in a fast, zero-clutter interface.
- **Deliverables:**
  1. Update `components/discovery/aggregator-card.tsx` to display **Platform Badges** (`BookMyShow` + `District` side-by-side when available on both, or `BMS Exclusive` / `District Exclusive` for locked live shows) and accurate status pills (`Selling Fast`, `Phase 2 Active`, `Compare Checkout`).
  2. Update `components/discovery/sticky-preview-panel.tsx` to render:
     - **For Concerts & Events:** A visual **Phase & Tier Progression List** showing which early phases are sold out, the lowest currently playable tier, venue location details, and direct booking links for every platform carrying the show.
     - **For Movies:** The interactive **Movie Checkout & Card Calculator** with direct booking links to BookMyShow, District, and PVR/Cinépolis.
  3. Clean up `app/page.tsx` and `components/discovery/category-tabs.tsx` into a crisp 3-tab experience (`Concerts & Music`, `Movies & Cinema`, `Comedy & Live Events`) with Pune (`PNQ`), Mumbai (`BOM`), Bengaluru (`BLR`), Delhi NCR (`DEL`), Hyderabad (`HYD`), Kolkata (`CCU`), and Ahmedabad (`AMD`) support.

---

## 5. Post-MVP (Phase 2) Extensions
- **Indie & Nightlife Scrapers (`skillbox.ts` & `sortmyscene.ts`):** Add scrapers for SkillBox and SortMyScene to capture techno, underground, and club gigs in Pune, Mumbai, and Bengaluru that aren't listed on BookMyShow or District.
- **Swiggy Scenes Integration (`swiggy-scenes.ts`):** Add restaurant live gigs and weekend party listings.
