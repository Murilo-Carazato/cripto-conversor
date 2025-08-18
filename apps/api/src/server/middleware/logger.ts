import pino from 'pino';
import { pinoHttp } from 'pino-http';
import crypto from 'crypto';
import { env } from '../../lib/env';
import type { IncomingMessage, ServerResponse } from 'http';

export const logger = pino({ level: env.LOG_LEVEL });

export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,
  genReqId: (req: IncomingMessage & { headers: Record<string, any> }, _res: ServerResponse) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
  customProps: (req: IncomingMessage, _res: ServerResponse) => ({ requestId: (req as any).id }),
  customLogLevel: (_req: IncomingMessage, res: ServerResponse & { statusCode: number }, err?: Error) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
