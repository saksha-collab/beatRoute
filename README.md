# BeatRoute 🎵✈️
### *The Concert Travel Arbitrage Engine*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

**BeatRoute** is a production-grade concert travel arbitrage engine designed for Indian music tours. When tickets sell out in tier-1 cities like Mumbai or Delhi—or surge to exorbitant scalper prices—BeatRoute calculates whether traveling to another tour stop (e.g. Ahmedabad, Indore, Chandigarh, Bengaluru, Pune) via flights or Indian Railways saves you net thousands of rupees, all-inclusive.

---

## ✨ Features

- **Multi-Modal Travel Arbitrage**:
  - Compares round-trip direct flight baselines vs. Indian Railways telescopic distance slabs (`SL`, `3AC`, `2AC`, `Vande Bharat`).
  - Itemized trip budgets: `Concert Ticket + Transit + 1-Night Hotel + Local Venue Transfers`.
- **Interactive Dark Matter Concert Map**:
  - High-performance Leaflet map using **CartoDB Dark Matter** raster tiles ($0 zero-key footprint).
  - Custom SVG venue pin markers with city price previews, smooth pan/zoom (`flyTo`), and zero-memory-leak unmount cleanup.
- **Slide-Over Expense Planner Drawer**:
  - Live itemized breakdown modal allowing users to customize origin city, transit mode, rail seat class, and lodging tier (`budget`, `comfort`, `luxury`).
- **Live Event Discovery & Curated Tours**:
  - Integrated with live event registries for real-time artist tour stops, venues, and dates.
  - Curated showcases for major domestic tours: *Coldplay, Diljit Dosanjh, Karan Aujla, Ed Sheeran, Alan Walker, Bryan Adams*.
- **Zero Cumulative Layout Shift (CLS) & Sub-Second Latency**:
  - Next.js 15 App Router with React Suspense streaming boundaries and matching skeleton loaders.
  - Centralized design system driven by CSS custom variables in [`app/tokens.css`](file:///Users/sakshamvashishtha/Projects/beatroute/app/tokens.css).

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, React 19 Server Components) |
| **State Sync** | `nuqs` (URL search parameters as single source of truth) |
| **Styling** | Tailwind CSS with centralized Design Tokens ([`app/tokens.css`](file:///Users/sakshamvashishtha/Projects/beatroute/app/tokens.css)) |
| **Mapping Engine** | Leaflet + CartoDB Dark Matter tiles (zero API key dependency) |
| **UI Primitives** | Radix UI primitives (`Dialog/Sheet`, `Slider`, `Tabs`), Lucide Icons, Framer Motion |
| **Documentation** | Architectural Decision Records in [`ARCH_LOG.md`](file:///Users/sakshamvashishtha/Projects/beatroute/ARCH_LOG.md) (ADR-001 through ADR-007) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/beatroute.git
cd beatroute

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal) in your browser.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.
