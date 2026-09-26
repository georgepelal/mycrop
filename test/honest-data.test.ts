import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app, leadingComplete, realSeries, num } from '../server';

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('series helpers', () => {
  it('leadingComplete stops at the first missing value in any series', () => {
    expect(leadingComplete([1, 2, null, 4], [1, 2, 3, 4])).toBe(2);
    expect(leadingComplete([1, 2, 3], [1, 2])).toBe(2);
    expect(leadingComplete([1, 2], undefined)).toBe(0);
    expect(leadingComplete([NaN, 1])).toBe(0);
  });

  it('realSeries rounds only the complete prefix', () => {
    expect(realSeries([1.234, 2.345, null], 2, 1)).toEqual([1.2, 2.3]);
  });

  it('num returns null, not zero, for missing values', () => {
    expect(num(undefined)).toBeNull();
    expect(num(null)).toBeNull();
    expect(num(0)).toBe(0);
  });
});

describe('POST /api/weather-forecast', () => {
  it('returns 502 instead of a mock forecast when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));
    const res = await request(app).post('/api/weather-forecast').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(502);
  });

  it('returns 502 when the provider answers without daily/current blocks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hourly: {} })));
    const res = await request(app).post('/api/weather-forecast').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(502);
  });
});

describe('POST /api/flood-hydrology', () => {
  it('cuts the series at the first missing day instead of filling it', async () => {
    const daily = { time: ['2026-09-01', '2026-09-02', '2026-09-03'], river_discharge: [10.5, null, 12] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ daily })));
    const res = await request(app).post('/api/flood-hydrology').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain('2026-09-01');
    expect(body).not.toContain('2026-09-02');
    expect(body).not.toContain('2026-09-03');
  });
});

describe('POST /api/growing-degree-days', () => {
  it('accumulates from zero, not from an invented baseline', async () => {
    const daily = {
      time: ['2026-09-01', '2026-09-02'],
      temperature_2m_max: [20, 30],
      temperature_2m_min: [10, 10],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ daily })));
    const res = await request(app).post('/api/growing-degree-days').send({ lat: 40, lng: 22, crop: 'corn' });
    expect(res.status).toBe(200);
    // base 10 °C: (20+10)/2-10 = 5, then (30+10)/2-10 = 10
    expect(res.body.dailyGdd).toEqual([5, 10]);
    expect(res.body.cumulativeGdd).toEqual([5, 15]);
  });

  it('asks Open-Meteo for the days since planting', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ daily: { time: [], temperature_2m_max: [], temperature_2m_min: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    await request(app).post('/api/growing-degree-days').send({ lat: 40, lng: 22, plantingDate: tenDaysAgo });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/past_days=1[01]\b/);
  });
});

describe('POST /api/agronomic-chilling-hours', () => {
  it('counts real hourly temperatures between 0 and 7.2 °C, full days only', async () => {
    const time: string[] = [];
    const temperature_2m: number[] = [];
    for (let h = 0; h < 24; h++) {
      time.push(`2026-01-10T${String(h).padStart(2, '0')}:00`);
      temperature_2m.push(h < 5 ? 3 : 12); // 5 chill hours
    }
    time.push('2026-01-11T00:00');
    temperature_2m.push(2); // partial day — not counted
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hourly: { time, temperature_2m } })));
    const res = await request(app).post('/api/agronomic-chilling-hours').send({ lat: 45, lng: 10 });
    expect(res.status).toBe(200);
    expect(res.body.times).toEqual(['2026-01-10']);
    expect(res.body.chillingHoursDaily).toEqual([5]);
    expect(res.body.cumulativeTotal).toBe(5);
  });
});

