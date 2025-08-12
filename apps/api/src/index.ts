import { config as dotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root .env (../../.env)
dotenv({ path: path.resolve(__dirname, '../../..', '.env') });

import { env } from './lib/env';
import { buildApp } from './server/app';

const app = buildApp();
const port = Number(env.API_PORT ?? 3333);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Docs available at       http://localhost:${port}/docs`);
});
