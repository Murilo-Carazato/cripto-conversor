import { Router, type Request, type Response } from 'express';
import { prisma } from '../../lib/prisma';
import { auth } from '../middleware/auth';

export const cryptosRouter = Router();

// GET /cryptos?q=bit&limit=100
// Reads cryptos from the local DB for performance and FK integrity
cryptosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;

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
    // eslint-disable-next-line no-console
    console.error('Cryptos list error:', e);
    return res.status(500).json({ message: 'Erro ao listar criptomoedas' });
  }
});

// POST /cryptos/sync { limit?: number }
// Sync top N coins from CoinGecko into local DB
cryptosRouter.post('/sync', auth, async (req: Request, res: Response) => {
  try {
    const base = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
    const requested = Number(req.body?.limit || 200);
    const target = Number.isFinite(requested) ? Math.max(1, Math.min(1000, requested)) : 200;

    const perPage = 250; // API max per_page is 250
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

      const resp = await fetch(url.toString(), { headers: { accept: 'application/json' } });
      if (!resp.ok) {
        return res.status(502).json({ message: 'Falha ao buscar dados na CoinGecko' });
      }
      const data = (await resp.json()) as Array<{ id: string; name: string; symbol: string }>;
      if (!Array.isArray(data) || data.length === 0) break;

      // Upsert each coin into DB
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
    // eslint-disable-next-line no-console
    console.error('Cryptos sync error:', e);
    return res.status(500).json({ message: 'Erro ao sincronizar criptomoedas' });
  }
});
