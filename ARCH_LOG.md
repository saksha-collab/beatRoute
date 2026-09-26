# BeatRoute — Architectural Audit Log (ARCH_LOG.md)

This log documents all key architectural decisions, rationale, trade-offs, and interview defenses for BeatRoute (The Concert Travel Arbitrage Engine).

---

### [ADR-001] Next.js App Router & Suspense Streaming Architecture
- **Date**: 2026-09-23
- **Context**: BeatRoute aggregates multiple disparate data points (event ticket tiers, curated rail fares, flight quotes, lodging baselines, local cab transit) to calculate real-time net travel arbitrage. Rendering everything client-side causes noticeable waterfall latency and Cumulative Layout Shift (CLS), while traditional monolithic SSR blocks Time-to-First-Byte (TTFB) on slow flight external calls.
- **Decision**: Next.js App Router with React 19 Server Components and Suspense streaming boundaries. Immediate baseline metrics and UI shells render instantly, while asynchronous travel price fetches stream into slotted cards with fixed-dimension skeleton states to guarantee zero CLS.
- **Alternatives Considered & Rejected**:
  - *Pure Client-Side SPA (Vite/React)*: High client bundle size, waterfall data fetching, poor initial load performance, exposure of API keys, and layout shifts during asynchronous state loading.
  - *Traditional Monolithic SSR (Pages Router)*: TTFB would be gated on the slowest external API response (e.g., flight API), increasing perceived latency beyond 1–2 seconds.
- **Interview Defense**: "We adopted Next.js App Router with Suspense streaming to eliminate the trade-off between fast TTFB and dynamic server-side aggregation. By streaming external pricing cards into fixed-height skeletons while serving the deterministic rail baseline instantly, we achieve sub-second perceived latency and strictly 0 CLS without paying for heavy edge compute."
- **Status**: Accepted

---

### [ADR-002] URL Search Params as Single Source of Truth via nuqs
- **Date**: 2026-09-23
- **Context**: Arbitrage calculation tools require heavy parametric state (origin city, selected artist/tour, transit mode [flight vs rail], rail class [SL, 3AC, 2AC], ticket tier, lodging preferences). Users share links, bookmark deals, and use browser back/forward buttons. Client-only state (e.g., useState/Zustand) breaks deep-linking and causes hydration mismatches when rehydrating server components.
- **Decision**: Utilize `nuqs` (Type-safe search params state manager for Next.js) to treat the URL query string as the canonical single source of truth for all filtering and arbitrage inputs.
- **Alternatives Considered & Rejected**:
  - *React useState / Context*: State is lost on refresh or share; requires complex manual synchronization with URL.
  - *Native Next.js useRouter / useSearchParams with manual router.push*: High boilerplate, prone to race conditions, scroll jumps, and lack of runtime parser validation and type safety.
  - *Redux / Zustand with URL serialization middleware*: Unnecessary client runtime overhead for a server-friendly parameter model.
- **Interview Defense**: "By modeling our entire application state in URL search params using `nuqs`, we ensure 100% shareable deep links, frictionless browser navigation (back/forward cache compatibility), and zero hydration mismatch between server-streamed content and client controls."
- **Status**: Accepted

---

### [ADR-003] Deterministic Curated Rail Fare Matrix over Brittle IRCTC Scraping
- **Date**: 2026-09-23
- **Context**: Indian Railways (IRCTC) does not provide a public, free, reliable API. Third-party scraping services and unofficial wrappers are notoriously brittle, subject to frequent captchas, IP blocks, unpredictable downtime, and high latency (3–8 seconds per query), which directly violates our sub-second perceived latency and $0 operational budget requirements.
- **Decision**: Implement a curated, deterministic static rail engine (`/lib/data/rail-fares.ts`) covering major Indian concert origin-destination corridors (BOM, DEL, BLR, IDR, IXC, PNQ, etc.) with verified standard distance/class fare tiers (Sleeper, 3AC, 2AC, Tejas/Vande Bharat) and realistic train durations.
- **Alternatives Considered & Rejected**:
  - *Unofficial IRCTC Scrapers / RapidAPI endpoints*: Unreliable, rate-limited, high risk of sudden breakage, and potential IP blacklisting or legal/TOS issues.
  - *Full Mock Randomizer*: Lacks domain realism (e.g. pricing discrepancies that violate actual Indian Railways distance slabs) and hurts portfolio credibility.
