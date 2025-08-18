import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../lib/env.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', validate({ body: registerSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body as any;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, passwordHash } });

    const token = jwt.sign(
      { sub: user.id },
      env.JWT_SECRET as Secret,
      { expiresIn: (env.JWT_EXPIRES_IN ?? '1d') } as SignOptions
    );

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Register route error');
    return next(e);
  }
});

router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id },
      env.JWT_SECRET as Secret,
      { expiresIn: (env.JWT_EXPIRES_IN ?? '1d') } as SignOptions
    );

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Login route error');
    return next(e);
  }
});

export const authRouter = router;
