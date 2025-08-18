import { Router, type Request, type Response, type NextFunction } from 'express';
import { auth } from '../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

export const convertRouter = Router();

// GET /convert/dual?from=bitcoin&amount=1
const convertQuery = z.object({
  from: z.string().min(1),
  amount: z.coerce.number().positive(),
});

convertRouter.get('/dual', auth, validate({ query: convertQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from: fromRaw, amount } = req.query as any;
    const from = String(fromRaw).toLowerCase();

    // Validate crypto exists in local catalog
    const exists = await prisma.crypto.findUnique({ where: { id: from } });
    if (!exists) {
      return res.status(400).json({ message: 'Criptomoeda inválida' });
    }

    // Fetch BRL and USD in a single request to reduce rate-limit pressure
    const base = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
    const url = new URL(`${base}/simple/price`);
    url.searchParams.set('ids', from);
    url.searchParams.set('vs_currencies', 'brl,usd');
    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': 'cripto-conversor/1.0',
    };
    const demoKey = process.env.COINGECKO_API_KEY || process.env.X_CG_DEMO_API_KEY;
    if (demoKey) headers['x-cg-demo-api-key'] = demoKey;

    const resp = await fetch(url.toString(), { headers });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      return res.status(502).json({ message: `Falha CoinGecko: ${resp.status} ${resp.statusText}`, details: body?.slice?.(0, 200) });
    }
    const data = (await resp.json()) as Record<string, Record<'brl' | 'usd', number>>;
    const brlRate = data?.[from]?.brl;
    const usdRate = data?.[from]?.usd;
    if (!Number.isFinite(brlRate) || !Number.isFinite(usdRate)) {
      return res.status(400).json({ message: 'Par não suportado' });
    }

    const brlResult = amount * brlRate;
    const usdResult = amount * usdRate;

    // Persist history
    const userId = (req as any).userId as string;
    await prisma.conversion.create({
      data: { userId, cryptoId: from, amount, brlRate, brlResult, usdRate, usdResult },
    });

    return res.json({ from, amount, brl: { rate: brlRate, result: brlResult }, usd: { rate: usdRate, result: usdResult } });
  } catch (e) {
    (req as any).log?.error({ err: e }, 'Convert dual route error');
    return next(e);
  }
});
