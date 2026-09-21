import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('GET /api/health', () => {
  it('reports the service as online', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'online', service: 'MyCrop Precision Calculator' });
    expect(res.body.provenance).toBeDefined();
  });
});
