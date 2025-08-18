import { config as dotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root .env (../../.env)
dotenv({ path: path.resolve(__dirname, '../../..', '.env') });

import { env } from './lib/env.js';
import { buildApp } from './server/app.js';
import { prisma } from './lib/prisma.js';

const app = buildApp();
// Railway define a variável PORT automaticamente; use-a quando disponível
const port = Number(process.env.PORT ?? env.API_PORT);

async function bootstrapSyncIfEmpty() {
  try {
    const count = await prisma.crypto.count();
    if (count > 0) {
      // eslint-disable-next-line no-console
      console.log(`[bootstrap] Catálogo já possui ${count} criptomoedas. Pulando sync inicial.`);
      return;
    }
    // eslint-disable-next-line no-console
    console.log('[bootstrap] Catálogo vazio. Iniciando sincronização inicial de criptomoedas…');

    const base = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
    const target = 200; // quantidade padrão
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
        // eslint-disable-next-line no-console
        console.error(`[bootstrap] Falha ao buscar dados na CoinGecko: ${resp.status} ${resp.statusText}`, body?.slice?.(0, 200));
        break;
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

    const finalCount = await prisma.crypto.count();
    // eslint-disable-next-line no-console
    console.log(`[bootstrap] Sincronização inicial concluída. Total no catálogo: ${finalCount}.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Erro na sincronização inicial de criptomoedas:', err);
  }
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Docs available at       http://localhost:${port}/docs`);
  void bootstrapSyncIfEmpty();
});
