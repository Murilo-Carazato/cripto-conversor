import React from 'react';
import { Container, Paper, Typography, TextField, Button, Stack, Box, MenuItem, Select, InputLabel, FormControl, Alert } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { apiLogin, apiConvert } from './api';

const cryptos = [
  { id: 'bitcoin', label: 'Bitcoin (BTC)' },
  { id: 'ethereum', label: 'Ethereum (ETH)' },
  { id: 'tether', label: 'Tether (USDT)' },
];

const fiats = [
  { id: 'brl', label: 'Real (BRL)' },
  { id: 'usd', label: 'Dollar (USD)' },
  { id: 'eur', label: 'Euro (EUR)' },
];

export default function App() {
  const [email, setEmail] = React.useState('murilo@gmail.com');
  const [password, setPassword] = React.useState('123456');
  const [from, setFrom] = React.useState('bitcoin');
  const [to, setTo] = React.useState('brl');
  const [amount, setAmount] = React.useState(1);
  const [result, setResult] = React.useState<null | { rate: number; result: number }>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(localStorage.getItem('userEmail'));

  const loginMut = useMutation({
    mutationFn: () => apiLogin({ email, password }),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.user.email);
      setUserEmail(data.user.email);
      setError(null);
    },
    onError: () => setError('Falha no login. Verifique credenciais.'),
  });

  const convertMut = useMutation({
    mutationFn: () => apiConvert({ from, to, amount }),
    onSuccess: (data) => {
      setResult({ rate: data.rate, result: data.result });
      setError(null);
    },
    onError: (e: any) => setError(e?.message || 'Erro na conversão'),
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUserEmail(null);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          Cripto Conversor
        </Typography>

        {!userEmail ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1">Login</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button variant="contained" onClick={() => loginMut.mutate()} disabled={loginMut.isLoading}>
              {loginMut.isLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="success">Logado como {userEmail}</Alert>
            <Stack direction="row" spacing={1}>
              <FormControl fullWidth>
                <InputLabel id="from-label">Cripto</InputLabel>
                <Select labelId="from-label" value={from} label="Cripto" onChange={(e) => setFrom(e.target.value)}>
                  {cryptos.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="to-label">Moeda</InputLabel>
                <Select labelId="to-label" value={to} label="Moeda" onChange={(e) => setTo(e.target.value)}>
                  {fiats.map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField type="number" label="Quantidade" value={amount} onChange={(e) => setAmount(Number(e.target.value))} fullWidth />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => convertMut.mutate()} disabled={convertMut.isLoading}>
                {convertMut.isLoading ? 'Convertendo…' : 'Converter'}
              </Button>
              <Button variant="outlined" onClick={handleLogout}>Sair</Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {result && (
              <Box>
                <Typography variant="body1">Taxa: {result.rate}</Typography>
                <Typography variant="h6">Resultado: {result.result}</Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
