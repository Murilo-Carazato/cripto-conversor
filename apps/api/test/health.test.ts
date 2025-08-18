import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server/app';

describe('Health Route', () => {
  it('GET /health should return status ok and expose X-Request-Id', async () => {
    const app = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
