import { describe, it, expect } from 'vitest';
import { app } from '../server';

// The exact API surface, pinned before server.ts was split into route
// modules. If a refactor drops or renames an endpoint, this fails rather
// than the tool quietly 404ing in production.
const EXPECTED = [
  // Added in phase 5: the three upstreams pages used to call straight from
  // the browser, now proxied so they carry provenance like everything else.
  "POST /api/soilgrids-properties",
  "POST /api/nasa-power-daily",
  "POST /api/open-meteo-forecast",
  "GET /api/client-ip-geolocation",
  "GET /api/dynamic-crops",
  "GET /api/global-greenhouse-gas-trends",
  "GET /api/health",
  "GET /api/nasa-eonet-active-events",
  "GET /api/noaa-space-weather-activity",
  "GET /api/open-exchange-rates",
  "POST /api/agronomic-chilling-hours",
  "POST /api/agronomic-evapotranspiration",
  "POST /api/agronomic-nutrient-leaching",
  "POST /api/agronomic-par-ppfd",
  "POST /api/air-quality-aerosols",
  "POST /api/allergen-pollen-forecast",
  "POST /api/canopy-stomatal-conductance",
  "POST /api/chat",
  "POST /api/climate-projection",
  "POST /api/climatology-nasa",
  "POST /api/copernicus-sentinel-reflectance",
  "POST /api/crop-literature-handbooks",
  "POST /api/crop-lodging-shear",
  "POST /api/crop-nutritive-macronutrients",
  "POST /api/crop-water-efficiency",
  "POST /api/cropland-fire-risk",
  "POST /api/detect-crop",
  "POST /api/ensemble-dispersion",
  "POST /api/environmental-telemetry",
  "POST /api/flood-hydrology",
  "POST /api/frost-freeze-risk",
  "POST /api/gbif-local-occurrences",
  "POST /api/gbif-species-suggest",
  "POST /api/gdacs-active-hazards",
  "POST /api/growing-degree-days",
  "POST /api/historical-reanalysis",
  "POST /api/iss-current-overhead",
  "POST /api/local-biodiversity",
  "POST /api/local-public-holidays",
  "POST /api/macro-national",
  "POST /api/marine-hydrodynamics",
  "POST /api/openepi-forest-fire",
  "POST /api/openepi-soil",
  "POST /api/openmeteo-agri-soil",
  "POST /api/openmeteo-boundary-layer",
  "POST /api/openmeteo-geotech-elevation",
  "POST /api/openmeteo-historical-archive",
  "POST /api/openmeteo-river-discharge",
  "POST /api/openmeteo-uv-radiation",
  "POST /api/osm-local-natural-features",
  "POST /api/osm-reverse-geocode",
  "POST /api/pest-disease-risk",
  "POST /api/plant-dictionary-lookup",
  "POST /api/pollinator-activity",
  "POST /api/predict",
  "POST /api/regional-country-sovereign",
  "POST /api/soil-salinity-capillary",
  "POST /api/solar-energy-potential",
  "POST /api/sunrise-sunset-astronomy",
  "POST /api/usda-crop-pricing",
  "POST /api/usgs-hydro-basin-watersheds",
  "POST /api/usgs-hydrology-waterwatch",
  "POST /api/usgs-seismic-radial",
  "POST /api/weather-forecast",
  "POST /api/worldbank-forest-coverage",
];

function registeredRoutes(): string[] {
  // Express 5 exposes the router as app.router; older shapes used app._router.
  const router = (app as unknown as { router?: { stack: unknown[] }; _router?: { stack: unknown[] } });
  const stack = (router.router ?? router._router)?.stack ?? [];
  const found: string[] = [];

  const walk = (layers: unknown[]) => {
    for (const layer of layers as Array<Record<string, any>>) {
      if (layer.route) {
        const path = layer.route.path as string;
        const methods = layer.route.methods as Record<string, boolean>;
        for (const method of Object.keys(methods)) {
          if (methods[method]) found.push(`${method.toUpperCase()} ${path}`);
        }
      } else if (layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  };
  walk(stack);
  return found;
}

describe('API surface', () => {
  it('registers every endpoint, no more and no fewer', () => {
    const actual = registeredRoutes().filter((r) => r.includes('/api/')).sort();
    expect(actual).toEqual([...EXPECTED].sort());
  });

  it('answers on a route regardless of which module now defines it', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
