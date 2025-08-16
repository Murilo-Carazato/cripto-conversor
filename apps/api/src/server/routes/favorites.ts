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

// POST /favorites { cryptoId }
favoritesRouter.post('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const cryptoId = String(req.body?.cryptoId || '').toLowerCase();
    if (!cryptoId) return res.status(400).json({ message: 'cryptoId é obrigatório' });
    const exists = await prisma.crypto.findUnique({ where: { id: cryptoId } });
    if (!exists) return res.status(400).json({ message: 'Criptomoeda inválida' });
    const fav = await prisma.favorite.upsert({
      where: { userId_cryptoId: { userId, cryptoId } },
      create: { userId, cryptoId },
      update: {},
    });
    return res.status(201).json(fav);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Favorites add error:', e);
    return res.status(500).json({ message: 'Erro ao favoritar' });
  }
});

// DELETE /favorites/:cryptoId
favoritesRouter.delete('/:cryptoId', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const cryptoId = String(req.params.cryptoId || '').toLowerCase();
    if (!cryptoId) return res.status(400).json({ message: 'cryptoId é obrigatório' });
    await prisma.favorite.delete({ where: { userId_cryptoId: { userId, cryptoId } } });
    return res.status(204).end();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Favorites delete error:', e);
    return res.status(500).json({ message: 'Erro ao desfavoritar' });
  }
});
