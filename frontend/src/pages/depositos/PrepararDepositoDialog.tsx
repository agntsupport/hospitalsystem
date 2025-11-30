// ABOUTME: Diálogo para preparar un nuevo depósito bancario
// ABOUTME: Permite seleccionar cuenta, montos de efectivo y cheques

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
  Alert,
  Box,
  Typography,
  InputAdornment,
  Divider,
} from '@mui/material';
import { AccountBalance } from '@mui/icons-material';

import {
  bancosService,
  CuentaBancaria,
  CrearDepositoData,
} from '@/services/bancosService';
import { formatCurrency } from '@/utils/formatters';

interface PrepararDepositoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuentas: CuentaBancaria[];
}

const PrepararDepositoDialog: React.FC<PrepararDepositoDialogProps> = ({
  open,
  onClose,
  onSuccess,
  cuentas,
}) => {
  const [cuentaId, setCuentaId] = useState<number | ''>('');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoCheques, setMontoCheques] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularTotal = (): number => {
    const efectivo = parseFloat(montoEfectivo) || 0;
    const cheques = parseFloat(montoCheques) || 0;
    return efectivo + cheques;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!cuentaId) {
      setError('Selecciona una cuenta bancaria');
      return;
    }

    const efectivo = parseFloat(montoEfectivo) || 0;
    const cheques = parseFloat(montoCheques) || 0;

    if (efectivo <= 0 && cheques <= 0) {
      setError('Debes ingresar al menos un monto (efectivo o cheques)');
      return;
    }

    setLoading(true);

    try {
      const data: CrearDepositoData = {
        cuentaBancariaId: cuentaId as number,
        montoEfectivo: efectivo,
        montoCheques: cheques,
        observaciones: observaciones.trim() || undefined,
      };

      const response = await bancosService.prepararDeposito(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al preparar depósito');
      }
    } catch (err: any) {
      setError(err.message || 'Error al preparar depósito');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCuentaId('');
    setMontoEfectivo('');
    setMontoCheques('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const selectedCuenta = cuentas.find((c) => c.id === cuentaId);
  const total = calcularTotal();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="primary" />
        Preparar Depósito Bancario
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="info">
            Prepara el depósito que llevarás al banco. Una vez depositado, marca como "Depositado"
            para que el administrador pueda confirmar con la ficha bancaria.
          </Alert>

          {/* Selección de cuenta */}
          <FormControl fullWidth required>
            <InputLabel>Cuenta Bancaria</InputLabel>
            <Select
              value={cuentaId}
              label="Cuenta Bancaria"
              onChange={(e) => setCuentaId(e.target.value as number)}
            >
              {cuentas.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.alias} - {c.banco} ({c.numeroCuenta})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCuenta && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Banco: <strong>{selectedCuenta.banco}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Número de Cuenta: <strong>{selectedCuenta.numeroCuenta}</strong>
              </Typography>
              {selectedCuenta.clabe && (
                <Typography variant="body2" color="text.secondary">
                  CLABE: <strong>{selectedCuenta.clabe}</strong>
                </Typography>
              )}
            </Box>
          )}

          <Divider />

          {/* Montos */}
          <TextField
            label="Monto en Efectivo"
            type="number"
            value={montoEfectivo}
            onChange={(e) => setMontoEfectivo(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
            helperText="Dinero en billetes y monedas"
          />

          <TextField
            label="Monto en Cheques"
            type="number"
            value={montoCheques}
            onChange={(e) => setMontoCheques(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
            helperText="Suma de cheques a depositar"
          />

          {/* Total */}
          {total > 0 && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total a Depositar:
              </Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {formatCurrency(total)}
              </Typography>
            </Box>
          )}

          <TextField
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
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
          disabled={loading || !cuentaId || total <= 0}
          startIcon={<AccountBalance />}
        >
          {loading ? 'Preparando...' : 'Preparar Depósito'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrepararDepositoDialog;
