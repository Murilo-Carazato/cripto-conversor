import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';

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

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid data', errors: parsed.error.flatten() });
  }

  const { email, name, password } = parsed.data;

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
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const { email, password } = parsed.data;
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
});

export const authRouter = router;
