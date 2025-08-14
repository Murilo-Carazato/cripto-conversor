import React from 'react';
import { TextField } from '@mui/material';

type Props = {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  fullWidth?: boolean;
  disabled?: boolean;
  min?: number;
  step?: number | 'any';
};

export default function AmountInput({
  label = 'Quantidade',
  value,
  onChange,
  fullWidth = true,
  disabled,
  min = 0,
  step = 'any',
}: Props) {
  return (
    <TextField
      type="number"
      label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      fullWidth={fullWidth}
      disabled={disabled}
      inputProps={{ min, step }}
    />
  );
}
