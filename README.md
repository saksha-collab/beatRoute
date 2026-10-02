# BeatRoute 🎫✈️
> *Stop paying ₹35,000 to scalpers in Mumbai. BeatRoute tracks live Indian stadium concerts and calculates whether traveling to another city saves you real money.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-beatroute--jade.vercel.app-00F0FF?style=flat-square&logo=vercel)](https://beatroute-jade.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-0070F3?style=flat-square&logo=vercel)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 💡 The Story Behind BeatRoute

If you’ve tried getting concert tickets in India over the past year, you already know the story:

1. You sit in an online queue with **300,000 people ahead of you**.
2. General admission tickets sell out in **90 seconds**.
3. Ten minutes later, those same tickets are listed on resale and black-market platforms for **₹25,000 to ₹50,000+**.

Meanwhile, the exact same artist often plays another show in **Ahmedabad, Indore, Chandigarh, Bengaluru, or Pune**—where tickets are still available at regular face value (₹3,500 – ₹6,500).

We built **BeatRoute** to answer a simple, honest question:

> **What if flying to another city, booking a good hotel, eating great food, and watching the show with a face-value ticket is actually thousands of rupees cheaper than buying one overpriced ticket in your hometown?**

Turns out, more often than not, **it is**.

---

## 🌟 What You Can Do

### 1. 📡 All-India Live Concert Radar
A clean, chronological feed of all verified mega-tours heading to India.
- **Confirmed Indian Stadium Dates**: Coldplay (Mumbai & Ahmedabad), Diljit Dosanjh (7 cities), Dua Lipa (Mumbai), Alan Walker (10 cities), Bryan Adams (6 cities), Karan Aujla (5 cities), and Cigarettes After Sex (3 cities).
- **Humanized Countdowns**: Know at a glance when shows are happening (*"Tonight"*, *"Tomorrow"*, *"In 14 days"*).
- **One-Click City Filters**: Instantly see what's happening in Mumbai, Delhi NCR, Bengaluru, Ahmedabad, Pune, Kolkata, Chandigarh, and more.

### 2. 🗺️ Inline Stadium Mini-Maps
Never wonder where a stadium is or how far it is from the airport.
- Click **"View Stadium Map"** on any concert card to reveal an interactive dark-matter map powered by CartoDB and Leaflet.
- See exact venue coordinates, copy them with one click, or jump straight into **Google Maps Directions**.

### 3. 🏷️ Real Ticket Tiers & Official Links
- See verified starting prices and full tier breakdowns (Silver / Gold / VIP).
- Live stock status badges (*Available*, *Fast Filling*, *Sold Out*).
- Direct buttons that open the official box office (BookMyShow, Zomato Live, LiveNation)—no affiliate redirects or sketchy links.

### 4. ⚖️ The Travel Arbitrage Engine
Curious how much you'd save by traveling? Switch over to the **Travel Arbitrage** view:
- Pick your starting city (Mumbai, Delhi, Bengaluru, etc.).
- Choose between **Direct Flights** or **Indian Railways** (`Sleeper`, `3AC`, `2AC`, `Vande Bharat`).
- Set your stay preference (`Budget`, `Comfort`, `Luxury`).
- BeatRoute calculates:
  $$\text{Net Savings} = \text{Home City Outlay} - (\text{Ticket} + \text{Round-Trip Travel} + \text{1-Night Hotel} + \text{Local Cabs})$$
- Shows you the **"Sweet Spot"** pick: maximum money saved without spending 24 hours on a train.

### 5. 🔍 Live Global Artist Search
Looking for someone who isn't on the featured list?
- Type any artist into the search bar (e.g., Ed Sheeran, Cigarettes After Sex, Alan Walker).
- BeatRoute queries Bandsintown's live V3.1 event pipeline in real time to fetch upcoming confirmed dates and GPS coordinates in India.

---

## 🌐 Live Demo

The app is deployed on Vercel's Mumbai Edge:

👉 **[https://beatroute-jade.vercel.app](https://beatroute-jade.vercel.app)**

- **No login or sign-up required**.
- **100% free** with zero ads.
- **Deep-linkable**: Every city, artist, and travel filter updates the URL (`nuqs`), so you can copy and share exact trip comparisons directly with friends on WhatsApp.

---

## 🛠️ Tech Stack & Architecture

BeatRoute is built with a focus on speed, polish, and zero layout shift:

- **Framework**: [Next.js 16.3](https://nextjs.org/) with [Turbopack](https://turbo.build/) (sub-second local builds and React 19 compiler optimizations).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) backed by centralized CSS variables in `app/tokens.css` for dark-mode neon glows and custom surfaces.
- **Maps**: [Leaflet](https://leafletjs.com/) with **CartoDB Dark Matter** tiles (clean dark aesthetics, $0 infrastructure cost, and zero API keys needed).
- **URL State**: [nuqs](https://nuqs.47ng.com/) for bidirectional URL search parameter synchronization.
- **Icons & Motion**: Lucide React + lightweight CSS animations for smooth map and drawer transitions.
- **No Fake Data Policy ([ADR-005](ARCH_LOG.md))**: If a live artist search returns no Indian tour dates, the app tells you honestly instead of generating synthetic dummy concerts.

---

## 🚀 Running Locally

Want to run BeatRoute on your machine or contribute? It takes about two minutes:

### Prerequisites
- Node.js 18.17+ or Node 20+
- npm, pnpm, or yarn

### Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/saksha-collab/beatRoute.git
cd beatroute

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## 🗺️ Master Roadmap

- [x] **Phase 1: All-India Live Concert Radar & Stadium Maps** (✅ *Shipped & Live*)
  - Chronological Indian tour feed with countdown badges
  - Inline CartoDB dark-matter stadium mini-maps with directions
  - City filter chips and live Bandsintown V3.1 search
  - Integrated travel arbitrage matrix & slide-over expense planner

- [ ] **Phase 2: Live Ticket Availability & Scalper Price Monitor** (⏳ *Up Next*)
  - Real-time seat inventory tracking on BookMyShow and Zomato Live
  - Resale price delta tracking across Viagogo and secondary marketplaces
  - Sold-out drop alerts

- [ ] **Phase 3: Real-Time Travel APIs** (⏳ *Upcoming*)
  - Live domestic airfare APIs (Amadeus / Duffel)
  - Real IRCTC train seat availability & Tatkal fare curves
  - Dynamic hotel surge pricing within 5km of concert stadiums

- [ ] **Phase 4: Fan Travel Companion** (⏳ *Upcoming*)
  - Day-of-concert timeline & stadium gate guide
  - Offline digital concert pass & calendar export
  - Split-fare group cost calculator for concert crews

---

## 🤝 Contributing

Got an idea for a feature, spotted a bug, or want to add confirmed dates for an upcoming tour?

1. Fork the repository.
2. Create your branch (`git checkout -b feat/new-concert-data`).
3. Commit your changes (`git commit -m 'feat: add upcoming tour dates'`).
4. Push to your branch (`git push origin feat/new-concert-data`).
5. Open a Pull Request!

---

## 📄 License

BeatRoute is open-source software licensed under the [MIT License](LICENSE).
Feel free to use the code, fork it, or build on top of it.
