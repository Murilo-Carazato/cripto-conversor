import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, ListItemText, IconButton } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import type { FavoriteItem } from '../api';

export type CryptoOption = { id: string; label: string };

type Props = {
  labelId?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  cryptos: CryptoOption[];
  favorites?: FavoriteItem[];
  onToggleFavorite?: (cryptoId: string, isFavorite: boolean) => void;
  toggleDisabled?: boolean;
};

export default function CryptoSelect({
  labelId = 'crypto-select-label',
  label = 'Cripto',
  value,
  onChange,
  cryptos,
  favorites,
  onToggleFavorite,
  toggleDisabled,
}: Props) {
  const isFav = React.useCallback(
    (id: string) => !!favorites?.some((f) => f.cryptoId === id),
    [favorites]
  );

  return (
    <FormControl fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        value={value}
        label={label}
        onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
      >
        {cryptos.map((c) => (
          <MenuItem
            key={c.id}
            value={c.id}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
          >
            <ListItemText primary={c.label} />
            <IconButton
              size="small"
              edge="end"
              aria-label="toggle favorite"
              disabled={toggleDisabled}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleFavorite) onToggleFavorite(c.id, isFav(c.id));
              }}
            >
              {isFav(c.id) ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </IconButton>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
