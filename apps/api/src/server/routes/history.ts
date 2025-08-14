import { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth';
import { prisma } from '../../lib/prisma';

export const historyRouter = Router();

// GET /history?take=20
historyRouter.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const take = Math.min(Math.max(Number(req.query.take || 20), 1), 100);
    const items = await prisma.conversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return res.json(items);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('History route error:', e);
    return res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
});
