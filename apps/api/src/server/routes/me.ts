import { Router, type Request, type Response, type NextFunction } from 'express';
import { auth } from '../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';

export const meRouter = Router();

meRouter.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Me route error');
    return next(e);
  }
});
