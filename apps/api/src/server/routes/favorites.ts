import { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth';
import { prisma } from '../../lib/prisma';

export const favoritesRouter = Router();

// GET /favorites -> list user's favorites
favoritesRouter.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return res.json(items);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Favorites list error:', e);
    return res.status(500).json({ message: 'Erro ao listar favoritos' });
  }
});

// POST /favorites { crypto }
favoritesRouter.post('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const crypto = String(req.body?.crypto || '').toLowerCase();
    if (!crypto) return res.status(400).json({ message: 'crypto é obrigatório' });
    const fav = await prisma.favorite.upsert({
      where: { userId_crypto: { userId, crypto } },
      create: { userId, crypto },
      update: {},
    });
    return res.status(201).json(fav);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Favorites add error:', e);
    return res.status(500).json({ message: 'Erro ao favoritar' });
  }
});

// DELETE /favorites/:crypto
favoritesRouter.delete('/:crypto', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const crypto = String(req.params.crypto || '').toLowerCase();
    if (!crypto) return res.status(400).json({ message: 'crypto é obrigatório' });
    await prisma.favorite.delete({ where: { userId_crypto: { userId, crypto } } });
    return res.status(204).end();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Favorites delete error:', e);
    return res.status(500).json({ message: 'Erro ao desfavoritar' });
  }
});
