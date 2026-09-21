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
   - Firebase config lives in `firebase-config.json` (safe to keep as-is; it's a public web API key, not a secret).
3. Start the dev server:
   ```
   npm run dev
   ```

## Build

```
npm run build   # builds the frontend (Vite) and bundles the server (esbuild)
npm start       # runs the production build
```

## Deploy

```
docker build -t mycrop .
docker run -p 3000:3000 -e GEMINI_API_KEY=... mycrop
```

The server binds `PORT` when the platform sets one, and `/api/health` is there
for the platform's health check. Nothing else is required: every tool that
reads a public source works without a single key configured.

## Where the numbers come from

Every `/api` response carries a `provenance` object naming its source and
whether the figures are `measured`, `modeled`, `reference`, `estimate` or
`unavailable`. It is attached centrally in `src/server/provenance.ts`, so a
handler cannot forget it, and an error status always reports `unavailable` —
a failed upstream can never be presented as a measurement. The tool header
shows it, and `src/server/routeSources.ts` is the per-endpoint table.
## Project shape

- `server.ts` — single Express server exposing one REST endpoint per tool, each proxying/normalizing a public data source
- `src/pages/` — one page per tool
- `src/App.tsx` — navigation shell and routing (a plain `activePage` state switch, not a router)
- `src/lib/firebase.ts`, `src/lib/db.ts` — Firebase Auth + Firestore access for saved fields
