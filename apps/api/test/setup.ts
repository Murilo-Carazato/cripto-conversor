// Vitest setup for API tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
// Provide a valid URL to satisfy zod url() validation; no real DB connection is made in tests.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:pass@localhost:3306/db';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
