import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { healthRouter } from './routes/health';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(morgan('dev'));

  // Routes
  app.use('/health', healthRouter);

  // Swagger Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Not found handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  return app;
}
