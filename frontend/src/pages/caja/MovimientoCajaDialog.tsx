// ABOUTME: Diálogo para registrar movimientos de caja (ingresos/egresos)
// ABOUTME: Permite capturar monto, concepto, método de pago y referencia

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
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

import { cajaService, TipoMovimientoCaja, MetodoPago, MovimientoData } from '@/services/cajaService';

interface MovimientoCajaDialogProps {
  open: boolean;
  tipo: 'ingreso' | 'egreso';
  onClose: () => void;
  onSuccess: () => void;
}

const MovimientoCajaDialog: React.FC<MovimientoCajaDialogProps> = ({
  open,
  tipo,
  onClose,
  onSuccess,
}) => {
  const [monto, setMonto] = useState<string>('');
  const [concepto, setConcepto] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser un número mayor a 0');
      return;
    }

    if (!concepto.trim()) {
      setError('El concepto es requerido');
      return;
    }

    setLoading(true);

    try {
      const data: MovimientoData = {
        tipo: tipo as TipoMovimientoCaja,
        monto: montoNum,
        concepto: concepto.trim(),
        metodoPago,
        referencia: referencia || undefined,
        observaciones: observaciones || undefined,
      };

      const response = await cajaService.registrarMovimiento(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al registrar movimiento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMonto('');
    setConcepto('');
    setMetodoPago('efectivo');
    setReferencia('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const isIngreso = tipo === 'ingreso';
  const IconComponent = isIngreso ? AddIcon : RemoveIcon;
  const titleColor = isIngreso ? 'success' : 'error';

  const conceptosComunes = isIngreso
    ? [
        'Cobro de cuenta de paciente',
        'Anticipo de hospitalización',
        'Venta de productos',
        'Pago de consulta',
        'Otros ingresos',
      ]
    : [
        'Cambio/vuelto',
        'Devolución a paciente',
        'Pago a proveedor',
        'Gastos menores',
        'Otros egresos',
      ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconComponent color={titleColor} />
        Registrar {isIngreso ? 'Ingreso' : 'Egreso'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0.01, step: 0.01 }}
            required
            fullWidth
            autoFocus
          />

          <TextField
            label="Concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            required
            fullWidth
            select
            SelectProps={{
              native: false,
            }}
          >
            {conceptosComunes.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select
              value={metodoPago}
              label="Método de Pago"
              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="mixto">Mixto</MenuItem>
            </Select>
          </FormControl>

          {metodoPago !== 'efectivo' && (
            <TextField
              label="Referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              fullWidth
              placeholder="Número de referencia, folio, etc."
            />
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
          color={titleColor}
          onClick={handleSubmit}
          disabled={loading || !monto || !concepto.trim()}
          startIcon={<IconComponent />}
        >
          {loading ? 'Registrando...' : `Registrar ${isIngreso ? 'Ingreso' : 'Egreso'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientoCajaDialog;
