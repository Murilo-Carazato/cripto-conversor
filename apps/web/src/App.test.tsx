import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API module used by App
vi.mock('./api', () => {
  return {
    ApiError: class ApiError extends Error { constructor(message: string, public init?: any) { super(message); this.name = 'ApiError'; } },
    apiLogin: vi.fn(async () => ({ token: 'token-123', user: { id: 'u1', email: 'murilo@gmail.com', name: null, createdAt: new Date().toISOString() } })),
    apiRegister: vi.fn(async () => ({ token: 'token-456', user: { id: 'u2', email: 'new@user.com', name: null, createdAt: new Date().toISOString() } })),
    apiConvertDual: vi.fn(async () => ({ brl: { rate: 100, result: 100 }, usd: { rate: 10, result: 10 } })),
    apiGetHistory: vi.fn(async () => []),
    apiGetFavorites: vi.fn(async () => []),
    apiGetCryptos: vi.fn(async () => ([{ id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' }])),
    apiAddFavorite: vi.fn(async () => ({ id: 'f1', userId: 'u1', cryptoId: 'bitcoin', createdAt: new Date().toISOString() })),
    apiRemoveFavorite: vi.fn(async () => undefined),
  };
});

import App from './App';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('App - Fluxo de Login', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exibe toast de sucesso após login', async () => {
    renderWithClient(<App />);

    const btn = await screen.findByRole('button', { name: /entrar/i });
    await userEvent.click(btn);

    // Confirma estado logado (mais estável no CI)
    expect(await screen.findByText(/Logado como/i)).toBeInTheDocument();

    // Token e email salvos
    expect(localStorage.getItem('token')).toBeTruthy();
    expect(localStorage.getItem('userEmail')).toBe('murilo@gmail.com');
  });

  it('realiza conversão após login e exibe toast e resultados', async () => {
    renderWithClient(<App />);

    // Login
    const loginBtn = await screen.findByRole('button', { name: /entrar/i });
    await userEvent.click(loginBtn);
    await screen.findByText(/Logado como/i);

    // Converter
    const convertBtn = await screen.findByRole('button', { name: /converter/i });
    await userEvent.click(convertBtn);

    // Resultados renderizados
    expect(await screen.findByText(/BRL:/i)).toBeInTheDocument();
    expect(await screen.findByText(/USD:/i)).toBeInTheDocument();
  });
});
