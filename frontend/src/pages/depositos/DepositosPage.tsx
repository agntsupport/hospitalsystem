// ABOUTME: Página principal del módulo de Depósitos Bancarios
// ABOUTME: Gestiona preparación, seguimiento y confirmación de depósitos

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Badge,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Visibility,
  Check,
  Close,
  Refresh,
  Settings,
  LocalAtm,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import {
  bancosService,
  DepositoBancario,
  CuentaBancaria,
  EstadoDeposito,
} from '@/services/bancosService';
import { formatCurrency } from '@/utils/formatters';
import PrepararDepositoDialog from './PrepararDepositoDialog';
import DepositoDetailDialog from './DepositoDetailDialog';
import ConfirmarDepositoDialog from './ConfirmarDepositoDialog';
import CuentasBancariasDialog from './CuentasBancariasDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const DepositosPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  // Estados
  const [activeTab, setActiveTab] = useState(0);
  const [depositos, setDepositos] = useState<DepositoBancario[]>([]);
  const [pendientes, setPendientes] = useState<DepositoBancario[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<EstadoDeposito | ''>('');
  const [cuentaFilter, setCuentaFilter] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Diálogos
  const [prepararOpen, setPrepararOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [cuentasOpen, setCuentasOpen] = useState(false);
  const [selectedDeposito, setSelectedDeposito] = useState<DepositoBancario | null>(null);

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (estadoFilter) params.estado = estadoFilter;
      if (cuentaFilter) params.cuentaBancariaId = cuentaFilter;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const [depositosRes, cuentasRes] = await Promise.all([
        bancosService.getDepositos(params),
        bancosService.getCuentas({ activa: true }),
      ]);

      if (depositosRes.success && depositosRes.data) {
        setDepositos(depositosRes.data.items || []);
      }

      if (cuentasRes.success && cuentasRes.data) {
        setCuentas(cuentasRes.data || []);
      }

      // Solo admin puede ver pendientes de confirmación
      if (isAdmin) {
        const pendientesRes = await bancosService.getPendientes();
        if (pendientesRes.success && pendientesRes.data) {
          // El endpoint devuelve { items, totales, total }
          const pendientesData = pendientesRes.data as any;
          setPendientes(pendientesData.items || []);
        }
      }
    } catch (err) {
      console.error('Error cargando depósitos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, cuentaFilter, fechaInicio, fechaFin, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleViewDetail = (deposito: DepositoBancario) => {
    setSelectedDeposito(deposito);
    setDetailOpen(true);
  };

  const handleConfirmar = (deposito: DepositoBancario) => {
    setSelectedDeposito(deposito);
    setConfirmarOpen(true);
  };

  const handleMarcarDepositado = async (deposito: DepositoBancario) => {
    if (!window.confirm('¿Confirmas que este depósito ya fue entregado al banco?')) {
      return;
    }

    try {
      await bancosService.marcarDepositado(deposito.id);
      loadData();
    } catch (err) {
      console.error('Error marcando depósito:', err);
      setError('Error al actualizar el depósito');
    }
  };

  const getEstadoColor = (estado: EstadoDeposito): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    const colors: Record<EstadoDeposito, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      preparado: 'warning',
      depositado: 'info',
      confirmado: 'success',
      rechazado: 'error',
    };
    return colors[estado] || 'default';
  };

  const getEstadoLabel = (estado: EstadoDeposito): string => {
    const labels: Record<EstadoDeposito, string> = {
      preparado: 'Preparado',
      depositado: 'Depositado',
      confirmado: 'Confirmado',
      rechazado: 'Rechazado',
    };
    return labels[estado] || estado;
  };

  // Stats
  const totalDepositos = depositos.length;
  const montoTotalConfirmado = depositos
    .filter((d) => d.estado === 'confirmado')
    .reduce((sum, d) => sum + d.montoTotal, 0);
  const pendientesCount = pendientes.length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Depósitos Bancarios</Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de depósitos y conciliación bancaria
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setCuentasOpen(true)}
            >
              Cuentas Bancarias
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setPrepararOpen(true)}
          >
            Preparar Depósito
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Depósitos
            </Typography>
            <Typography variant="h4">{totalDepositos}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Monto Confirmado
            </Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(montoTotalConfirmado)}
            </Typography>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pendientes Confirmación
              </Typography>
              <Typography variant="h4" color="warning.main">
                {pendientesCount}
              </Typography>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Cuentas Activas
            </Typography>
            <Typography variant="h4">{cuentas.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<LocalAtm />} label="Historial" iconPosition="start" />
          {isAdmin && (
            <Tab
              icon={
                <Badge badgeContent={pendientesCount} color="warning">
                  <CheckCircle />
                </Badge>
              }
              label="Pendientes de Confirmación"
              iconPosition="start"
            />
          )}
        </Tabs>

        {/* Tab Historial */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Estado"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as EstadoDeposito | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="preparado">Preparado</MenuItem>
                <MenuItem value="depositado">Depositado</MenuItem>
                <MenuItem value="confirmado">Confirmado</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
              </TextField>
              <TextField
                select
                label="Cuenta Bancaria"
                value={cuentaFilter}
                onChange={(e) => setCuentaFilter(e.target.value as number | '')}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todas</MenuItem>
                {cuentas.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.alias} - {c.banco}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="Fecha Fin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Button startIcon={<Refresh />} onClick={loadData} disabled={loading}>
                Actualizar
              </Button>
            </Box>

            {/* Tabla */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cuenta</TableCell>
                    <TableCell align="right">Efectivo</TableCell>
                    <TableCell align="right">Cheques</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : depositos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron depósitos
                      </TableCell>
                    </TableRow>
                  ) : (
                    depositos.map((dep) => (
                      <TableRow key={dep.id} hover>
                        <TableCell>{dep.numero}</TableCell>
                        <TableCell>
                          <Chip
                            label={dep.cuentaBancaria?.alias || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(dep.montoEfectivo)}</TableCell>
                        <TableCell align="right">{formatCurrency(dep.montoCheques)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">
                            {formatCurrency(dep.montoTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(dep.estado)}
                            color={getEstadoColor(dep.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(dep.fechaPreparacion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => handleViewDetail(dep)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {dep.estado === 'preparado' && (
                            <Tooltip title="Marcar como depositado">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleMarcarDepositado(dep)}
                              >
                                <CheckCircle fontSize="small" />
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
          </CardContent>
        </TabPanel>

        {/* Tab Pendientes (Admin) */}
        {isAdmin && (
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Número</TableCell>
                      <TableCell>Cuenta</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Preparado Por</TableCell>
                      <TableCell>Fecha Preparación</TableCell>
                      <TableCell>Fecha Depósito</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay depósitos pendientes de confirmación
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendientes.map((dep) => (
                        <TableRow key={dep.id} hover>
                          <TableCell>{dep.numero}</TableCell>
                          <TableCell>
                            <Chip
                              label={dep.cuentaBancaria?.alias || 'N/A'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">
                              {formatCurrency(dep.montoTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {dep.preparadoPor?.nombre || dep.preparadoPor?.username}
                          </TableCell>
                          <TableCell>
                            {new Date(dep.fechaPreparacion).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {dep.fechaDeposito
                              ? new Date(dep.fechaDeposito).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Confirmar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleConfirmar(dep)}
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleConfirmar(dep)}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ver detalle">
                                <IconButton size="small" onClick={() => handleViewDetail(dep)}>
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </TabPanel>
        )}
      </Card>

      {/* Diálogos */}
      <PrepararDepositoDialog
        open={prepararOpen}
        onClose={() => setPrepararOpen(false)}
        onSuccess={() => {
          setPrepararOpen(false);
          loadData();
        }}
        cuentas={cuentas}
      />

      {selectedDeposito && (
        <>
          <DepositoDetailDialog
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            deposito={selectedDeposito}
          />
          <ConfirmarDepositoDialog
            open={confirmarOpen}
            onClose={() => setConfirmarOpen(false)}
            onSuccess={() => {
              setConfirmarOpen(false);
              loadData();
            }}
            deposito={selectedDeposito}
          />
        </>
      )}

      <CuentasBancariasDialog
        open={cuentasOpen}
        onClose={() => setCuentasOpen(false)}
        onUpdate={loadData}
      />
    </Box>
  );
};

export default DepositosPage;
