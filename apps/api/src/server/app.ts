import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { convertRouter } from './routes/convert';
import { historyRouter } from './routes/history';
import { favoritesRouter } from './routes/favorites.js';

export function buildApp() {
  const app = express();

  app.use(helmet());
  const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: false,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  } as const;
  app.use(cors(corsOptions));
  // Explicitly handle preflight for all routes
  app.options('*', cors(corsOptions));
  app.use(express.json());
  app.use(morgan('dev'));

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/convert', convertRouter);
  app.use('/history', historyRouter);
  app.use('/favorites', favoritesRouter);

  // Swagger Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Not found handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  return app;
}
