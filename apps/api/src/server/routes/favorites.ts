import { Router, type Request, type Response, type NextFunction } from 'express';
import { auth } from '../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

export const favoritesRouter = Router();

const favBody = z.object({
  cryptoId: z.string().min(1).transform((s) => s.toLowerCase()),
});

const favParams = z.object({
  cryptoId: z.string().min(1).transform((s) => s.toLowerCase()),
});

// GET /favorites -> list user's favorites
favoritesRouter.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return res.json(items);
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Favorites list error');
    return next(e);
  }
});

// POST /favorites { cryptoId }
favoritesRouter.post('/', auth, validate({ body: favBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const { cryptoId } = req.body as any;
    const exists = await prisma.crypto.findUnique({ where: { id: cryptoId } });
    if (!exists) return res.status(400).json({ message: 'Criptomoeda inválida' });
    const fav = await prisma.favorite.upsert({
      where: { userId_cryptoId: { userId, cryptoId } },
      create: { userId, cryptoId },
      update: {},
    });
    return res.status(201).json(fav);
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Favorites add error');
    return next(e);
  }
});

// DELETE /favorites/:cryptoId
favoritesRouter.delete('/:cryptoId', auth, validate({ params: favParams }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const { cryptoId } = req.params as any;
    await prisma.favorite.delete({ where: { userId_cryptoId: { userId, cryptoId } } });
    return res.status(204).end();
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Favorites delete error');
    return next(e);
  }
});