- **Interview Defense**: "We prioritized availability, zero latency, and $0 infrastructure cost over brittle dynamic scraping for Indian rail. By curating a deterministic fare matrix based on actual Indian Railways telescopic fare slabs, we deliver instantaneous, rock-solid transit arbitrage calculations with zero external failure modes."
- **Status**: Accepted

---

### [ADR-004] Interactive Concert Map with Zero-Key CartoDB Dark Matter Rendering
- **Date**: 2026-09-23
- **Context**: The discovery flow requires an interactive "Concert Map" view to explore tour stops geographically across Indian cities, support marker clustering in dense areas, and transition into the trip expense calculator. Under our constraints of $0 serverless hosting, strict mobile performance, and zero layout shift, relying on paid proprietary mapping APIs (Mapbox, Google Maps) introduces billing risk and external rate-limiting. Furthermore, heavy WebGL engines can trigger context losses or memory leaks when unmounting during tab switches.
- **Decision**: Implement an interactive map using Leaflet loaded via Next.js client-side dynamic import (`ssr: false`) paired with CartoDB Dark Matter raster tiles (OpenStreetMap attribution, zero API keys required). Marker clustering and custom SVG pin markers are rendered with deterministic lat/lng venue coordinates, backed by explicit `map.remove()` lifecycle cleanup on component unmount.
- **Alternatives Considered & Rejected**:
  - *Mapbox GL JS*: Requires billing configuration, credit card, and proprietary access tokens, violating our $0 zero-credential constraint.
  - *MapLibre GL*: Robust vector engine, but introduces significant bundle overhead (~250KB gzipped) and higher mobile WebGL memory overhead with potential context loss during frequent view toggling.
  - *Google Maps JavaScript API*: Heavy script loader, strict commercial quotas, and cumbersome dark-mode styling configuration.
- **Interview Defense**: "We selected Leaflet with CartoDB Dark Matter tiles to achieve an ultra-clean dark aesthetic with zero API key overhead and a guaranteed $0 hosting footprint. By dynamically importing the client component and enforcing strict map instance disposal in the unmount lifecycle, we eliminate memory leaks and ensure effortless 60fps responsiveness on mobile viewports."
- **Status**: Accepted

---

### [ADR-005] Public Concert Discovery API with Explicit Error Handling & Real Data Integrity
- **Date**: 2026-09-23
- **Context**: To keep concert dates and venue locations real, users require live concert discovery via public APIs. If an external API fails, rate-limits, or finds no upcoming tour dates for a queried artist, falling back silently to fake/mock data compromises portfolio integrity and misleads users seeking actual upcoming tour logistics.
- **Decision**: Implement a server-side concert discovery adapter (`/lib/api/concerts.ts` / `/app/api/concerts/route.ts`) leveraging the open V3.1 live event pipeline with normalized Indian transit hub mapping. If the API returns an error or no upcoming concerts are found, the engine returns an explicit, typed error response (`API_ERROR`, `NO_CONCERTS`, `RATE_LIMITED`) rather than masking it with synthetic mock data. The UI displays an informative, contextual error/empty state with a retry trigger. The verified catalog is also accessible as a dedicated "Featured Tours" mode.
- **Alternatives Considered & Rejected**:
  - *Silent Fallback to Mock Data on API Error*: Rejected per user architectural review — masked errors obscure real-world API failures and present synthetic concert dates as actual events.
  - *Direct Browser Client-Side Calls to External APIs*: Exposes client IP to rate limits, causes CORS issues, and triggers layout shifts.
- **Interview Defense**: "We enforce data integrity by treating live API queries and curated catalog tours as distinct, transparent states. When live API calls fail or return no concerts, we render explicit, actionable error boundaries with retry capabilities rather than quietly substituting fake data, demonstrating honest engineering resilience."
- **Status**: Accepted

