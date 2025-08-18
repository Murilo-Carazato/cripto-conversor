import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server/app';

describe('Auth validation (Zod)', () => {
  const app = buildApp();

  it('POST /auth/register -> 400 on invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'invalid', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  it('POST /auth/login -> 400 on short password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'a@a.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });
});
