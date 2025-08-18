import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

export const cryptosRouter = Router();

const listQuery = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

cryptosRouter.get('/', validate({ query: listQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: qRaw, limit } = req.query as any;
    const q = (qRaw ? String(qRaw) : '').trim().toLowerCase();

    const where = q
      ? {
          OR: [
            { id: { contains: q } },
            { name: { contains: q } },
            { symbol: { contains: q } },
          ],
        }
      : {};

    const items = await prisma.crypto.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      select: { id: true, name: true, symbol: true },
    });

    return res.json(items);
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Cryptos list error');
    return next(e);
  }
});

const syncBody = z.object({ limit: z.coerce.number().int().min(1).max(1000).default(200) });

cryptosRouter.post('/sync', auth, validate({ body: syncBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const base = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
    const { limit } = req.body as any;
    const target = limit;

    const perPage = 250;
    let page = 1;
    let stored = 0;

    while (stored < target) {
      const remaining = target - stored;
      const batchSize = Math.min(perPage, remaining);
      const url = new URL(`${base}/coins/markets`);
      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('order', 'market_cap_desc');
      url.searchParams.set('per_page', String(batchSize));
      url.searchParams.set('page', String(page));
      url.searchParams.set('sparkline', 'false');
      const headers: Record<string, string> = {
        accept: 'application/json',
        'user-agent': 'cripto-conversor/1.0',
      };
      const demoKey = process.env.COINGECKO_API_KEY || process.env.X_CG_DEMO_API_KEY;
      if (demoKey) headers['x-cg-demo-api-key'] = demoKey;

      const resp = await fetch(url.toString(), { headers });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        return res.status(502).json({ message: `Falha ao buscar dados na CoinGecko: ${resp.status} ${resp.statusText}` , details: body?.slice?.(0, 200) });
      }
      const data = (await resp.json()) as Array<{ id: string; name: string; symbol: string }>;
      if (!Array.isArray(data) || data.length === 0) break;

      for (const { id, name, symbol } of data) {
        await prisma.crypto.upsert({
          where: { id },
          create: { id, name, symbol: symbol?.toUpperCase?.() ?? symbol },
          update: { name, symbol: symbol?.toUpperCase?.() ?? symbol },
        });
      }

      stored += data.length;
      page += 1;
    }

    const count = await prisma.crypto.count();
    return res.status(200).json({ message: 'Sincronização concluída', synced: stored, total: count });
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Cryptos sync error');
    return next(e);
  }
});
