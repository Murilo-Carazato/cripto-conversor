export default async () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:pass@localhost:3306/db';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
};
