import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiLogin, apiRegister, apiConvertDual, apiGetHistory, apiGetFavorites, apiGetCryptos, apiAddFavorite, apiRemoveFavorite, type LoginRegisterResponse } from './api';
import AppView from './components/AppView';

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

  const cryptosQuery = useQuery({
    queryKey: ['cryptos'],
    queryFn: () => apiGetCryptos({ limit: 200 }),
  });

  const cryptoOptions = React.useMemo(
    () => (cryptosQuery.data ?? []).map((c) => ({ id: c.id, label: c.symbol ? `${c.name} (${c.symbol})` : c.name })),
    [cryptosQuery.data]
  );

  React.useEffect(() => {
    if (cryptoOptions.length > 0 && !cryptoOptions.some((c) => c.id === from)) {
      setFrom(cryptoOptions[0].id);
    }
  }, [cryptoOptions, from]);

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
    <AppView
      userEmail={userEmail}
      showRegister={showRegister}
      onToggleRegister={setShowRegister}
      email={email}
      password={password}
      onChangeEmail={setEmail}
      onChangePassword={setPassword}
      cryptos={cryptoOptions}
      from={from}
      onChangeFrom={setFrom}
      amount={amount}
      onChangeAmount={setAmount}
      favorites={favoritesQuery.data}
      favoritesLoading={favoritesQuery.isLoading}
      history={historyQuery.data}
      historyLoading={historyQuery.isLoading}
      onLogin={() => loginMut.mutate()}
      onRegister={() => registerMut.mutate()}
      onConvert={() => convertMut.mutate()}
      onLogout={handleLogout}
      onToggleFavorite={(cryptoId, isFavorite) => isFavorite ? removeFavMut.mutate(cryptoId) : addFavMut.mutate(cryptoId)}
      onRemoveFavorite={(cryptoId) => removeFavMut.mutate(cryptoId)}
      onSelectFavorite={(cryptoId) => setFrom(cryptoId)}
      loginPending={loginMut.isPending}
      registerPending={registerMut.isPending}
      convertPending={convertMut.isPending}
      toggleDisabled={addFavMut.isPending || removeFavMut.isPending}
      error={error}
      result={result}
    />
  );
}
