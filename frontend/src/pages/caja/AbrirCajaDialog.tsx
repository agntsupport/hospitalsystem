// ABOUTME: Diálogo para abrir una nueva caja diaria
// ABOUTME: Permite seleccionar turno e ingresar saldo inicial

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { LockOpen as LockOpenIcon } from '@mui/icons-material';

import { cajaService, TurnoCaja, AbrirCajaData } from '@/services/cajaService';

interface AbrirCajaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AbrirCajaDialog: React.FC<AbrirCajaDialogProps> = ({ open, onClose, onSuccess }) => {
  const [turno, setTurno] = useState<TurnoCaja>('matutino');
  const [saldoInicial, setSaldoInicial] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const saldo = parseFloat(saldoInicial);
    if (isNaN(saldo) || saldo < 0) {
      setError('El saldo inicial debe ser un número válido mayor o igual a 0');
      return;
    }

    setLoading(true);

    try {
      const data: AbrirCajaData = {
        turno,
        saldoInicial: saldo,
        observaciones: observaciones || undefined,
      };

      const response = await cajaService.abrirCaja(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al abrir caja');
      }
    } catch (err: any) {
      setError(err.message || 'Error al abrir caja');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTurno('matutino');
    setSaldoInicial('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const getCurrentTurno = (): TurnoCaja => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 15) return 'matutino';
    if (hour >= 15 && hour < 23) return 'vespertino';
    return 'nocturno';
  };

  React.useEffect(() => {
    if (open) {
      setTurno(getCurrentTurno());
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockOpenIcon color="primary" />
        Abrir Caja Diaria
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa los datos para abrir tu caja del día. El turno se selecciona automáticamente según la hora actual.
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Turno</InputLabel>
            <Select
              value={turno}
              label="Turno"
              onChange={(e) => setTurno(e.target.value as TurnoCaja)}
            >
              <MenuItem value="matutino">Matutino (7:00 - 15:00)</MenuItem>
              <MenuItem value="vespertino">Vespertino (15:00 - 23:00)</MenuItem>
              <MenuItem value="nocturno">Nocturno (23:00 - 7:00)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Saldo Inicial (Fondo de Caja)"
            type="number"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            required
            fullWidth
            helperText="Cantidad de efectivo con la que inicias tu turno"
          />

          <TextField
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Notas adicionales sobre la apertura de caja"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !saldoInicial}
          startIcon={<LockOpenIcon />}
        >
          {loading ? 'Abriendo...' : 'Abrir Caja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AbrirCajaDialog;
