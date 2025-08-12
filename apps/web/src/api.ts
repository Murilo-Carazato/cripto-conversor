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

export async function apiConvert({ from, to, amount }: { from: string; to: string; amount: number }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Não autenticado');
  const url = new URL(`${BASE_URL}/convert`);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('amount', String(amount));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Conversão falhou');
  return res.json();
}
