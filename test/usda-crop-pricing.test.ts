import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('POST /api/usda-crop-pricing', () => {
  it('returns market stats for a known crop, case-insensitively', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Soybeans' });
    expect(res.status).toBe(200);
    expect(res.body.cropName).toBe('Soybeans');
    expect(res.body.marketStats.activeExchange).toBe('CBOT (Chicago)');
  });

  it('defaults to Corn when no cropName is given', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({});
    expect(res.status).toBe(200);
    expect(res.body.marketStats.pricePerBushelUsd).toBe(4.32);
  });

  it('returns 404 for a crop not in the catalog', async () => {
    const res = await request(app).post('/api/usda-crop-pricing').send({ cropName: 'Durian' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Durian/);
  });
});
