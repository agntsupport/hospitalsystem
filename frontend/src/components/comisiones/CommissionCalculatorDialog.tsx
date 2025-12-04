// ABOUTME: Diálogo para calcular y generar comisiones para un periodo.
// ABOUTME: Muestra preview de comisiones por médico antes de generar.

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import comisionesService, { ComisionCalculada, ResumenCalculo } from '../../services/comisionesService';

interface CommissionCalculatorDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CommissionCalculatorDialog: React.FC<CommissionCalculatorDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [resumen, setResumen] = useState<ResumenCalculo | null>(null);
  const [comisiones, setComisiones] = useState<ComisionCalculada[]>([]);
  const [expandedMedico, setExpandedMedico] = useState<number | null>(null);
  const [selectedMedicos, setSelectedMedicos] = useState<number[]>([]);

  // Calcular comisiones
  const handleCalcular = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Seleccione las fechas del periodo');
      return;
    }

    setLoading(true);
    try {
      const response = await comisionesService.calcularComisiones(fechaInicio, fechaFin);
      setResumen(response.resumen);
      setComisiones(response.comisiones);
      setSelectedMedicos(response.comisiones.map(c => c.medicoId));

      if (response.comisiones.length === 0) {
        toast.info('No se encontraron cuentas cerradas con médico tratante en este periodo');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al calcular: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Generar comisiones seleccionadas
  const handleGenerarComisiones = useCallback(async () => {
    const comisionesSeleccionadas = comisiones.filter(c => selectedMedicos.includes(c.medicoId));

    if (comisionesSeleccionadas.length === 0) {
      toast.error('Seleccione al menos un médico');
      return;
    }

    setGenerating(true);
    let generadas = 0;
    let errores = 0;

    for (const comision of comisionesSeleccionadas) {
      try {
        await comisionesService.generarComision({
          medicoId: comision.medicoId,
          fechaInicio,
          fechaFin,
          nombreMedico: comision.nombreMedico,
          especialidad: comision.especialidad,
          cedulaProfesional: comision.cedulaProfesional,
          totalCuentas: comision.totalCuentas,
          montoFacturado: comision.totalFacturado,
          montoComision: comision.montoComision,
        });
        generadas++;
      } catch {
        errores++;
      }
    }

    setGenerating(false);

    if (errores > 0) {
      toast.warning(`${generadas} comisiones generadas, ${errores} ya existían o fallaron`);
    } else {
      toast.success(`${generadas} comisiones generadas exitosamente`);
    }

    onSuccess();
  }, [comisiones, selectedMedicos, fechaInicio, fechaFin, onSuccess]);

  // Toggle selección de médico
  const handleToggleMedico = (medicoId: number) => {
    setSelectedMedicos(prev =>
      prev.includes(medicoId)
        ? prev.filter(id => id !== medicoId)
        : [...prev, medicoId]
    );
  };

  // Seleccionar/Deseleccionar todos
  const handleSelectAll = () => {
    if (selectedMedicos.length === comisiones.length) {
      setSelectedMedicos([]);
    } else {
      setSelectedMedicos(comisiones.map(c => c.medicoId));
    }
  };

  // Limpiar al cerrar
  const handleClose = () => {
    setFechaInicio('');
    setFechaFin('');
    setResumen(null);
    setComisiones([]);
    setSelectedMedicos([]);
    setExpandedMedico(null);
    onClose();
  };

  // Calcular total seleccionado
  const totalSeleccionado = comisiones
    .filter(c => selectedMedicos.includes(c.medicoId))
    .reduce((sum, c) => sum + c.montoComision, 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalculateIcon color="primary" />
          <Typography variant="h6">
            Calcular Comisiones Médicas
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={loading || generating}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Selección de periodo */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Seleccione el periodo para calcular comisiones
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Fecha Fin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCalcular}
                disabled={!fechaInicio || !fechaFin || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
              >
                {loading ? 'Calculando...' : 'Calcular'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Resumen del cálculo */}
        {resumen && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Médicos</Typography>
                <Typography variant="h5">{resumen.totalMedicos}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Cuentas Cerradas</Typography>
                <Typography variant="h5">{resumen.totalCuentas}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Total Facturado</Typography>
                <Typography variant="h5">{comisionesService.formatCurrency(resumen.totalFacturado)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Total Comisiones (5%)</Typography>
                <Typography variant="h5" color="success.main">{comisionesService.formatCurrency(resumen.totalComisiones)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Lista de comisiones por médico */}
        {comisiones.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Comisiones por Médico ({selectedMedicos.length} de {comisiones.length} seleccionados)
              </Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedMedicos.length === comisiones.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell padding="checkbox">Sel.</TableCell>
                    <TableCell>Médico</TableCell>
                    <TableCell>Especialidad</TableCell>
                    <TableCell align="center">Cuentas</TableCell>
                    <TableCell align="right">Facturado</TableCell>
                    <TableCell align="right">Comisión (5%)</TableCell>
                    <TableCell align="center">Detalle</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comisiones.map((comision) => (
                    <React.Fragment key={comision.medicoId}>
                      <TableRow
                        sx={{
                          bgcolor: selectedMedicos.includes(comision.medicoId) ? 'action.selected' : 'inherit',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedMedicos.includes(comision.medicoId)}
                            onChange={() => handleToggleMedico(comision.medicoId)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {comision.nombreMedico}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {comision.especialidad || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={comision.totalCuentas} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="right">
                          {comisionesService.formatCurrency(comision.totalFacturado)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {comisionesService.formatCurrency(comision.montoComision)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => setExpandedMedico(
                              expandedMedico === comision.medicoId ? null : comision.medicoId
                            )}
                          >
                            {expandedMedico === comision.medicoId ? <CollapseIcon /> : <ExpandIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Collapse in={expandedMedico === comision.medicoId}>
                            <Box sx={{ py: 2, px: 4, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Cuentas incluidas:
                              </Typography>
                              <List dense>
                                {comision.cuentas.map((cuenta) => (
                                  <ListItem key={cuenta.cuentaId}>
                                    <ListItemText
                                      primary={cuenta.paciente}
                                      secondary={`Exp: ${cuenta.expediente || 'N/A'} - Cerrada: ${new Date(cuenta.fechaCierre).toLocaleDateString('es-MX')}`}
                                    />
                                    <Typography variant="body2">
                                      {comisionesService.formatCurrency(cuenta.totalCuenta)}
                                    </Typography>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total seleccionado */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" align="right">
                Total a Generar: <strong>{comisionesService.formatCurrency(totalSeleccionado)}</strong>
              </Typography>
            </Box>
          </>
        )}

        {comisiones.length === 0 && resumen && (
          <Alert severity="info">
            No se encontraron cuentas cerradas con médico tratante asignado en el periodo seleccionado.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading || generating}>
          Cancelar
        </Button>
        {comisiones.length > 0 && (
          <Button
            variant="contained"
            color="success"
            onClick={handleGenerarComisiones}
            disabled={selectedMedicos.length === 0 || generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {generating ? 'Generando...' : `Generar ${selectedMedicos.length} Comisiones`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CommissionCalculatorDialog;
