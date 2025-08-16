import React from 'react';
import { Container, Paper, Typography, TextField, Button, Stack, Box, Alert, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CryptoSelect from './CryptoSelect';
import AmountInput from './AmountInput';
import ConvertButton from './ConvertButton';
import type { ConversionItem, FavoriteItem } from '../api';

export type CryptoOption = { id: string; label: string };

type Props = {
  // Auth/UI state
  userEmail: string | null;
  showRegister: boolean;
  onToggleRegister: (show: boolean) => void;

  // Credentials
  email: string;
  password: string;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;

  // Crypto selection & amount
  cryptos: CryptoOption[];
  from: string;
  onChangeFrom: (id: string) => void;
  amount: number;
  onChangeAmount: (n: number) => void;

  // Data lists
  favorites: FavoriteItem[] | undefined;
  favoritesLoading: boolean;
  history: ConversionItem[] | undefined;
  historyLoading: boolean;

  // Actions
  onLogin: () => void;
  onRegister: () => void;
  onConvert: () => void;
  onLogout: () => void;
  onToggleFavorite: (cryptoId: string, isFavorite: boolean) => void;
  onRemoveFavorite: (cryptoId: string) => void;
  onSelectFavorite: (cryptoId: string) => void;

  // Loading flags
  loginPending: boolean;
  registerPending: boolean;
  convertPending: boolean;
  toggleDisabled: boolean;

  // Feedback
  error: string | null;
  result: null | { brl: { rate: number; result: number }; usd: { rate: number; result: number } };
};

export default function AppView({
  userEmail,
  showRegister,
  onToggleRegister,
  email,
  password,
  onChangeEmail,
  onChangePassword,
  cryptos,
  from,
  onChangeFrom,
  amount,
  onChangeAmount,
  favorites,
  favoritesLoading,
  history,
  historyLoading,
  onLogin,
  onRegister,
  onConvert,
  onLogout,
  onToggleFavorite,
  onRemoveFavorite,
  onSelectFavorite,
  loginPending,
  registerPending,
  convertPending,
  toggleDisabled,
  error,
  result,
}: Props) {
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
            <TextField label="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeEmail(e.target.value)} fullWidth />
            <TextField label="Senha" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangePassword(e.target.value)} fullWidth />
            {!showRegister ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onLogin} disabled={loginPending}>
                  {loginPending ? 'Entrando…' : 'Entrar'}
                </Button>
                <Button variant="text" onClick={() => onToggleRegister(true)}>Cadastrar</Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onRegister} disabled={registerPending}>
                  {registerPending ? 'Cadastrando…' : 'Cadastrar'}
                </Button>
                <Button variant="text" onClick={() => onToggleRegister(false)}>Voltar ao Login</Button>
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
                onChange={onChangeFrom}
                cryptos={cryptos}
                favorites={favorites}
                toggleDisabled={toggleDisabled}
                onToggleFavorite={onToggleFavorite}
              />
            </Stack>
            <AmountInput value={amount} onChange={onChangeAmount} />
            <Stack direction="row" spacing={1}>
              <ConvertButton onClick={onConvert} loading={convertPending} />
              <Button variant="outlined" onClick={onLogout}>Sair</Button>
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
            {historyLoading ? (
              <Typography variant="body2">Carregando…</Typography>
            ) : (
              <List dense>
                {(history ?? []).map((h: ConversionItem) => (
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
          {favoritesLoading ? (
            <Typography variant="body2">Carregando…</Typography>
          ) : ((favorites && favorites.length > 0) ? (
            <List dense>
              {favorites.map((f: FavoriteItem) => {
                const label = cryptos.find((c) => c.id === f.cryptoId)?.label ?? f.cryptoId;
                return (
                  <ListItem key={f.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => onSelectFavorite(f.cryptoId)}>Selecionar</Button>
                        <IconButton edge="end" aria-label="remover favorito" onClick={() => onRemoveFavorite(f.cryptoId)}>
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
    </Container>
  );
}
