// ABOUTME: Diálogo para ver historial de cajas cerradas
// ABOUTME: Permite filtrar por cajero, fechas y ver detalles de cada caja

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { cajaService, CajaDiaria, EstadoCaja } from '@/services/cajaService';
import { useAuth } from '@/hooks/useAuth';

interface HistorialCajasDialogProps {
  open: boolean;
  onClose: () => void;
}

const HistorialCajasDialog: React.FC<HistorialCajasDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [cajas, setCajas] = useState<CajaDiaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.rol === 'administrador';

  const loadHistorial = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: 50,
      };

      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const response = await cajaService.getHistorial(params);

      if (response.success && response.data) {
        setCajas(response.data.cajas || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Establecer rango de fechas por defecto (último mes)
      const hoy = new Date();
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      setFechaFin(hoy.toISOString().split('T')[0]);
      setFechaInicio(hace30dias.toISOString().split('T')[0]);

      loadHistorial();
    }
  }, [open]);

  useEffect(() => {
    if (open && fechaInicio && fechaFin) {
      loadHistorial();
    }
  }, [fechaInicio, fechaFin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getEstadoColor = (estado: EstadoCaja) => {
    const colores: Record<EstadoCaja, 'success' | 'warning' | 'default'> = {
      abierta: 'success',
      en_arqueo: 'warning',
      cerrada: 'default',
    };
    return colores[estado];
  };

  const getDiferenciaColor = (diferencia: number | null | undefined) => {
    if (!diferencia || diferencia === 0) return 'success';
    return diferencia > 0 ? 'warning' : 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        Historial de Cajas
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={loadHistorial} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha Inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha Fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cajas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No se encontraron cajas en el rango de fechas seleccionado
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cajero</TableCell>
                  <TableCell>Turno</TableCell>
                  <TableCell>Apertura</TableCell>
                  <TableCell>Cierre</TableCell>
                  <TableCell align="right">S. Inicial</TableCell>
                  <TableCell align="right">S. Final</TableCell>
                  <TableCell align="right">Diferencia</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cajas.map((caja) => (
                  <TableRow key={caja.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{caja.numero}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {caja.cajero?.empleado
                        ? `${caja.cajero.empleado.nombre} ${caja.cajero.empleado.apellidos}`
                        : caja.cajero?.username || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={caja.turno.charAt(0).toUpperCase() + caja.turno.slice(1)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(caja.fechaApertura)}</TableCell>
                    <TableCell>{caja.fechaCierre ? formatDateTime(caja.fechaCierre) : '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(caja.saldoInicial)}</TableCell>
                    <TableCell align="right">
                      {caja.saldoFinalContado ? formatCurrency(caja.saldoFinalContado) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {caja.diferencia !== undefined && caja.diferencia !== null ? (
                        <Chip
                          label={formatCurrency(caja.diferencia)}
                          color={getDiferenciaColor(caja.diferencia)}
                          size="small"
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={caja.estado.charAt(0).toUpperCase() + caja.estado.slice(1)}
                        color={getEstadoColor(caja.estado)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialCajasDialog;
