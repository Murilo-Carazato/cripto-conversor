import { Router, type Request, type Response, type NextFunction } from 'express';
import { auth } from '../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

export const historyRouter = Router();

const historyQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
});

historyRouter.get('/', auth, validate({ query: historyQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const { take } = req.query as any;
    const items = await prisma.conversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return res.json(items);
  } catch (e) {
    (req as any).log?.error({ err: e }, 'History route error');
    return next(e);
  }
});
