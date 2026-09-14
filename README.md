# MyCrop — Agronomy & Environmental Toolkit

MyCrop is a multi-tool dashboard for agronomy and environmental data. Instead of one narrow feature, it's a collection of 60+ standalone tools — soil composition, frost risk, growing degree days, pest/disease risk, pollinator outlooks, air quality, seismic activity, biodiversity lookups, and more — each backed by a real public data source (NASA, USGS, GBIF, Open‑Meteo, OSM, WorldBank, NOAA, ECMWF, ISRIC SoilGrids, Copernicus, GDACS, USDA, and others).

Pick a location, and each tool fetches and visualizes live data for it. Optionally, sign in to save locations as "fields" so tools that benefit from persistent context (soil profile, AI chat) can reuse them.

## Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Recharts, Google Maps, Three.js (3D field view)
- **Backend:** Express (TypeScript, run via `tsx`), acting as a proxy/aggregation layer in front of the public data APIs (keeps upstream keys server-side, normalizes responses)
- **AI:** Google Gemini, used for the AI agronomist chat and a few natural-language summaries — the app degrades gracefully to plain calculated output when no Gemini key is configured
- **Auth/data:** Firebase Auth + Firestore for saved fields (with per-owner security rules), i18n via i18next (en/es/fr/pt/zh)

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in what you have. Every key is optional for local development:
   - `GEMINI_API_KEY` — enables the AI chat and AI-written summaries. Without it, those features fall back to direct calculation.
   - `GOOGLE_MAPS_PLATFORM_KEY` — enables the interactive map pickers.
   - Firebase config lives in `firebase-applet-config.json` (safe to keep as-is; it's a public web API key, not a secret).
3. Start the dev server:
   ```
   npm run dev
   ```

## Build

```
npm run build   # builds the frontend (Vite) and bundles the server (esbuild)
npm start       # runs the production build
```

## Project shape

- `server.ts` — single Express server exposing one REST endpoint per tool, each proxying/normalizing a public data source
- `src/pages/` — one page per tool
- `src/App.tsx` — navigation shell and routing (a plain `activePage` state switch, not a router)
- `src/lib/firebase.ts`, `src/lib/db.ts` — Firebase Auth + Firestore access for saved fields
