import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from './error.js';

export function validate({ body, query, params }: { body?: ZodSchema<any>; query?: ZodSchema<any>; params?: ZodSchema<any>; }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      return next();
    } catch (err: any) {
      return next(new HttpError(400, 'Invalid request', err));
    }
  };
}
