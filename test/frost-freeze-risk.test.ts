import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe('POST /api/frost-freeze-risk', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects requests missing coordinates', async () => {
    const res = await request(app).post('/api/frost-freeze-risk').send({});
    expect(res.status).toBe(400);
  });

  it('returns 502 when the upstream provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));
    const res = await request(app).post('/api/frost-freeze-risk').send({ lat: 41.0, lng: -87.6 });
    expect(res.status).toBe(502);
  });

  it('flags high frost probability when forecast temps drop at or below 0C', async () => {
    const daily = {
      temperature_2m_min: [-1, -1, -1, -1, -1, -1, -1],
      dew_point_2m_min: [-3, -3, -3, -3, -3, -3, -3],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ daily })));

    const res = await request(app).post('/api/frost-freeze-risk').send({ lat: 41.0, lng: -87.6 });

    expect(res.status).toBe(200);
    expect(res.body.isLiveFrost).toBe(true);
    expect(res.body.frostProbability).toEqual([100, 100, 100, 100, 100, 100, 100]);
    expect(res.body.protectiveAction).toMatch(/HIGH FROST WARNING/);
  });

  it('reports no freeze danger when forecast temps stay mild', async () => {
    const daily = {
      temperature_2m_min: [10, 10, 10, 10, 10, 10, 10],
      dew_point_2m_min: [5, 5, 5, 5, 5, 5, 5],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ daily })));

    const res = await request(app).post('/api/frost-freeze-risk').send({ lat: 41.0, lng: -87.6 });

    expect(res.status).toBe(200);
    expect(res.body.frostProbability).toEqual([5, 5, 5, 5, 5, 5, 5]);
    expect(res.body.nextFrostDate).toBe('None Projected');
  });
});
