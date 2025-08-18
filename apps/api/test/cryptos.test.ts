import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing app
vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      crypto: {
        findMany: vi.fn(async () => [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        ]),
      },
    },
  };
});

import { buildApp } from '../src/server/app';

describe('Cryptos Route', () => {
  let app: ReturnType<typeof buildApp>;
  beforeEach(() => {
    app = buildApp();
  });

  it('GET /cryptos should return list from prisma and 200', async () => {
    const res = await request(app).get('/cryptos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
  });

  it('GET /cryptos with query q should validate and still 200', async () => {
    const res = await request(app).get('/cryptos?q=bit&limit=2');
    expect(res.status).toBe(200);
  });
});
