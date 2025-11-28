// ABOUTME: Pestaña de reportes gerenciales con rankings de médicos, utilidades y costos
// ABOUTME: Integra datos de médicos, utilidades netas y gestión de costos operativos

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalHospital as DoctorIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import reportsService from '@/services/reportsService';
import {
  ReportFilters,
  DoctorRankingsReport,
  ProfitSummaryReport,
  CostSummaryReport,
  CATEGORIA_COSTO_LABELS
} from '@/types/reports.types';

interface ManagerialReportsTabProps {
  filters: ReportFilters;
  onError: (error: string | null) => void;
  onLoading: (loading: boolean) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`managerial-tabpanel-${index}`}
      aria-labelledby={`managerial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ManagerialReportsTab: React.FC<ManagerialReportsTabProps> = ({
  filters,
  onError,
  onLoading
}) => {
  const [subTabValue, setSubTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [doctorRankings, setDoctorRankings] = useState<DoctorRankingsReport | null>(null);
  const [profitSummary, setProfitSummary] = useState<ProfitSummaryReport | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummaryReport | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    onLoading(true);
    onError(null);

    try {
      const [doctorsRes, profitRes, costsRes] = await Promise.all([
        reportsService.getDoctorRankings(filters),
        reportsService.getProfitSummary(filters),
        reportsService.getCostsSummary(filters)
      ]);

      if (doctorsRes.success && doctorsRes.data) {
        setDoctorRankings(doctorsRes.data);
      }
      if (profitRes.success && profitRes.data) {
        setProfitSummary(profitRes.data);
      }
      if (costsRes.success && costsRes.data) {
        setCostSummary(costsRes.data);
      }
    } catch (error: any) {
      onError(error.message || 'Error al cargar datos gerenciales');
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }, [filters, onError, onLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  const formatCurrency = (value: number | string | undefined) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numValue);
  };

  const formatPercentage = (value: string | number | undefined) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.0%';
    return `${numValue.toFixed(1)}%`;
  };

  if (loading && !doctorRankings && !profitSummary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Reportes Gerenciales
        </Typography>
        <Tooltip title="Actualizar datos">
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Resumen de métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon />
                <Typography variant="subtitle2">Ingresos Totales</Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {formatCurrency(profitSummary?.ingresos?.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon />
                <Typography variant="subtitle2">Costos Totales</Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {formatCurrency(profitSummary?.costos?.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            bgcolor: Number(profitSummary?.utilidad?.neta) >= 0 ? 'info.light' : 'warning.light',
            color: Number(profitSummary?.utilidad?.neta) >= 0 ? 'info.contrastText' : 'warning.contrastText'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                <Typography variant="subtitle2">Utilidad Neta</Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {formatCurrency(profitSummary?.utilidad?.neta)}
              </Typography>
              <Typography variant="caption">
                Margen: {formatPercentage(profitSummary?.utilidad?.margenNeto)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DoctorIcon />
                <Typography variant="subtitle2">Hospitalizaciones</Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {doctorRankings?.totales?.hospitalizaciones || 0}
              </Typography>
              <Typography variant="caption">
                Pacientes: {doctorRankings?.totales?.pacientes || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sub-pestañas */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={subTabValue}
            onChange={handleSubTabChange}
            aria-label="reportes gerenciales tabs"
          >
            <Tab icon={<DoctorIcon />} label="Ranking Médicos" />
            <Tab icon={<MoneyIcon />} label="Utilidades" />
            <Tab icon={<AssessmentIcon />} label="Costos" />
          </Tabs>
        </Box>

        {/* Tab: Ranking de Médicos */}
        <TabPanel value={subTabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Médicos por Ingresos Generados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ranking de médicos ordenados por los ingresos totales generados al hospital
            </Typography>

            {doctorRankings?.medicos && doctorRankings.medicos.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Médico</TableCell>
                      <TableCell>Especialidad</TableCell>
                      <TableCell align="center">Hospitalizaciones</TableCell>
                      <TableCell align="center">Pacientes</TableCell>
                      <TableCell align="right">Productos</TableCell>
                      <TableCell align="right">Servicios</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          Total Ingresos
                          <Tooltip title="Ingresos totales generados por el médico (productos + servicios)">
                            <InfoIcon fontSize="small" />
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {doctorRankings.medicos.map((medico, index) => (
                      <TableRow
                        key={medico.id}
                        sx={{
                          bgcolor: index === 0 ? 'success.50' : index === 1 ? 'warning.50' : index === 2 ? 'info.50' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={index + 1}
                            size="small"
                            color={index === 0 ? 'success' : index === 1 ? 'warning' : index === 2 ? 'info' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                            {medico.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {medico.cedulaProfesional}
                          </Typography>
                        </TableCell>
                        <TableCell>{medico.especialidad}</TableCell>
                        <TableCell align="center">{medico.hospitalizaciones}</TableCell>
                        <TableCell align="center">{medico.pacientes}</TableCell>
                        <TableCell align="right">{formatCurrency(medico.ingresos.productos)}</TableCell>
                        <TableCell align="right">{formatCurrency(medico.ingresos.servicios)}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: 'success.main' }}
                          >
                            {formatCurrency(medico.ingresos.total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No hay datos de médicos disponibles para el período seleccionado
              </Alert>
            )}

            {doctorRankings?.totales && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Hospitalizaciones</Typography>
                    <Typography variant="h6">{doctorRankings.totales.hospitalizaciones}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Pacientes</Typography>
                    <Typography variant="h6">{doctorRankings.totales.pacientes}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Productos</Typography>
                    <Typography variant="h6">{formatCurrency(doctorRankings.totales.productos)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Servicios</Typography>
                    <Typography variant="h6">{formatCurrency(doctorRankings.totales.servicios)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab: Utilidades */}
        <TabPanel value={subTabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Análisis de Utilidades
            </Typography>

            {profitSummary ? (
              <Grid container spacing={3}>
                {/* Ingresos */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Ingresos
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Productos:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.ingresos.productos)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Servicios:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.ingresos.servicios)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">Total:</Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="success.main">
                        {formatCurrency(profitSummary.ingresos.total)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Costos */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Costos
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Productos:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.costos.productos)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Servicios:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.costos.servicios)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Operativos:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.costos.operativos)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Nómina:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.costos.nomina)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">Total:</Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="error.main">
                        {formatCurrency(profitSummary.costos.total)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Utilidad */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{
                    p: 2,
                    bgcolor: Number(profitSummary.utilidad.neta) >= 0 ? 'info.50' : 'warning.50'
                  }}>
                    <Typography
                      variant="subtitle2"
                      color={Number(profitSummary.utilidad.neta) >= 0 ? 'info.main' : 'warning.main'}
                      gutterBottom
                    >
                      Utilidad
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Utilidad Bruta:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(profitSummary.utilidad.bruta)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Margen Bruto:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPercentage(profitSummary.utilidad.margenBruto)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">Utilidad Neta:</Typography>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color={Number(profitSummary.utilidad.neta) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(profitSummary.utilidad.neta)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Margen Neto:</Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={Number(profitSummary.utilidad.margenNeto) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(profitSummary.utilidad.margenNeto)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                No hay datos de utilidades disponibles para el período seleccionado
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Nota:</strong> Los costos de servicios sin costo real definido se calculan usando
                el porcentaje de estimación configurado (por defecto 60% del precio de venta).
              </Typography>
            </Alert>
          </Box>
        </TabPanel>

        {/* Tab: Costos */}
        <TabPanel value={subTabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Resumen de Costos Operativos
            </Typography>

            {costSummary ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Costo Total
                        </Typography>
                        <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
                          {formatCurrency(costSummary.totalGeneral)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nómina
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {formatCurrency(costSummary.nomina.total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {costSummary.nomina.empleados} empleados
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Proyección Trimestral
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {formatCurrency(costSummary.proyeccion.trimestral)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Proyección Anual
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {formatCurrency(costSummary.proyeccion.anual)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" gutterBottom>
                  Desglose por Categoría
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Categoría</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Monto Total</TableCell>
                        <TableCell align="right">% del Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costSummary.porCategoria.map((cat) => (
                        <TableRow key={cat.categoria}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {CATEGORIA_COSTO_LABELS[cat.categoria as keyof typeof CATEGORIA_COSTO_LABELS] || cat.categoria}
                              {cat.calculadoDesdeEmpleados && (
                                <Tooltip title="Calculado desde los salarios de empleados">
                                  <Chip label="Auto" size="small" color="info" />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">{cat.cantidad}</TableCell>
                          <TableCell align="right">{formatCurrency(cat.total)}</TableCell>
                          <TableCell align="right">
                            {costSummary.totalGeneral > 0
                              ? ((cat.total / costSummary.totalGeneral) * 100).toFixed(1)
                              : '0.0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info">
                No hay datos de costos disponibles para el período seleccionado
              </Alert>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ManagerialReportsTab;
