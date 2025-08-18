import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  JWT_SECRET: z.string().min(1, { message: 'JWT_SECRET is required' }),
  JWT_EXPIRES_IN: z.string().optional(),
  COINGECKO_BASE: z.string().url({ message: 'COINGECKO_BASE must be a valid URL' }).optional(),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Failed to parse environment variables');
}

export const env = parsed.data;