describe('POST /api/openepi-soil', () => {
  it('returns 502 when a soil property is missing instead of using a typical soil', async () => {
    const layers = [
      { name: 'ph_h2o', depths: [{ values: { mean: 65 } }] },
      { name: 'clay', depths: [{ values: { mean: 250 } }] },
      // sand, silt, soc, nitrogen missing
    ];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) =>
      url.includes('/soil/type')
        ? jsonResponse({ properties: { most_common: 'Luvisols' } })
        : jsonResponse({ properties: { layers } })));
    const res = await request(app).post('/api/openepi-soil').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(502);
  });

  it('converts SoilGrids units when every layer is present', async () => {
    const mean = (name: string, v: number) => ({ name, depths: [{ values: { mean: v } }] });
    const layers = [mean('ph_h2o', 65), mean('clay', 250), mean('sand', 400), mean('silt', 350), mean('soc', 158), mean('nitrogen', 160)];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) =>
      url.includes('/soil/type')
        ? jsonResponse({ properties: { most_common: 'Cambisols' } })
        : jsonResponse({ properties: { layers } })));
    const res = await request(app).post('/api/openepi-soil').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(200);
    expect(res.body.soilProperties).toMatchObject({ soilClass: 'Cambisols', phWater: 6.5, clayContent: 25, nitrogen: 1.6 });
  });
});

describe('POST /api/copernicus-sentinel-reflectance', () => {
  it('returns 503 without Copernicus credentials instead of numbers from sin(lat)', async () => {
    vi.stubEnv('CDSE_CLIENT_ID', '');
    vi.stubEnv('CDSE_CLIENT_SECRET', '');
    const res = await request(app).post('/api/copernicus-sentinel-reflectance').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(503);
  });

  it('reports the latest cloud-free pass from the Statistical API', async () => {
    vi.stubEnv('CDSE_CLIENT_ID', 'id');
    vi.stubEnv('CDSE_CLIENT_SECRET', 'secret');
    const stats = (mean: number) => ({ bands: { B0: { stats: { mean, sampleCount: 40, noDataCount: 9 } } } });
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('openid-connect/token')) return jsonResponse({ access_token: 't', expires_in: 600 });
      return jsonResponse({
        data: [
          { interval: { from: '2026-09-10T00:00:00Z' }, outputs: { ndvi: stats(0.5), ndwi: stats(0.1), swir: stats(0.2) } },
          { interval: { from: '2026-09-20T00:00:00Z' }, outputs: { ndvi: stats(0.71234), ndwi: stats(0.2), swir: stats(0.18) } },
          { interval: { from: '2026-09-22T00:00:00Z' }, outputs: { ndvi: { bands: { B0: { stats: { sampleCount: 0 } } } } } },
        ],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await request(app).post('/api/copernicus-sentinel-reflectance').send({ lat: 40, lng: 22 });
    expect(res.status).toBe(200);
    expect(res.body.isEstimate).toBe(false);
    expect(res.body.observedOn).toBe('2026-09-20');
    expect(res.body.indexTimeline.ndvi).toBe(0.712);
  });
});

describe('POST /api/detect-crop', () => {
  it('never reports a confidence number', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await request(app).post('/api/detect-crop').send({ lat: 41.5, lng: -93.5 });
    expect(res.status).toBe(200);
    expect(res.body.confidence).toBeNull();
    expect(res.body.method).toBe('regional-heuristic');
    expect(res.body.detectedCrop).toBe('Corn or Soybeans');
  });

  it('makes no guess outside the known regions', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await request(app).post('/api/detect-crop').send({ lat: -40, lng: -150 });
    expect(res.body.detectedCrop).toBeNull();
    expect(res.body.method).toBe('none');
  });
});

describe('POST /api/predict', () => {
  it('refuses to estimate a field nobody described', async () => {
    const res = await request(app).post('/api/predict').send({ cropType: 'Corn' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ndviValue/);
  });
});

describe('GET /api/noaa-space-weather-activity', () => {
  it('keeps a missing scale as null and only uses NOAA wording from G3', async () => {
    const scales = { '0': { DateStamp: '2026-09-26', TimeStamp: '18:56:00', R: { Scale: null }, S: { Scale: '0' }, G: { Scale: '3' } } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(scales)));
    const res = await request(app).get('/api/noaa-space-weather-activity');
    expect(res.status).toBe(200);
    expect(res.body.scales.radioBlackouts).toBeNull();
    expect(res.body.scales.geomagneticStorms).toBe(3);
    expect(res.body.scales.gnssEffect).toMatch(/satellite navigation/);
  });
});
