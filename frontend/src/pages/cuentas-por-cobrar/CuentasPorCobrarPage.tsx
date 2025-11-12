// ABOUTME: Página principal para gestionar cuentas por cobrar (CPC) del hospital
// Muestra lista de CPC, permite registrar pagos y ver estadísticas
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  AccountBalance as AccountIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { CuentaPorCobrar, EstadoCPC } from '@/types/pos.types';
import CPCPaymentDialog from '@/components/cuentas-por-cobrar/CPCPaymentDialog';
import CPCStatsCards from '@/components/cuentas-por-cobrar/CPCStatsCards';

const CuentasPorCobrarPage: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Diálogos
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCPC, setSelectedCPC] = useState<CuentaPorCobrar | null>(null);

  // Estadísticas
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [estadoFiltro]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadCuentas(),
        loadStats(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [estadoFiltro]);

  const loadCuentas = async () => {
    try {
      const filters: any = {};
      if (estadoFiltro !== 'todos') {
        filters.estado = estadoFiltro;
      }

      const response = await posService.getCuentasPorCobrar(filters);
      if (response.success && response.data) {
        setCuentas(response.data.cuentasPorCobrar || []);
      }
    } catch (err) {
      console.error('Error loading CPC:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await posService.getCPCStats();
      if (response.success && response.data) {
        // Transformar datos del backend al formato esperado por el componente
        const { resumen, distribucion } = response.data;

        // Crear objeto de distribución por estado con valores por defecto
        const distribucionPorEstado = {
          pendiente: { cantidad: 0, monto: 0 },
          pagado_parcial: { cantidad: 0, monto: 0 },
          pagado_total: { cantidad: 0, monto: 0 },
          cancelado: { cantidad: 0, monto: 0 }
        };

        // Llenar con datos reales del backend
        if (distribucion && Array.isArray(distribucion)) {
          distribucion.forEach((item: any) => {
            if (distribucionPorEstado.hasOwnProperty(item.estado)) {
              distribucionPorEstado[item.estado as keyof typeof distribucionPorEstado] = {
                cantidad: item.cantidad || 0,
                monto: item.saldoPendiente || 0
              };
            }
          });
        }

        setStats({
          totalCPCActivas: resumen?.totalCPC ?? 0,
          montoPendienteTotal: resumen?.montoTotalPendiente ?? 0,
          montoRecuperadoTotal: resumen?.montoTotalRecuperado ?? 0,
          porcentajeRecuperacion: resumen?.porcentajeRecuperacion ?? 0,
          distribucionPorEstado
        });
      }
    } catch (err) {
      console.error('Error loading CPC stats:', err);
    }
  };

  const handleOpenPaymentDialog = (cuenta: CuentaPorCobrar) => {
    setSelectedCPC(cuenta);
    setPaymentDialogOpen(true);
  };

  const handlePaymentRegistered = () => {
    loadData();
  };

  const getEstadoColor = (estado: EstadoCPC): 'default' | 'warning' | 'success' | 'error' => {
    switch (estado) {
      case 'pendiente':
        return 'error';
      case 'pagado_parcial':
        return 'warning';
      case 'pagado_total':
        return 'success';
      case 'cancelado':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEstadoLabel = (estado: EstadoCPC): string => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'pagado_parcial':
        return 'Pago Parcial';
      case 'pagado_total':
        return 'Pagado Total';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  const filteredCuentas = cuentas.filter((cuenta) => {
    const matchesSearch = searchTerm === '' ||
      cuenta.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.paciente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.id.toString().includes(searchTerm);

    return matchesSearch;
  });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cuentas por Cobrar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de deudas pendientes de pacientes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && <CPCStatsCards stats={stats} />}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre de paciente o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="pagado_parcial">Pago Parcial</MenuItem>
                  <MenuItem value="pagado_total">Pagado Total</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={loadData}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Actualizar'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de Cuentas por Cobrar */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Cuentas por Cobrar
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table data-testid="cpc-table">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell align="right">Monto Original</TableCell>
                    <TableCell align="right">Monto Pagado</TableCell>
                    <TableCell align="right">Saldo Pendiente</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCuentas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <AccountIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            No hay cuentas por cobrar
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {searchTerm || estadoFiltro !== 'todos'
                              ? 'No se encontraron cuentas que coincidan con los filtros seleccionados'
                              : 'Excelente - No hay deudas pendientes en el sistema'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {(searchTerm || estadoFiltro !== 'todos') && (
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setSearchTerm('');
                                  setEstadoFiltro('todos');
                                }}
                              >
                                Limpiar Filtros
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              startIcon={<RefreshIcon />}
                              onClick={loadData}
                            >
                              Actualizar
                            </Button>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCuentas.map((cuenta) => (
                      <TableRow key={cuenta.id} hover>
                        <TableCell>#{cuenta.id}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon fontSize="small" color="action" />
                            <Box>
                              <Typography variant="body2">
                                {cuenta.paciente?.nombre} {cuenta.paciente?.apellidos}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cuenta #{cuenta.cuentaPacienteId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(cuenta.montoOriginal)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(cuenta.montoPagado)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={cuenta.saldoPendiente > 0 ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(cuenta.saldoPendiente)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(cuenta.estado)}
                            color={getEstadoColor(cuenta.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(cuenta.fechaCreacion)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {cuenta.estado !== 'pagado_total' && cuenta.estado !== 'cancelado' && (
                            <Tooltip title="Registrar Pago">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenPaymentDialog(cuenta)}
                                data-testid={`registrar-pago-${cuenta.id}`}
                                aria-label="Registrar pago de cuenta por cobrar"
                                title="Registrar pago de cuenta por cobrar"
                              >
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Pago */}
      <CPCPaymentDialog
        open={paymentDialogOpen}
        cuentaPorCobrar={selectedCPC}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedCPC(null);
        }}
        onPaymentRegistered={handlePaymentRegistered}
      />
    </Box>
  );
};

export default CuentasPorCobrarPage;
