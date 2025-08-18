import React from 'react';
import { Container, Paper, Typography, TextField, Button, Stack, Box, Alert, Divider, List, ListItem, ListItemText, IconButton, Snackbar, type AlertColor } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiLogin, apiRegister, apiConvertDual, apiGetHistory, apiGetFavorites, apiGetCryptos, apiAddFavorite, apiRemoveFavorite, type ConversionItem, type FavoriteItem, type LoginRegisterResponse, ApiError, type CryptoItem } from './api';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CryptoSelect from './components/CryptoSelect';
import AmountInput from './components/AmountInput';
import ConvertButton from './components/ConvertButton';

// Criptos serão carregadas dinamicamente da API

// Conversion result will always be shown in BRL and USD per requirements

export default function App() {
  const [email, setEmail] = React.useState('murilo@gmail.com');
  const [password, setPassword] = React.useState('123456');
  const [from, setFrom] = React.useState('bitcoin');
  const [amount, setAmount] = React.useState(1);
  const [result, setResult] = React.useState<null | { brl: { rate: number; result: number }; usd: { rate: number; result: number } }>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(localStorage.getItem('userEmail'));
  const [showRegister, setShowRegister] = React.useState(false);
  const queryClient = useQueryClient();

  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });
  const showToast = (message: string, severity: AlertColor = 'info') => setSnack({ open: true, message, severity });
  const closeToast = () => setSnack((s) => ({ ...s, open: false }));

  function formatApiError(e: unknown, fallback: string) {
    const isApi = e instanceof ApiError;
    const msg = isApi ? (e as ApiError).message : (e as any)?.message || fallback;
    const rid = isApi ? (e as ApiError).requestId : undefined;
    return rid ? `${msg} (id: ${rid})` : msg;
  }

  const favoritesQuery = useQuery<FavoriteItem[], Error>({
    queryKey: ['favorites'],
    queryFn: apiGetFavorites,
    enabled: !!userEmail,
  });
  const historyQuery = useQuery<ConversionItem[], Error>({
    queryKey: ['history'],
    queryFn: () => apiGetHistory(20) as Promise<ConversionItem[]>,
    enabled: !!userEmail,
  });

  const cryptosQuery = useQuery<CryptoItem[], Error>({
    queryKey: ['cryptos'],
    queryFn: () => apiGetCryptos({ limit: 200 }) as Promise<CryptoItem[]>,
  });

  const cryptoOptions = React.useMemo(() => {
    const list: CryptoItem[] = cryptosQuery.data ?? [];
    return list.map((c: CryptoItem) => ({ id: c.id, label: c.symbol ? `${c.name} (${c.symbol})` : c.name }));
  }, [cryptosQuery.data]);

  React.useEffect(() => {
    if (cryptoOptions.length > 0 && !cryptoOptions.some((c) => c.id === from)) {
      setFrom(cryptoOptions[0].id);
    }
  }, [cryptoOptions, from]);

  // Show toasts for query errors (React Query v5: no onError in useQuery)
  React.useEffect(() => {
    if (favoritesQuery.isError) showToast(formatApiError(favoritesQuery.error, 'Falha ao buscar favoritos'), 'error');
  }, [favoritesQuery.isError]);
  React.useEffect(() => {
    if (historyQuery.isError) showToast(formatApiError(historyQuery.error, 'Falha ao buscar histórico'), 'error');
  }, [historyQuery.isError]);
  React.useEffect(() => {
    if (cryptosQuery.isError) showToast(formatApiError(cryptosQuery.error, 'Falha ao buscar criptos'), 'error');
  }, [cryptosQuery.isError]);

  const loginMut = useMutation<LoginRegisterResponse, Error>({
    mutationFn: () => apiLogin({ email, password }),
    onSuccess: (data: LoginRegisterResponse) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.user.email);
      setUserEmail(data.user.email);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      showToast('Login realizado com sucesso!', 'success');
    },
    onError: (e: unknown) => {
      const msg = formatApiError(e, 'Falha no login. Verifique credenciais.');
      setError(msg);
      showToast(msg, 'error');
    },
  });

  const registerMut = useMutation<LoginRegisterResponse, Error>({
    mutationFn: () => apiRegister({ email, password }),
    onSuccess: (data: LoginRegisterResponse) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.user.email);
      setUserEmail(data.user.email);
      setError(null);
      setShowRegister(false);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      showToast('Cadastro realizado com sucesso!', 'success');
    },
    onError: (e: unknown) => {
      const msg = formatApiError(e, 'Falha no cadastro. Verifique dados.');
      setError(msg);
      showToast(msg, 'error');
    },
  });

  const convertMut = useMutation<{ brl: { rate: number; result: number }; usd: { rate: number; result: number } }, Error>({
    mutationFn: () => apiConvertDual({ from, amount }),
    onSuccess: (data: { brl: { rate: number; result: number }; usd: { rate: number; result: number } }) => {
      setResult({ brl: data.brl, usd: data.usd });
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['history'] });
      showToast('Conversão realizada!', 'success');
    },
    onError: (e: unknown) => {
      const msg = formatApiError(e, 'Erro na conversão');
      setError(msg);
      showToast(msg, 'error');
    },
  });

  const addFavMut = useMutation({
    mutationFn: (crypto: string) => apiAddFavorite(crypto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      showToast('Adicionado aos favoritos', 'success');
    },
    onError: (e: unknown) => showToast(formatApiError(e, 'Falha ao favoritar'), 'error'),
  });

  const removeFavMut = useMutation({
    mutationFn: (crypto: string) => apiRemoveFavorite(crypto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      showToast('Removido dos favoritos', 'success');
    },
    onError: (e: unknown) => showToast(formatApiError(e, 'Falha ao desfavoritar'), 'error'),
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    setResult(null);
    queryClient.clear();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          Cripto Conversor
        </Typography>

        {!userEmail ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1">{showRegister ? 'Cadastro' : 'Login'}</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} fullWidth />
            <TextField label="Senha" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} fullWidth />
            {!showRegister ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => loginMut.mutate()} disabled={loginMut.isPending}>
                  {loginMut.isPending ? 'Entrando…' : 'Entrar'}
                </Button>
                <Button variant="text" onClick={() => setShowRegister(true)}>Cadastrar</Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => registerMut.mutate()} disabled={registerMut.isPending}>
                  {registerMut.isPending ? 'Cadastrando…' : 'Cadastrar'}
                </Button>
                <Button variant="text" onClick={() => setShowRegister(false)}>Voltar ao Login</Button>
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="success">Logado como {userEmail}</Alert>
            <Stack direction="row" spacing={1} alignItems="center">
              <CryptoSelect
                labelId="from-label"
                label="Cripto"
                value={from}
                onChange={setFrom}
                cryptos={cryptoOptions}
                favorites={favoritesQuery.data}
                toggleDisabled={addFavMut.isPending || removeFavMut.isPending}
                onToggleFavorite={(cryptoId, isFavorite) => {
                  return isFavorite ? removeFavMut.mutate(cryptoId) : addFavMut.mutate(cryptoId);
                }}
              />
            </Stack>
            <AmountInput value={amount} onChange={setAmount} />
            <Stack direction="row" spacing={1}>
              <ConvertButton onClick={() => convertMut.mutate()} loading={convertMut.isPending} />
              <Button variant="outlined" onClick={handleLogout}>Sair</Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {result && (
              <Box>
                <Typography variant="subtitle1">Resultado</Typography>
                <Typography variant="body2">BRL (taxa): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.brl.rate)}</Typography>
                <Typography variant="h6">BRL: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.brl.result)}</Typography>
                <Typography variant="body2">USD (rate): {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.usd.rate)}</Typography>
                <Typography variant="h6">USD: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.usd.result)}</Typography>
              </Box>
            )}

            <Divider />
            <Typography variant="h6">Histórico</Typography>
            {historyQuery.isLoading ? (
              <Typography variant="body2">Carregando…</Typography>
            ) : (
              <List dense>
                {historyQuery.data?.map((h: ConversionItem) => (
                  <ListItem key={h.id}>
                    <ListItemText
                      primary={`${h.cryptoId} × ${h.amount}`}
                      secondary={`BRL ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.brlResult)} | USD ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(h.usdResult)} — ${new Date(h.createdAt).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        )}
      </Paper>

      {userEmail && (
        <Paper sx={{ p: 3, mt: 2 }} elevation={3}>
          <Typography variant="h6" gutterBottom>Meus Favoritos</Typography>
          {favoritesQuery.isLoading ? (
            <Typography variant="body2">Carregando…</Typography>
          ) : (favoritesQuery.data && favoritesQuery.data.length > 0 ? (
            <List dense>
              {favoritesQuery.data.map((f: FavoriteItem) => {
                const label = cryptoOptions.find((c) => c.id === f.cryptoId)?.label ?? f.cryptoId;
                return (
                  <ListItem key={f.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => setFrom(f.cryptoId)}>Selecionar</Button>
                        <IconButton edge="end" aria-label="remover favorito" onClick={() => removeFavMut.mutate(f.cryptoId)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText primary={label} secondary={f.cryptoId} />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2">Você ainda não favoritou nenhuma criptomoeda.</Typography>
          ))}
        </Paper>
      )}

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeToast} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}