---

### [ADR-006] Centralized Global Error Boundaries & Reusable UI Primitives
- **Date**: 2026-09-23
- **Context**: A portfolio piece must handle runtime failures gracefully (API timeouts, missing search parameters, malformed external payloads, WebGL/Leaflet rendering glitches) without unhandled exceptions or white-screen-of-death crashes. At the same time, the UI design must be cohesive, maintainable, and avoid ad-hoc styling across components without introducing heavyweight component framework bloat.
- **Decision**: Adopt Next.js native nested error boundaries (`app/global-error.tsx`, `app/error.tsx`, `app/not-found.tsx`) paired with a lightweight, standardized set of reusable UI primitives in `/components/ui/` (`button.tsx`, `card.tsx`, `badge.tsx`, `slider.tsx`, `sheet.tsx`, `skeleton.tsx`, `error-state.tsx`, `empty-state.tsx`). All components use Tailwind CSS with standard `cva`/`clsx`/`tailwind-merge` utility patterns.
- **Alternatives Considered & Rejected**:
  - *Monolithic Heavy UI Framework (MUI/AntD)*: Excessive bundle weight, runtime CSS-in-JS overhead, and conflicts with Next.js Server Components.
  - *Ad-hoc Inline Components*: Leads to code duplication, inconsistent spacing/focus rings, and fragile styling.
- **Interview Defense**: "We structured the presentation layer using lightweight, accessible UI primitives and Next.js native error boundaries. This gives us enterprise-grade resilience and sub-second rendering speeds with clean, modular code that never crashes to an unhandled blank screen."
- **Status**: Accepted

---

### [ADR-007] Centralized Design Tokens (tokens.css) & Strict UI Primitive Reuse
- **Date**: 2026-09-23
- **Context**: Concert travel interfaces deal with high-contrast visual cues (savings badges, live badges, ticket tiers, interactive maps, transit modes). Scattering ad-hoc hex codes, arbitrary padding values, and bespoke raw elements across feature components causes visual drift, dark-mode inconsistency, and high maintenance overhead.
- **Decision**: Introduce a dedicated `tokens.css` in the styling layer as the canonical single source of truth for all color codes, surfaces, borders, neon concert accents, typography scales, border radiuses, and spacing variables. Tailwind CSS is configured to consume these CSS variables. Furthermore, establish a strict architectural rule: all screens and features must strictly compose from the reusable primitives in `/components/ui/` rather than inventing one-off DOM elements.
- **Alternatives Considered & Rejected**:
  - *Hardcoded Tailwind arbitrary values (e.g. `bg-[#0a0a0f]`)*: Difficult to maintain, prone to typos, and impossible to theme centrally.
  - *CSS-in-JS token providers (e.g. styled-components / emotion)*: Heavy runtime cost, breaks React Server Components.
- **Interview Defense**: "We decoupled visual design tokens from layout markup by creating a centralized `tokens.css` file that drives our Tailwind theme. Coupled with our reusable `/components/ui/` library, this guarantees visual cohesiveness, strict design system compliance, and zero CSS redundancy across both desktop and mobile views."
- **Status**: Accepted

---

### [ADR-008] Upgrade to Next.js 16 with Turbopack Compiler Engine
- **Date**: 2026-09-26
- **Context**: Next.js 16 introduces default Turbopack build acceleration, enhanced React 19 compiler optimizations, faster Fast Refresh cycles, and stricter type checking. Upgrading early eliminates technical debt and guarantees maximum longevity on modern serverless deployment platforms (Vercel).
- **Decision**: Upgrade from Next.js 15 to Next.js 16 (`^16.3.6`) with Turbopack as the primary build compiler.
- **Alternatives Considered & Rejected**:
  - *Remaining on Next.js 15*: Misses out on Turbopack's 2x faster static generation and automatic React automatic runtime JSX optimization.
- **Interview Defense**: "We upgraded to Next.js 16 with Turbopack to leverage faster cold-starts, sub-2-second production static site generation, and state-of-the-art React 19 compilation while preserving zero-CLS Suspense streaming."
- **Status**: Accepted
