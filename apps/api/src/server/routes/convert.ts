import { Router } from 'express';
import { auth } from '../middleware/auth';

export const convertRouter = Router();

// GET /convert?from=bitcoin&to=brl&amount=1
convertRouter.get('/', auth, async (req, res) => {
  try {
    const from = String(req.query.from || '').toLowerCase();
    const to = String(req.query.to || '').toLowerCase();
    const amount = Number(req.query.amount || 1);

    if (!from || !to || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Parâmetros inválidos. Use: from, to, amount>0' });
    }

    const url = new URL('https://api.coingecko.com/api/v3/simple/price');
    url.searchParams.set('ids', from);
    url.searchParams.set('vs_currencies', to);

    const resp = await fetch(url.toString(), {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!resp.ok) {
      return res.status(502).json({ message: 'Falha na consulta ao CoinGecko' });
    }
    const data = (await resp.json()) as Record<string, Record<string, number>>;
    const rate = data?.[from]?.[to];
    if (!rate || !Number.isFinite(rate)) {
      return res.status(400).json({ message: 'Par de moedas não suportado (from/to)' });
    }

    const result = amount * rate;
    return res.json({ from, to, amount, rate, result });
  } catch (e) {
    return res.status(500).json({ message: 'Erro interno na conversão' });
  }
});
