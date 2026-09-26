import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';

// This endpoint used to return a hard-coded table (corn $4.32, "CBOT",
// "Slightly Bearish") labelled as USDA NASS data. It now calls NASS.
function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return { ok, status, json: async () => body } as Response;
}

const row = (short: string, year: number, month: string, value: string) => ({
  short_desc: short, year, reference_period_desc: month, Value: value, domain_desc: 'TOTAL',
});

describe('POST /api/usda-crop-pricing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('requires a crop name instead of defaulting to Corn', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a crop NASS has no monthly price for', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Durian' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Durian/);
  });

  it('returns 503 without a NASS key rather than a made-up price', async () => {
    vi.stubEnv('NASS_API_KEY', '');
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Corn' });
    expect(res.status).toBe(503);
  });

  it('returns the latest real monthly price, skipping withheld values', async () => {
    vi.stubEnv('NASS_API_KEY', 'k');
    const data = [
      row('CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU', 2026, 'JUL', '4.10'),
      row('CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU', 2026, 'AUG', '3.95'),
      row('CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU', 2026, 'SEP', '(NA)'),
      row('CORN, SILAGE - PRICE RECEIVED, MEASURED IN $ / TON', 2026, 'SEP', '50'),
    ];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Corn' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ period: '2026-08', priceUsd: 3.95, unit: 'bu', commodity: 'CORN' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('commodity_desc=CORN');
  });
});
