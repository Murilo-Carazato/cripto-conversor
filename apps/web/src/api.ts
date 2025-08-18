const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status?: number;
  requestId?: string;
  constructor(message: string, init?: { status?: number; requestId?: string }) {
    super(message);
    this.status = init?.status;
    this.requestId = init?.requestId;
  }
}

async function http<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<{ data: T; requestId?: string }> {
  const res = await fetch(input, init);
  const requestId = res.headers.get('x-request-id') ?? undefined;
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      message = json?.message || message;
    } catch {
      // ignore body parse errors
    }
    throw new ApiError(message, { status: res.status, requestId });
  }
  // try parse JSON if present
  let data: any = undefined;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  }
  return { data: data as T, requestId };
}

export async function apiLogin({ email, password }: { email: string; password: string }) {
  const { data } = await http(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return data as LoginRegisterResponse;
}

export type LoginRegisterResponse = {
  token: string;
  user: { id: string; email: string; name?: string | null; createdAt: string };
};

export async function apiRegister({ email, password, name }: { email: string; password: string; name?: string }) {
  const { data } = await http<LoginRegisterResponse>(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return data;
}

export type CryptoItem = { id: string; name: string; symbol: string | null };

export async function apiGetCryptos(params?: { q?: string; limit?: number }) {
  const url = new URL(`${BASE_URL}/cryptos`);
  if (params?.q) url.searchParams.set('q', params.q);
  if (typeof params?.limit === 'number') url.searchParams.set('limit', String(params.limit));
  const { data } = await http<CryptoItem[]>(url.toString(), { headers: { accept: 'application/json' } });
  return data;
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
  const { data } = await http<ConversionItem[]>(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export type FavoriteItem = { id: string; userId: string; cryptoId: string; createdAt: string };

export async function apiGetFavorites() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const { data } = await http<FavoriteItem[]>(`${BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function apiAddFavorite(cryptoId: string) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const { data } = await http<FavoriteItem>(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cryptoId }),
  });
  return data;
}

export async function apiRemoveFavorite(cryptoId: string) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  await http<void>(`${BASE_URL}/favorites/${cryptoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiSyncCryptos(limit = 200) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const { data } = await http<{ message: string; synced: number; total: number }>(`${BASE_URL}/cryptos/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ limit }),
  });
  return data;
}

export async function apiConvertDual({ from, amount }: { from: string; amount: number }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const u = new URL(`${BASE_URL}/convert/dual`);
  u.searchParams.set('from', from);
  u.searchParams.set('amount', String(amount));
  const { data } = await http<{ brl: { rate: number; result: number }, usd: { rate: number; result: number } }>(
    u.toString(),
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return { brl: (data as any).brl, usd: (data as any).usd };
}
