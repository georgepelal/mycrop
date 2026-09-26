import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { ROUTE_SOURCES } from '../src/server/provenance';

// AGENTS.md forbids presenting invented figures as data. The envelope is how
// that becomes checkable rather than aspirational: every response says where
// its numbers came from, and a failure can never claim to be a measurement.
describe('provenance envelope', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('declares a source for every endpoint the server defines', () => {
    for (const [route, declared] of Object.entries(ROUTE_SOURCES)) {
      expect(route.startsWith('/api/'), route).toBe(true);
      expect(declared.source, route).toBeTruthy();
      expect(
        ['measured', 'modeled', 'reference', 'estimate', 'unavailable'],
        route,
      ).toContain(declared.kind);
    }
    expect(Object.keys(ROUTE_SOURCES).length).toBeGreaterThan(55);
  });

  it('attaches provenance to a successful response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.provenance).toBeDefined();
    expect(res.body.provenance.kind).toBe('reference');
    expect(Date.parse(res.body.provenance.fetchedAt)).not.toBeNaN();
  });

  it('reports a dead upstream as unavailable, whatever the route declares', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const res = await request(app).post('/api/weather-forecast').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(res.body.provenance.kind).toBe('unavailable');
    expect(res.body.current).toBeUndefined();
  });

  // These two endpoints used to serve invented figures (a sine of the
  // coordinates, a hard-coded price table). They now call Copernicus and USDA
  // NASS, so without credentials they must fail as unavailable rather than
  // fall back to anything, and with data they must name the real source.
  it('reports Sentinel-2 reflectance as unavailable without Copernicus credentials', async () => {
    vi.stubEnv('CDSE_CLIENT_ID', '');
    vi.stubEnv('CDSE_CLIENT_SECRET', '');
    const res = await request(app)
      .post('/api/copernicus-sentinel-reflectance')
      .send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(503);
    expect(res.body.provenance.kind).toBe('unavailable');
    expect(res.body.indexTimeline).toBeUndefined();
    expect(ROUTE_SOURCES['/api/copernicus-sentinel-reflectance'].source).toMatch(/Copernicus/);
  });

  it('reports USDA prices as unavailable without a NASS key, and names NASS as the source', async () => {
    vi.stubEnv('NASS_API_KEY', '');
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Corn' });
    expect(res.status).toBe(503);
    expect(res.body.provenance.kind).toBe('unavailable');
    expect(res.body.priceUsd).toBeUndefined();
    expect(ROUTE_SOURCES['/api/usda-crop-pricing']).toMatchObject({ kind: 'measured' });
    expect(ROUTE_SOURCES['/api/usda-crop-pricing'].source).toMatch(/NASS/);
  });

  it('never claims a measurement on an error status', async () => {
    const res = await request(app).post('/api/frost-freeze-risk').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.provenance.kind).toBe('unavailable');
  });
});
