// ABOUTME: Página principal del módulo de Descuentos Autorizados
// ABOUTME: Gestiona políticas, solicitudes y autorizaciones de descuentos

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
  LocalOffer,
  Add,
  Visibility,
  Check,
  Close,
  Refresh,
  Settings,
  Undo,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { descuentosService, DescuentoAplicado, PoliticaDescuento, EstadoDescuento } from '@/services/descuentosService';
import { formatCurrency } from '@/utils/formatters';
import SolicitarDescuentoDialog from './SolicitarDescuentoDialog';
import DescuentoDetailDialog from './DescuentoDetailDialog';
import AutorizarDescuentoDialog from './AutorizarDescuentoDialog';
import PoliticasDialog from './PoliticasDialog';

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

const DescuentosPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  // Estados
  const [activeTab, setActiveTab] = useState(0);
  const [descuentos, setDescuentos] = useState<DescuentoAplicado[]>([]);
  const [pendientes, setPendientes] = useState<DescuentoAplicado[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaDescuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<EstadoDescuento | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Diálogos
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [autorizarOpen, setAutorizarOpen] = useState(false);
  const [politicasOpen, setPoliticasOpen] = useState(false);
  const [selectedDescuento, setSelectedDescuento] = useState<DescuentoAplicado | null>(null);

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (estadoFilter) params.estado = estadoFilter;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const [descuentosRes, politicasRes] = await Promise.all([
        descuentosService.getDescuentos(params),
        descuentosService.getPoliticas()
      ]);

      if (descuentosRes.success && descuentosRes.data) {
        setDescuentos(descuentosRes.data.items || []);
      }

      if (politicasRes.success && politicasRes.data) {
        setPoliticas(politicasRes.data || []);
      }

      // Solo admin puede ver pendientes
      if (isAdmin) {
        const pendientesRes = await descuentosService.getPendientes();
        if (pendientesRes.success && pendientesRes.data) {
          setPendientes(pendientesRes.data || []);
        }
      }
    } catch (err) {
      console.error('Error cargando descuentos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, fechaInicio, fechaFin, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleViewDetail = (descuento: DescuentoAplicado) => {
    setSelectedDescuento(descuento);
    setDetailOpen(true);
  };

  const handleAutorizar = (descuento: DescuentoAplicado) => {
    setSelectedDescuento(descuento);
    setAutorizarOpen(true);
  };

  const handleRevertir = async (descuento: DescuentoAplicado) => {
    if (!window.confirm('¿Está seguro de revertir este descuento? El monto será devuelto a la cuenta.')) {
      return;
    }

    try {
      const motivo = window.prompt('Motivo de la reversión:');
      if (motivo === null) return;

      await descuentosService.revertir(descuento.id, motivo);
      loadData();
    } catch (err) {
      console.error('Error revirtiendo descuento:', err);
      setError('Error al revertir el descuento');
    }
  };

  const getEstadoColor = (estado: EstadoDescuento): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    const colors: Record<EstadoDescuento, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      'pendiente': 'warning',
      'autorizado': 'success',
      'rechazado': 'error',
      'aplicado': 'info',
      'revertido': 'default'
    };
    return colors[estado] || 'default';
  };

  const getEstadoLabel = (estado: EstadoDescuento): string => {
    const labels: Record<EstadoDescuento, string> = {
      'pendiente': 'Pendiente',
      'autorizado': 'Autorizado',
      'rechazado': 'Rechazado',
      'aplicado': 'Aplicado',
      'revertido': 'Revertido'
    };
    return labels[estado] || estado;
  };

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'cortesia_medica': 'Cortesía Médica',
      'empleado_hospital': 'Empleado Hospital',
      'convenio_empresa': 'Convenio Empresa',
      'promocion_temporal': 'Promoción',
      'ajuste_precio': 'Ajuste de Precio',
      'redondeo': 'Redondeo',
      'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  };

  // Stats
  const totalDescuentos = descuentos.length;
  const montoTotalAutorizado = descuentos
    .filter(d => d.estado === 'autorizado' || d.estado === 'aplicado')
    .reduce((sum, d) => sum + d.montoDescuento, 0);
  const pendientesCount = pendientes.length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalOffer sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Descuentos</Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de descuentos autorizados
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setPoliticasOpen(true)}
            >
              Políticas
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setSolicitarOpen(true)}
          >
            Solicitar Descuento
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
            <Typography color="text.secondary" gutterBottom>Total Descuentos</Typography>
            <Typography variant="h4">{totalDescuentos}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>Monto Autorizado</Typography>
            <Typography variant="h4" color="success.main">{formatCurrency(montoTotalAutorizado)}</Typography>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Pendientes</Typography>
              <Typography variant="h4" color="warning.main">{pendientesCount}</Typography>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>Políticas Activas</Typography>
            <Typography variant="h4">{politicas.length}</Typography>
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
          <Tab icon={<LocalOffer />} label="Historial" iconPosition="start" />
          {isAdmin && (
            <Tab
              icon={
                <Badge badgeContent={pendientesCount} color="warning">
                  <Check />
                </Badge>
              }
              label="Pendientes de Autorización"
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
                onChange={(e) => setEstadoFilter(e.target.value as EstadoDescuento | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="autorizado">Autorizado</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
                <MenuItem value="aplicado">Aplicado</MenuItem>
                <MenuItem value="revertido">Revertido</MenuItem>
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
                    <TableCell>ID</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Política</TableCell>
                    <TableCell align="right">% Desc.</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">Cargando...</TableCell>
                    </TableRow>
                  ) : descuentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No se encontraron descuentos</TableCell>
                    </TableRow>
                  ) : (
                    descuentos.map((desc) => (
                      <TableRow key={desc.id} hover>
                        <TableCell>{desc.id}</TableCell>
                        <TableCell>
                          {desc.cuenta?.paciente
                            ? `${desc.cuenta.paciente.nombre} ${desc.cuenta.paciente.apellidoPaterno}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={desc.politica?.nombre || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {desc.valorDescuento != null ? `${desc.valorDescuento}%` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="error.main" fontWeight="medium">
                            -{formatCurrency(desc.montoDescuento)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(desc.estado)}
                            color={getEstadoColor(desc.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {desc.fechaSolicitud ? new Date(desc.fechaSolicitud).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => handleViewDetail(desc)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && desc.estado === 'autorizado' && (
                            <Tooltip title="Revertir">
                              <IconButton size="small" color="warning" onClick={() => handleRevertir(desc)}>
                                <Undo fontSize="small" />
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
                      <TableCell>ID</TableCell>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Cuenta</TableCell>
                      <TableCell>Política</TableCell>
                      <TableCell align="right">Monto Original</TableCell>
                      <TableCell align="right">Descuento</TableCell>
                      <TableCell>Solicitante</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No hay descuentos pendientes de autorización
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendientes.map((desc) => (
                        <TableRow key={desc.id} hover>
                          <TableCell>{desc.id}</TableCell>
                          <TableCell>
                            {desc.cuenta?.paciente
                              ? `${desc.cuenta.paciente.nombre} ${desc.cuenta.paciente.apellidoPaterno}`
                              : '-'}
                          </TableCell>
                          <TableCell>#{desc.cuentaId}</TableCell>
                          <TableCell>
                            <Chip
                              label={desc.politica?.nombre || 'N/A'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(desc.montoBaseCalculo)}</TableCell>
                          <TableCell align="right">
                            <Typography color="error.main" fontWeight="bold">
                              -{formatCurrency(desc.montoDescuento)} ({desc.valorDescuento}%)
                            </Typography>
                          </TableCell>
                          <TableCell>{desc.solicitante?.nombre || desc.solicitante?.username}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Tooltip title={desc.motivoSolicitud}>
                              <Typography noWrap>{desc.motivoSolicitud}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Autorizar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleAutorizar(desc)}
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleAutorizar(desc)}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ver detalle">
                                <IconButton size="small" onClick={() => handleViewDetail(desc)}>
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
      <SolicitarDescuentoDialog
        open={solicitarOpen}
        onClose={() => setSolicitarOpen(false)}
        onSuccess={() => {
          setSolicitarOpen(false);
          loadData();
        }}
        politicas={politicas}
      />

      {selectedDescuento && (
        <>
          <DescuentoDetailDialog
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            descuento={selectedDescuento}
          />
          <AutorizarDescuentoDialog
            open={autorizarOpen}
            onClose={() => setAutorizarOpen(false)}
            onSuccess={() => {
              setAutorizarOpen(false);
              loadData();
            }}
            descuento={selectedDescuento}
          />
        </>
      )}

      <PoliticasDialog
        open={politicasOpen}
        onClose={() => setPoliticasOpen(false)}
        onUpdate={loadData}
      />
    </Box>
  );
};

export default DescuentosPage;
