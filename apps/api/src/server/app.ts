import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { convertRouter } from './routes/convert.js';
import { historyRouter } from './routes/history.js';
import { favoritesRouter } from './routes/favorites.js';
import { cryptosRouter } from './routes/cryptos.js';
import { env } from '../lib/env.js';
import { httpLogger } from './middleware/logger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(httpLogger);
  const allowedOrigins = (env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean)) ?? ['http://localhost:5173'];
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    exposedHeaders: ['X-Request-Id'],
  } as Parameters<typeof cors>[0];
  app.use(cors(corsOptions));
  // Explicitly handle preflight for all routes
  app.options('*', cors(corsOptions));
  // Ensure X-Request-Id is available to clients
  app.use((req, res, next) => {
    try {
      const id = (req as any).id;
      if (id) res.setHeader('X-Request-Id', String(id));
    } catch {}
    next();
  });
  app.use(express.json());
  app.use(generalLimiter);

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authLimiter, authRouter);
  app.use('/me', meRouter);
  app.use('/convert', convertRouter);
  app.use('/history', historyRouter);
  app.use('/favorites', favoritesRouter);
  app.use('/cryptos', cryptosRouter);

  // Swagger Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Not found handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
