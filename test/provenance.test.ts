import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { ROUTE_SOURCES } from '../src/server/provenance';

// AGENTS.md forbids presenting invented figures as data. The envelope is how
// that becomes checkable rather than aspirational: every response says where
// its numbers came from, and a failure can never claim to be a measurement.
describe('provenance envelope', () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it('marks the coordinate-derived endpoint as an estimate, not a measurement', async () => {
    const res = await request(app)
      .post('/api/copernicus-sentinel-reflectance')
      .send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(200);
    expect(res.body.provenance.kind).toBe('estimate');
    expect(res.body.provenance.derivedFrom).toMatch(/sine|coordinate/i);
  });

  it('marks the static price table as reference, and names no live source', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Corn' });
    expect(res.body.provenance.kind).toBe('reference');
    expect(res.body.provenance.source).not.toMatch(/USDA/i);
  });

  it('never claims a measurement on an error status', async () => {
    const res = await request(app).post('/api/frost-freeze-risk').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.provenance.kind).toBe('unavailable');
  });
});
