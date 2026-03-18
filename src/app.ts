import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  const allowedOrigins = env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter((v): v is string => Boolean(v))
    : ['http://localhost:5173', 'http://localhost:3000'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', routes);

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
