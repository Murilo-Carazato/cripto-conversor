const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function apiLogin({ email, password }: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login falhou');
  return res.json();
}

export type LoginRegisterResponse = {
  token: string;
  user: { id: string; email: string; name?: string | null; createdAt: string };
};

export async function apiRegister({ email, password, name }: { email: string; password: string; name?: string }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error('Registro falhou');
  return res.json() as Promise<LoginRegisterResponse>;
}

export type CryptoItem = { id: string; name: string; symbol: string | null };

export async function apiGetCryptos(params?: { q?: string; limit?: number }) {
  const url = new URL(`${BASE_URL}/cryptos`);
  if (params?.q) url.searchParams.set('q', params.q);
  if (typeof params?.limit === 'number') url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('Falha ao buscar criptomoedas');
  return res.json() as Promise<CryptoItem[]>;
}

export type ConversionItem = {
  id: string;
  userId: string;
  cryptoId: string;
  amount: number;
  brlRate: number;
  brlResult: number;
  usdRate: number;
  usdResult: number;
  createdAt: string;
};

export async function apiGetHistory(take = 20) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const url = new URL(`${BASE_URL}/history`);
  url.searchParams.set('take', String(take));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Falha ao buscar histórico');
  return res.json() as Promise<ConversionItem[]>;
}

export type FavoriteItem = { id: string; userId: string; cryptoId: string; createdAt: string };

export async function apiGetFavorites() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const res = await fetch(`${BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Falha ao buscar favoritos');
  return res.json() as Promise<FavoriteItem[]>;
}

export async function apiAddFavorite(cryptoId: string) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cryptoId }),
  });
  if (!res.ok) throw new Error('Falha ao favoritar');
  return res.json() as Promise<FavoriteItem>;
}

export async function apiRemoveFavorite(cryptoId: string) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const res = await fetch(`${BASE_URL}/favorites/${cryptoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao desfavoritar');
}

export async function apiConvertDual({ from, amount }: { from: string; amount: number }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const u = new URL(`${BASE_URL}/convert/dual`);
  u.searchParams.set('from', from);
  u.searchParams.set('amount', String(amount));
  const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Conversão falhou');
  const json = await res.json() as { brl: { rate: number; result: number }, usd: { rate: number; result: number } };
  return { brl: json.brl, usd: json.usd };
}
