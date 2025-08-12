import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../lib/env';

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
    if (!payload?.sub) return res.status(401).json({ message: 'Invalid token' });

    (req as any).userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
