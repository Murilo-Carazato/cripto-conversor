import React from 'react';
import { Button } from '@mui/material';

type Props = {
  onClick: () => void;
  loading?: boolean;
  children?: React.ReactNode;
};

export default function ConvertButton({ onClick, loading, children }: Props) {
  return (
    <Button variant="contained" onClick={onClick} disabled={!!loading}>
      {loading ? 'Convertendo…' : (children ?? 'Converter')}
    </Button>
  );
}
