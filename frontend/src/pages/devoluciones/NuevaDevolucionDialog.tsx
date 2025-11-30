// ABOUTME: Diálogo para crear nueva solicitud de devolución
// ABOUTME: Permite seleccionar cuenta, tipo, motivo y productos a devolver

import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  InputAdornment,
  Divider,
} from '@mui/material';
import { AssignmentReturn as DevolucionIcon } from '@mui/icons-material';

import {
  devolucionesService,
  TipoDevolucion,
  MotivoDevolucion,
  CrearDevolucionData,
} from '@/services/devolucionesService';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';

interface NuevaDevolucionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuentaPreseleccionada?: PatientAccount; // Opcional: cuenta preseleccionada desde POS
}

const NuevaDevolucionDialog: React.FC<NuevaDevolucionDialogProps> = ({
  open,
  onClose,
  onSuccess,
  cuentaPreseleccionada,
}) => {
  const [cuentas, setCuentas] = useState<PatientAccount[]>([]);
  const [motivos, setMotivos] = useState<MotivoDevolucion[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<PatientAccount | null>(cuentaPreseleccionada || null);
  const [tipo, setTipo] = useState<TipoDevolucion>('servicio');
  const [motivoId, setMotivoId] = useState<number | ''>('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [montoDevolucion, setMontoDevolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (cuentaPreseleccionada) {
      setSelectedCuenta(cuentaPreseleccionada);
    }
  }, [cuentaPreseleccionada]);

  const loadInitialData = async () => {
    try {
      // Cargar cuentas cerradas
      const cuentasResponse = await posService.getPatientAccounts({ estado: 'cerrada' });
      if (cuentasResponse.success && cuentasResponse.data) {
        setCuentas(cuentasResponse.data.accounts || []);
      }

      // Cargar motivos
      const motivosResponse = await devolucionesService.getMotivos();
      if (motivosResponse.success && motivosResponse.data) {
        setMotivos(Array.isArray(motivosResponse.data) ? motivosResponse.data : []);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedCuenta) {
      setError('Selecciona una cuenta');
      return;
    }

    if (!motivoId) {
      setError('Selecciona un motivo');
      return;
    }

    const monto = parseFloat(montoDevolucion);
    if (tipo !== 'producto' && (isNaN(monto) || monto <= 0)) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const data: CrearDevolucionData = {
        cuentaId: selectedCuenta.id,
        tipo,
        motivoId: motivoId as number,
        motivoDetalle: motivoDetalle || undefined,
        montoDevolucion: tipo !== 'producto' ? monto : undefined,
        observaciones: observaciones || undefined,
      };

      const response = await devolucionesService.crearDevolucion(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al crear devolución');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear devolución');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCuenta(cuentaPreseleccionada || null);
    setTipo('servicio');
    setMotivoId('');
    setMotivoDetalle('');
    setMontoDevolucion('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DevolucionIcon color="primary" />
        Nueva Solicitud de Devolución
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            Solo se pueden realizar devoluciones de cuentas cerradas (dentro de 24 horas para cajeros).
          </Alert>

          {/* Selección de cuenta */}
          <Autocomplete
            options={cuentas}
            value={selectedCuenta}
            onChange={(_, newValue) => setSelectedCuenta(newValue)}
            getOptionLabel={(option) =>
              `#${option.id} - ${option.paciente?.nombre || ''} ${option.paciente?.apellidoPaterno || ''}`
            }
            renderInput={(params) => (
              <TextField {...params} label="Cuenta de Paciente" required />
            )}
            disabled={!!cuentaPreseleccionada}
          />

          {selectedCuenta && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total de la cuenta: <strong>${parseFloat(selectedCuenta.totalCuenta?.toString() || '0').toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cerrada: {selectedCuenta.fechaCierre ? new Date(selectedCuenta.fechaCierre).toLocaleDateString() : '-'}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Tipo de devolución */}
          <FormControl fullWidth required>
            <InputLabel>Tipo de Devolución</InputLabel>
            <Select
              value={tipo}
              label="Tipo de Devolución"
              onChange={(e) => setTipo(e.target.value as TipoDevolucion)}
            >
              <MenuItem value="servicio">Servicio</MenuItem>
              <MenuItem value="producto">Producto</MenuItem>
              <MenuItem value="total_cuenta">Total de Cuenta</MenuItem>
            </Select>
          </FormControl>

          {/* Motivo */}
          <FormControl fullWidth required>
            <InputLabel>Motivo</InputLabel>
            <Select
              value={motivoId}
              label="Motivo"
              onChange={(e) => setMotivoId(e.target.value as number)}
            >
              {motivos.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.descripcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Detalle del motivo */}
          <TextField
            label="Detalle del motivo"
            value={motivoDetalle}
            onChange={(e) => setMotivoDetalle(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Explica brevemente la razón de la devolución"
          />

          {/* Monto (para servicios) */}
          {tipo !== 'producto' && (
            <TextField
              label="Monto a Devolver"
              type="number"
              value={montoDevolucion}
              onChange={(e) => setMontoDevolucion(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0.01, step: 0.01 }}
              required
              fullWidth
              helperText={
                tipo === 'total_cuenta'
                  ? 'Se devolverá el total de la cuenta'
                  : 'Ingresa el monto del servicio a devolver'
              }
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
          onClick={handleSubmit}
          disabled={loading || !selectedCuenta || !motivoId}
          startIcon={<DevolucionIcon />}
        >
          {loading ? 'Creando...' : 'Crear Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevaDevolucionDialog;
