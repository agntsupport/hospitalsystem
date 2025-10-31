import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Skeleton,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  ReportFilters,
  ExecutiveSummary,
  KPIMetric,
  KPI_CATEGORIES
} from '@/types/reports.types';
import reportsService from '@/services/reportsService';
import { LineChart, MetricCard } from '@/components/reports/ReportChart';

interface ExecutiveDashboardTabProps {
  filters: ReportFilters;
  onError: (error: string | null) => void;
  onLoading: (loading: boolean) => void;
}

const ExecutiveDashboardTab: React.FC<ExecutiveDashboardTabProps> = ({
  filters,
  onError,
  onLoading
}) => {
  const [loading, setLoading] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      onLoading(true);
      onError(null);

      // Validar filtros
      const validation = reportsService.validateFilters(filters);
      if (!validation.valid) {
        onError(validation.errors.join(', '));
        return;
      }

      // Cargar datos ejecutivos
      const [summaryResponse, kpisResponse] = await Promise.all([
        reportsService.getExecutiveSummary(filters),
        reportsService.getKPIs(filters)
      ]);

      if (summaryResponse.success) {
        setExecutiveSummary(summaryResponse.data || null);
      } else {
        console.error('Error en resumen ejecutivo:', summaryResponse.message);
      }

      if (kpisResponse.success) {
        setKpis(kpisResponse.data?.items || []);
      } else {
        console.error('Error en KPIs:', kpisResponse.message);
      }

    } catch (error: any) {
      console.error('Error al cargar datos ejecutivos:', error);
      onError('Error al cargar el dashboard ejecutivo');
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  useEffect(() => {
    loadExecutiveData();
  }, [filters]);

  const getTrendIcon = (tendencia: 'up' | 'down' | 'stable') => {
    switch (tendencia) {
      case 'up':
        return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      case 'stable':
        return <TrendingFlatIcon sx={{ color: 'warning.main' }} />;
      default:
        return <TrendingFlatIcon />;
    }
  };

  const getAlertIcon = (tipo: 'critica' | 'advertencia' | 'informacion') => {
    switch (tipo) {
      case 'critica':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'advertencia':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'informacion':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertSeverity = (tipo: 'critica' | 'advertencia' | 'informacion'): 'error' | 'warning' | 'info' => {
    switch (tipo) {
      case 'critica':
        return 'error';
      case 'advertencia':
        return 'warning';
      case 'informacion':
        return 'info';
      default:
        return 'info';
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'financiero':
        return <MoneyIcon sx={{ fontSize: 40 }} />;
      case 'operativo':
        return <AssessmentIcon sx={{ fontSize: 40 }} />;
      case 'calidad':
        return <StarIcon sx={{ fontSize: 40 }} />;
      case 'eficiencia':
        return <TrendingUpIcon sx={{ fontSize: 40 }} />;
      default:
        return <AssessmentIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'financiero':
        return 'success';
      case 'operativo':
        return 'primary';
      case 'calidad':
        return 'warning';
      case 'eficiencia':
        return 'info';
      default:
        return 'primary';
    }
  };

  const renderExecutiveSummary = () => {
    if (loading || !executiveSummary) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Grid item xs={12} sm={6} md={2.4} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    const { resumenEjecutivo } = executiveSummary;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Ingresos Totales
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {reportsService.formatCurrency(resumenEjecutivo.ingresosTotales)}
                </Typography>
                <Typography variant="caption">
                  Incluye todos los ingresos del hospital en el período seleccionado
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <div>
              <MetricCard
                title="Ingresos Totales"
                value={reportsService.formatCurrency(resumenEjecutivo.ingresosTotales)}
                subtitle={reportsService.formatDateRange(
                  executiveSummary.periodo.fechaInicio,
                  executiveSummary.periodo.fechaFin
                )}
                icon={<MoneyIcon sx={{ fontSize: 40 }} />}
                color="success"
              />
            </div>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Utilidad Neta
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {reportsService.formatCurrency(resumenEjecutivo.utilidadNeta)}
                </Typography>
                <Typography variant="caption">
                  Ingresos menos gastos operativos. Margen: {resumenEjecutivo.ingresosTotales > 0 ? ((Number(resumenEjecutivo.utilidadNeta) / Number(resumenEjecutivo.ingresosTotales)) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <div>
              <MetricCard
                title="Utilidad Neta"
                value={reportsService.formatCurrency(resumenEjecutivo.utilidadNeta)}
                subtitle={`${resumenEjecutivo.ingresosTotales > 0 ? ((Number(resumenEjecutivo.utilidadNeta) / Number(resumenEjecutivo.ingresosTotales)) * 100).toFixed(1) : 0}% margen`}
                icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                color="primary"
              />
            </div>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Pacientes Atendidos
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {resumenEjecutivo.pacientesAtendidos.toLocaleString()}
                </Typography>
                <Typography variant="caption">
                  Total de pacientes únicos atendidos en consultas, emergencias y hospitalización
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <div>
              <MetricCard
                title="Pacientes Atendidos"
                value={resumenEjecutivo.pacientesAtendidos}
                subtitle="En el período"
                icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                color="info"
              />
            </div>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Ocupación Promedio
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {resumenEjecutivo.ocupacionPromedio}%
                </Typography>
                <Typography variant="caption">
                  Porcentaje promedio de habitaciones ocupadas. Meta: 85% para rentabilidad óptima
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <div>
              <MetricCard
                title="Ocupación Promedio"
                value={`${resumenEjecutivo.ocupacionPromedio}%`}
                subtitle="Habitaciones"
                icon={<HotelIcon sx={{ fontSize: 40 }} />}
                color="warning"
              />
            </div>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Satisfacción General
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {resumenEjecutivo.satisfaccionGeneral}/5.0 ★
                </Typography>
                <Typography variant="caption">
                  Calificación promedio de pacientes en encuestas de satisfacción post-atención
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <div>
              <MetricCard
                title="Satisfacción General"
                value={`${resumenEjecutivo.satisfaccionGeneral}/5.0`}
                subtitle="Calificación promedio"
                icon={<StarIcon sx={{ fontSize: 40 }} />}
                color="success"
              />
            </div>
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  const renderKPIs = () => {
    if (loading || kpis.length === 0) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {kpi.nombre}
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 'bold', 
                        mb: 1,
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {typeof kpi.valor === 'number' ? 
                        (kpi.unidad === 'MXN' ? reportsService.formatCurrency(kpi.valor) : 
                         kpi.unidad === '%' ? `${kpi.valor.toFixed(1)}%` :
                         `${kpi.valor.toLocaleString()} ${kpi.unidad}`) 
                        : kpi.valor}
                    </Typography>
                    {kpi.meta && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Meta: {kpi.unidad === 'MXN' ? reportsService.formatCurrency(kpi.meta) : 
                               kpi.unidad === '%' ? `${kpi.meta.toFixed(1)}%` :
                               `${kpi.meta.toLocaleString()} ${kpi.unidad}`}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTrendIcon(kpi.tendencia)}
                      <Typography
                        variant="body2"
                        sx={{
                          color: reportsService.getTrendColor(kpi.tendencia),
                          fontWeight: 'medium'
                        }}
                      >
                        {Math.abs(kpi.cambio).toFixed(1)}% vs anterior
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    {getCategoryIcon(kpi.categoria)}
                  </Box>
                </Box>
                <Chip
                  label={kpi.categoria}
                  size="small"
                  color={getCategoryColor(kpi.categoria) as any}
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderTrends = () => {
    if (loading || !executiveSummary || !executiveSummary.tendencias) {
      return (
        <Grid container spacing={3}>
          {[1, 2].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="rectangular" width="100%" height={300} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        {executiveSummary.tendencias.map((tendencia, index) => (
          <Grid item xs={12} md={6} key={index}>
            <LineChart
              title={`Tendencia: ${tendencia.indicador}`}
              data={tendencia.datosHistoricos}
              height={300}
              showValues={true}
              showLegend={false}
              showGrid={true}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAlerts = () => {
    if (loading || !executiveSummary || !executiveSummary.alertas) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={200} />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon />
            Alertas y Notificaciones
          </Typography>
          
          {executiveSummary.alertas.length === 0 ? (
            <Alert severity="success">
              No hay alertas activas en este momento
            </Alert>
          ) : (
            <List>
              {executiveSummary.alertas.map((alerta, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getAlertIcon(alerta.tipo)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body1"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {alerta.mensaje}
                          </Typography>
                          <Chip
                            label={alerta.area}
                            size="small"
                            color={getAlertSeverity(alerta.tipo)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        alerta.valor && (
                          <Typography variant="body2" color="text.secondary">
                            Valor actual: {alerta.valor.toLocaleString()}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                  {index < executiveSummary.alertas.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600,
            mb: 1
          }}
        >
          <DashboardIcon color="primary" />
          Dashboard Ejecutivo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen ejecutivo con KPIs principales y tendencias del hospital
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Resumen Ejecutivo */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                pl: 2,
                py: 1,
                backgroundColor: 'background.paper',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                borderRadius: '4px 0 0 4px',
                fontWeight: 600
              }}
            >
              Métricas Principales
            </Typography>
          </Box>
          {renderExecutiveSummary()}
        </Grid>

        {/* KPIs */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                pl: 2,
                py: 1,
                backgroundColor: 'background.paper',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                borderRadius: '4px 0 0 4px',
                fontWeight: 600
              }}
            >
              Indicadores Clave de Rendimiento (KPIs)
            </Typography>
          </Box>
          {renderKPIs()}
        </Grid>

        {/* Tendencias */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                pl: 2,
                py: 1,
                backgroundColor: 'background.paper',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                borderRadius: '4px 0 0 4px',
                fontWeight: 600
              }}
            >
              Tendencias Históricas
            </Typography>
          </Box>
          {renderTrends()}
        </Grid>

        {/* Alertas */}
        <Grid item xs={12}>
          {renderAlerts()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveDashboardTab;