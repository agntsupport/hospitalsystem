// ABOUTME: Diálogo para solicitar un descuento en una cuenta de paciente
// ABOUTME: Permite seleccionar cuenta, política, tipo de cálculo y monto

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
  Chip,
} from '@mui/material';
import { LocalOffer as DescuentoIcon } from '@mui/icons-material';

import {
  descuentosService,
  PoliticaDescuento,
  TipoDescuento,
  TipoCalculo,
  CrearDescuentoData,
} from '@/services/descuentosService';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';
import { formatCurrency } from '@/utils/formatters';

interface SolicitarDescuentoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  politicas: PoliticaDescuento[];
  cuentaPreseleccionada?: PatientAccount;
}

const SolicitarDescuentoDialog: React.FC<SolicitarDescuentoDialogProps> = ({
  open,
  onClose,
  onSuccess,
  politicas,
  cuentaPreseleccionada,
}) => {
  const [cuentas, setCuentas] = useState<PatientAccount[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<PatientAccount | null>(
    cuentaPreseleccionada || null
  );
  const [selectedPolitica, setSelectedPolitica] = useState<PoliticaDescuento | null>(null);
  const [tipo, setTipo] = useState<TipoDescuento>('cortesia_medica');
  const [tipoCalculo, setTipoCalculo] = useState<TipoCalculo>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState('');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCuentas();
    }
  }, [open]);

  useEffect(() => {
    if (cuentaPreseleccionada) {
      setSelectedCuenta(cuentaPreseleccionada);
    }
  }, [cuentaPreseleccionada]);

  useEffect(() => {
    if (selectedPolitica) {
      setTipo(selectedPolitica.tipo);
      setTipoCalculo('porcentaje');
      setValorDescuento(selectedPolitica.porcentajeMaximo.toString());
    }
  }, [selectedPolitica]);

  const loadCuentas = async () => {
    try {
      const response = await posService.getPatientAccounts({ estado: 'abierta' });
      if (response.success && response.data) {
        setCuentas(response.data.accounts || []);
      }
    } catch (err) {
      console.error('Error cargando cuentas:', err);
    }
  };

  const calcularDescuento = (): number => {
    if (!selectedCuenta || !valorDescuento) return 0;
    const base = parseFloat(selectedCuenta.totalCuenta?.toString() || '0');
    const valor = parseFloat(valorDescuento);

    if (tipoCalculo === 'porcentaje') {
      return (base * valor) / 100;
    }
    return Math.min(valor, base);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedCuenta) {
      setError('Selecciona una cuenta');
      return;
    }

    if (!motivoSolicitud.trim()) {
      setError('Ingresa el motivo de la solicitud');
      return;
    }

    const valor = parseFloat(valorDescuento);
    if (isNaN(valor) || valor <= 0) {
      setError('El valor del descuento debe ser mayor a 0');
      return;
    }

    if (tipoCalculo === 'porcentaje' && valor > 100) {
      setError('El porcentaje no puede ser mayor a 100%');
      return;
    }

    if (selectedPolitica && valor > selectedPolitica.porcentajeMaximo) {
      setError(`El descuento excede el máximo permitido (${selectedPolitica.porcentajeMaximo}%)`);
      return;
    }

    setLoading(true);

    try {
      const data: CrearDescuentoData = {
        cuentaId: selectedCuenta.id,
        politicaId: selectedPolitica?.id,
        tipo,
        tipoCalculo,
        valorDescuento: valor,
        motivoSolicitud: motivoSolicitud.trim(),
        observaciones: observaciones.trim() || undefined,
      };

      const response = await descuentosService.solicitarDescuento(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al solicitar descuento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al solicitar descuento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCuenta(cuentaPreseleccionada || null);
    setSelectedPolitica(null);
    setTipo('cortesia_medica');
    setTipoCalculo('porcentaje');
    setValorDescuento('');
    setMotivoSolicitud('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const montoDescuento = calcularDescuento();
  const politicasActivas = politicas.filter(p => p.activo);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescuentoIcon color="primary" />
        Solicitar Descuento
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                Total de la cuenta:{' '}
                <strong>{formatCurrency(parseFloat(selectedCuenta.totalCuenta?.toString() || '0'))}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saldo pendiente:{' '}
                <strong>{formatCurrency(parseFloat(selectedCuenta.saldoPendiente?.toString() || '0'))}</strong>
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Selección de política */}
          <FormControl fullWidth>
            <InputLabel>Política de Descuento (opcional)</InputLabel>
            <Select
              value={selectedPolitica?.id || ''}
              label="Política de Descuento (opcional)"
              onChange={(e) => {
                const politica = politicasActivas.find(p => p.id === e.target.value);
                setSelectedPolitica(politica || null);
              }}
            >
              <MenuItem value="">Sin política específica</MenuItem>
              {politicasActivas.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre} (máx. {p.porcentajeMaximo}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tipo de descuento */}
          <FormControl fullWidth required>
            <InputLabel>Tipo de Descuento</InputLabel>
            <Select
              value={tipo}
              label="Tipo de Descuento"
              onChange={(e) => setTipo(e.target.value as TipoDescuento)}
              disabled={!!selectedPolitica}
            >
              <MenuItem value="cortesia_medica">Cortesía Médica</MenuItem>
              <MenuItem value="empleado_hospital">Empleado Hospital</MenuItem>
              <MenuItem value="convenio_empresa">Convenio Empresa</MenuItem>
              <MenuItem value="promocion_temporal">Promoción Temporal</MenuItem>
              <MenuItem value="ajuste_precio">Ajuste de Precio</MenuItem>
              <MenuItem value="redondeo">Redondeo</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </Select>
          </FormControl>

          {/* Tipo de cálculo y valor */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Tipo Cálculo</InputLabel>
              <Select
                value={tipoCalculo}
                label="Tipo Cálculo"
                onChange={(e) => setTipoCalculo(e.target.value as TipoCalculo)}
              >
                <MenuItem value="porcentaje">Porcentaje</MenuItem>
                <MenuItem value="monto_fijo">Monto Fijo</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={tipoCalculo === 'porcentaje' ? 'Porcentaje' : 'Monto'}
              type="number"
              value={valorDescuento}
              onChange={(e) => setValorDescuento(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {tipoCalculo === 'porcentaje' ? '%' : 'MXN'}
                  </InputAdornment>
                ),
              }}
              inputProps={{
                min: 0,
                max: tipoCalculo === 'porcentaje' ? 100 : undefined,
                step: tipoCalculo === 'porcentaje' ? 0.1 : 0.01,
              }}
              required
              fullWidth
            />
          </Box>

          {/* Preview del descuento */}
          {montoDescuento > 0 && (
            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
              <Typography variant="body2" color="text.secondary">
                Descuento a aplicar:
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                -{formatCurrency(montoDescuento)}
              </Typography>
              {selectedPolitica?.requiereAutorizacion && (
                <Chip
                  label="Requiere autorización"
                  color="warning"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}

          {/* Motivo */}
          <TextField
            label="Motivo de la solicitud"
            value={motivoSolicitud}
            onChange={(e) => setMotivoSolicitud(e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
            placeholder="Explica la razón del descuento solicitado"
          />

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
          disabled={loading || !selectedCuenta || !valorDescuento || !motivoSolicitud.trim()}
          startIcon={<DescuentoIcon />}
        >
          {loading ? 'Solicitando...' : 'Solicitar Descuento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SolicitarDescuentoDialog;
