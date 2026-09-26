import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';

// AGENTS.md forbids presenting invented figures as data. These tests pin that
// rule down where it is easiest to break: when an upstream source is down, an
// endpoint must report the failure rather than return plausible numbers.
describe('a dead upstream never yields fabricated data', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const killNetwork = () =>
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

  it('POST /api/weather-forecast reports the outage instead of a forecast', async () => {
    killNetwork();
    const res = await request(app).post('/api/weather-forecast').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(res.body.kind).toBe('unavailable');
    expect(res.body.current).toBeUndefined();
    expect(res.body.hourly).toBeUndefined();
    expect(res.body.daily).toBeUndefined();
  });

  it('POST /api/openepi-soil does not fall back to a canned soil profile', async () => {
    killNetwork();
    const res = await request(app).post('/api/openepi-soil').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(res.body.soilProperties).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Luvisols');
  });

  it('POST /api/usgs-hydro-basin-watersheds does not default to Upper Mississippi', async () => {
    killNetwork();
    const res = await request(app).post('/api/usgs-hydro-basin-watersheds').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('071100010105');
    expect(JSON.stringify(res.body)).not.toContain('Upper Mississippi');
  });

  it('POST /api/solar-energy-potential reports the outage instead of an irradiance trace', async () => {
    killNetwork();
    const res = await request(app).post('/api/solar-energy-potential').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(res.body.shortwaveRadiationMJ).toBeUndefined();
  });

  it('POST /api/iss-current-overhead reports the outage instead of an orbital position', async () => {
    killNetwork();
    const res = await request(app).post('/api/iss-current-overhead').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    expect(res.body.iss).toBeUndefined();
  });
});

// The subtler failure: one upstream call succeeds and the other does not.
// /api/openepi-soil fetches soil properties and soil taxonomy separately, and
// used to mark the whole payload live if either one returned, so a failed
// property fetch shipped a hardcoded profile alongside a real soil class.
describe('a partly-live upstream never fills the gaps with canned values', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /api/openepi-soil fails when only the taxonomy call succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('soil/property')) {
        throw new Error('property service down');
      }
      return {
        ok: true,
        json: async () => ({ properties: { most_common: 'Cambisols' } }),
      } as unknown as Response;
    }));

    const res = await request(app).post('/api/openepi-soil').send({ lat: 39.36, lng: 22.94 });

    expect(res.status).toBe(502);
    // The giveaway values from the old hardcoded profile.
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('24.5');
    expect(body).not.toContain('Luvisols');
    expect(res.body.soilProperties).toBeUndefined();
  });
});
