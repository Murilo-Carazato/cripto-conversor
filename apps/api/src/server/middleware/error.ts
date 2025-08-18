import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || err?.statusCode) || 500;
  const message = err?.message || 'Internal Server Error';
  try {
    (req as any).log?.error({ err, requestId: (req as any).id }, 'Unhandled error');
  } catch {
    // noop
  }
  return res.status(status).json({ message, requestId: (req as any).id });
}
