// ABOUTME: Página principal del módulo de Caja Diaria
// ABOUTME: Gestiona apertura, cierre, arqueo y movimientos de caja para cajeros

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  PointOfSale as CajaIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as IngresosIcon,
  TrendingDown as EgresosIcon,
} from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { cajaService, CajaDiaria, ResumenCaja, MovimientoCaja } from '@/services/cajaService';
import { useAuth } from '@/hooks/useAuth';
import AbrirCajaDialog from './AbrirCajaDialog';
import CerrarCajaDialog from './CerrarCajaDialog';
import MovimientoCajaDialog from './MovimientoCajaDialog';
import ArqueoCajaDialog from './ArqueoCajaDialog';
import HistorialCajasDialog from './HistorialCajasDialog';

const CajaDiariaPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado de caja
  const [cajaActual, setCajaActual] = useState<CajaDiaria | null>(null);
  const [resumen, setResumen] = useState<ResumenCaja | null>(null);
  const [tieneCajaAbierta, setTieneCajaAbierta] = useState(false);

  // Dialogs
  const [abrirDialogOpen, setAbrirDialogOpen] = useState(false);
  const [cerrarDialogOpen, setCerrarDialogOpen] = useState(false);
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [arqueoDialogOpen, setArqueoDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso');

  // Tabs
  const [currentTab, setCurrentTab] = useState(0);

  const loadCajaActual = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await cajaService.getCajaActual();
      if (response.success && response.data) {
        setCajaActual(response.data.caja);
        setTieneCajaAbierta(response.data.tieneCajaAbierta);

        if (response.data.tieneCajaAbierta) {
          const resumenResponse = await cajaService.getResumen();
          if (resumenResponse.success && resumenResponse.data) {
            setResumen(resumenResponse.data.resumen);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estado de caja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCajaActual();
  }, [loadCajaActual]);

  const handleAbrirCaja = () => {
    setAbrirDialogOpen(true);
  };

  const handleCerrarCaja = () => {
    setCerrarDialogOpen(true);
  };

  const handleRegistrarMovimiento = (tipo: 'ingreso' | 'egreso') => {
    setTipoMovimiento(tipo);
    setMovimientoDialogOpen(true);
  };

  const handleRealizarArqueo = () => {
    setArqueoDialogOpen(true);
  };

  const handleCajaAbierta = () => {
    setAbrirDialogOpen(false);
    setSuccess('Caja abierta exitosamente');
    loadCajaActual();
  };

  const handleCajaCerrada = () => {
    setCerrarDialogOpen(false);
    setSuccess('Caja cerrada exitosamente');
    loadCajaActual();
  };

  const handleMovimientoRegistrado = () => {
    setMovimientoDialogOpen(false);
    setSuccess('Movimiento registrado exitosamente');
    loadCajaActual();
  };

  const handleArqueoRealizado = () => {
    setArqueoDialogOpen(false);
    setSuccess('Arqueo realizado exitosamente');
    loadCajaActual();
  };

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

  const getTurnoLabel = (turno: string) => {
    const turnos: Record<string, string> = {
      matutino: 'Matutino (7:00 - 15:00)',
      vespertino: 'Vespertino (15:00 - 23:00)',
      nocturno: 'Nocturno (23:00 - 7:00)',
    };
    return turnos[turno] || turno;
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      abierta: 'success',
      en_arqueo: 'warning',
      cerrada: 'default',
    };
    return colores[estado] || 'default';
  };

  const getTipoMovimientoColor = (tipo: string) => {
    const colores: Record<string, 'success' | 'error' | 'info' | 'warning' | 'default'> = {
      ingreso: 'success',
      egreso: 'error',
      fondo_inicial: 'info',
      retiro_parcial: 'warning',
      deposito_banco: 'info',
    };
    return colores[tipo] || 'default';
  };

  const getTipoMovimientoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ingreso: 'Ingreso',
      egreso: 'Egreso',
      fondo_inicial: 'Fondo Inicial',
      retiro_parcial: 'Retiro Parcial',
      deposito_banco: 'Depósito a Banco',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Caja Diaria"
        subtitle={tieneCajaAbierta ? `Caja #${cajaActual?.numero} - ${getTurnoLabel(cajaActual?.turno || '')}` : 'Sin caja abierta'}
        icon={<CajaIcon />}
        iconColor="primary"
        actions={
          tieneCajaAbierta
            ? [
                {
                  label: 'Ingreso',
                  icon: <AddIcon />,
                  onClick: () => handleRegistrarMovimiento('ingreso'),
                  color: 'success' as const,
                  variant: 'contained' as const,
                },
                {
                  label: 'Egreso',
                  icon: <RemoveIcon />,
                  onClick: () => handleRegistrarMovimiento('egreso'),
                  color: 'error' as const,
                  variant: 'contained' as const,
                },
                {
                  label: 'Arqueo',
                  icon: <CalculateIcon />,
                  onClick: handleRealizarArqueo,
                  variant: 'outlined' as const,
                },
                {
                  label: 'Cerrar Caja',
                  icon: <LockIcon />,
                  onClick: handleCerrarCaja,
                  color: 'warning' as const,
                  variant: 'outlined' as const,
                },
              ]
            : [
                {
                  label: 'Abrir Caja',
                  icon: <LockOpenIcon />,
                  onClick: handleAbrirCaja,
                  variant: 'contained' as const,
                },
              ]
        }
      />

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Estado sin caja abierta */}
      {!tieneCajaAbierta && (
        <Card sx={{ mt: 3, textAlign: 'center', py: 6 }}>
          <CardContent>
            <LockIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No tienes una caja abierta
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Para comenzar a operar el punto de venta, debes abrir tu caja diaria.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<LockOpenIcon />}
              onClick={handleAbrirCaja}
            >
              Abrir Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Panel de caja abierta */}
      {tieneCajaAbierta && cajaActual && resumen && (
        <>
          {/* Estadísticas */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Saldo Inicial"
                value={formatCurrency(resumen.saldoInicial)}
                icon={<MoneyIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Ingresos"
                value={formatCurrency(resumen.totalIngresos)}
                icon={<IngresosIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Egresos"
                value={formatCurrency(resumen.totalEgresos)}
                icon={<EgresosIcon />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Saldo Esperado"
                value={formatCurrency(resumen.saldoEsperado)}
                icon={<CajaIcon />}
                color="primary"
              />
            </Grid>
          </Grid>

          {/* Tabs */}
          <Card sx={{ mt: 3 }}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<CajaIcon />}
                label="Movimientos"
                iconPosition="start"
              />
              <Tab
                icon={<HistoryIcon />}
                label="Historial de Cajas"
                iconPosition="start"
              />
            </Tabs>

            <CardContent>
              {currentTab === 0 && (
                <>
                  {/* Info de caja */}
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={`Estado: ${cajaActual.estado.charAt(0).toUpperCase() + cajaActual.estado.slice(1)}`}
                      color={getEstadoColor(cajaActual.estado)}
                    />
                    <Chip
                      label={`Turno: ${cajaActual.turno.charAt(0).toUpperCase() + cajaActual.turno.slice(1)}`}
                      variant="outlined"
                    />
                    <Chip
                      label={`Apertura: ${formatDateTime(cajaActual.fechaApertura)}`}
                      variant="outlined"
                    />
                    <Chip
                      label={`${resumen.cantidadMovimientos} movimientos`}
                      variant="outlined"
                    />
                    <Tooltip title="Actualizar">
                      <IconButton onClick={loadCajaActual} size="small">
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Tabla de movimientos */}
                  <Typography variant="h6" gutterBottom>
                    Movimientos del Día
                  </Typography>

                  {cajaActual.movimientos && cajaActual.movimientos.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Hora</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Concepto</TableCell>
                            <TableCell>Referencia</TableCell>
                            <TableCell align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cajaActual.movimientos.map((mov: MovimientoCaja) => (
                            <TableRow key={mov.id}>
                              <TableCell>
                                {new Date(mov.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getTipoMovimientoLabel(mov.tipo)}
                                  color={getTipoMovimientoColor(mov.tipo)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{mov.concepto}</TableCell>
                              <TableCell>{mov.referencia || '-'}</TableCell>
                              <TableCell align="right" sx={{
                                color: mov.tipo === 'ingreso' || mov.tipo === 'fondo_inicial' ? 'success.main' : 'error.main',
                                fontWeight: 'medium',
                              }}>
                                {mov.tipo === 'ingreso' || mov.tipo === 'fondo_inicial' ? '+' : '-'}
                                {formatCurrency(mov.monto)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No hay movimientos registrados en esta caja
                      </Typography>
                    </Box>
                  )}

                  {/* Resumen por tipo */}
                  {resumen.movimientosPorTipo && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Resumen por Tipo
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(resumen.movimientosPorTipo).map(([tipo, data]) => (
                          data.cantidad > 0 && (
                            <Grid item xs={6} sm={4} md={2} key={tipo}>
                              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                <Chip
                                  label={getTipoMovimientoLabel(tipo)}
                                  color={getTipoMovimientoColor(tipo)}
                                  size="small"
                                  sx={{ mb: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {data.cantidad} mov.
                                </Typography>
                                <Typography variant="subtitle2">
                                  {formatCurrency(data.total)}
                                </Typography>
                              </Paper>
                            </Grid>
                          )
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              )}

              {currentTab === 1 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setHistorialDialogOpen(true)}
                  >
                    Ver Historial Completo
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <AbrirCajaDialog
        open={abrirDialogOpen}
        onClose={() => setAbrirDialogOpen(false)}
        onSuccess={handleCajaAbierta}
      />

      <CerrarCajaDialog
        open={cerrarDialogOpen}
        caja={cajaActual}
        resumen={resumen}
        onClose={() => setCerrarDialogOpen(false)}
        onSuccess={handleCajaCerrada}
      />

      <MovimientoCajaDialog
        open={movimientoDialogOpen}
        tipo={tipoMovimiento}
        onClose={() => setMovimientoDialogOpen(false)}
        onSuccess={handleMovimientoRegistrado}
      />

      <ArqueoCajaDialog
        open={arqueoDialogOpen}
        caja={cajaActual}
        resumen={resumen}
        onClose={() => setArqueoDialogOpen(false)}
        onSuccess={handleArqueoRealizado}
      />

      <HistorialCajasDialog
        open={historialDialogOpen}
        onClose={() => setHistorialDialogOpen(false)}
      />
    </Box>
  );
};

export default CajaDiariaPage;
