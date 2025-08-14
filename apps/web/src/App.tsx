import React from 'react';
import { Container, Paper, Typography, TextField, Button, Stack, Box, Alert, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiLogin, apiRegister, apiConvertDual, apiGetHistory, apiGetFavorites, apiAddFavorite, apiRemoveFavorite, type ConversionItem, type FavoriteItem, type LoginRegisterResponse } from './api';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CryptoSelect from './components/CryptoSelect';
import AmountInput from './components/AmountInput';
import ConvertButton from './components/ConvertButton';

const cryptos = [
  { id: 'bitcoin', label: 'Bitcoin (BTC)' },
  { id: 'ethereum', label: 'Ethereum (ETH)' },
  { id: 'tether', label: 'Tether (USDT)' },
];

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

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: apiGetFavorites,
    enabled: !!userEmail,
  });
  const historyQuery = useQuery({
    queryKey: ['history'],
    queryFn: () => apiGetHistory(20),
    enabled: !!userEmail,
  });

  const loginMut = useMutation<LoginRegisterResponse, Error>({
    mutationFn: () => apiLogin({ email, password }),
    onSuccess: (data: LoginRegisterResponse) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.user.email);
      setUserEmail(data.user.email);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
    onError: () => setError('Falha no login. Verifique credenciais.'),
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
    },
    onError: () => setError('Falha no cadastro. Verifique dados.'),
  });

  const convertMut = useMutation<{ brl: { rate: number; result: number }; usd: { rate: number; result: number } }, Error>({
    mutationFn: () => apiConvertDual({ from, amount }),
    onSuccess: (data: { brl: { rate: number; result: number }; usd: { rate: number; result: number } }) => {
      setResult({ brl: data.brl, usd: data.usd });
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
    onError: (e: Error) => setError((e as any)?.message || 'Erro na conversão'),
  });

  const addFavMut = useMutation({
    mutationFn: (crypto: string) => apiAddFavorite(crypto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeFavMut = useMutation({
    mutationFn: (crypto: string) => apiRemoveFavorite(crypto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
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
                <Button variant="contained" onClick={() => loginMut.mutate()} disabled={loginMut.isLoading}>
                  {loginMut.isLoading ? 'Entrando…' : 'Entrar'}
                </Button>
                <Button variant="text" onClick={() => setShowRegister(true)}>Cadastrar</Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => registerMut.mutate()} disabled={registerMut.isLoading}>
                  {registerMut.isLoading ? 'Cadastrando…' : 'Cadastrar'}
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
                cryptos={cryptos}
                favorites={favoritesQuery.data}
                toggleDisabled={addFavMut.isLoading || removeFavMut.isLoading}
                onToggleFavorite={(cryptoId, isFavorite) => {
                  return isFavorite ? removeFavMut.mutate(cryptoId) : addFavMut.mutate(cryptoId);
                }}
              />
            </Stack>
            <AmountInput value={amount} onChange={setAmount} />
            <Stack direction="row" spacing={1}>
              <ConvertButton onClick={() => convertMut.mutate()} loading={convertMut.isLoading} />
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
                      primary={`${h.crypto} × ${h.amount}`}
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
                const label = cryptos.find((c) => c.id === f.crypto)?.label ?? f.crypto;
                return (
                  <ListItem key={f.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => setFrom(f.crypto)}>Selecionar</Button>
                        <IconButton edge="end" aria-label="remover favorito" onClick={() => removeFavMut.mutate(f.crypto)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText primary={label} secondary={f.crypto} />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2">Você ainda não favoritou nenhuma criptomoeda.</Typography>
          ))}
        </Paper>
      )}

    </Container>
  );
}
