import { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth';
import { prisma } from '../../lib/prisma';

export const convertRouter = Router();

// GET /convert/dual?from=bitcoin&amount=1
convertRouter.get('/dual', auth, async (req: Request, res: Response) => {
  try {
    const from = String(req.query.from || '').toLowerCase();
    const amount = Number(req.query.amount || 1);
    if (!from || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Parâmetros inválidos. Use: from, amount>0' });
    }

    // Validate crypto exists in local catalog
    const exists = await prisma.crypto.findUnique({ where: { id: from } });
    if (!exists) {
      return res.status(400).json({ message: 'Criptomoeda inválida' });
    }

    const fetchRate = async (to: 'brl'|'usd') => {
      const base = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
      const url = new URL(`${base}/simple/price`);
      url.searchParams.set('ids', from);
      url.searchParams.set('vs_currencies', to);
      const resp = await fetch(url.toString(), { headers: { accept: 'application/json' } });
      if (!resp.ok) throw new Error('Falha CoinGecko');
      const data = (await resp.json()) as Record<string, Record<string, number>>;
      const rate = data?.[from]?.[to];
      if (!rate || !Number.isFinite(rate)) throw new Error('Par não suportado');
      return rate;
    };

    const [brlRate, usdRate] = await Promise.all([fetchRate('brl'), fetchRate('usd')]);
    const brlResult = amount * brlRate;
    const usdResult = amount * usdRate;

    // Persist history
    const userId = (req as any).userId as string;
    await prisma.conversion.create({
      data: { userId, cryptoId: from, amount, brlRate, brlResult, usdRate, usdResult },
    });

    return res.json({ from, amount, brl: { rate: brlRate, result: brlResult }, usd: { rate: usdRate, result: usdResult } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Convert dual route error:', e);
    return res.status(500).json({ message: 'Erro interno na conversão dual' });
  }
});
