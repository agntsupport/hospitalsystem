import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface StockAlertStatsProps {
  stats: {
    total: number;
    critical: number;
    warning: number;
    byType: Record<string, number>;
    trend: 'improving' | 'stable' | 'worsening';
  };
  loading?: boolean;
  onConfigureAlerts?: () => void;
}

const StockAlertStats: React.FC<StockAlertStatsProps> = ({
  stats,
  loading = false,
  onConfigureAlerts
}) => {
  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'improving':
        return <TrendingDownIcon color="success" />;
      case 'worsening':
        return <TrendingUpIcon color="error" />;
      case 'stable':
        return <TrendingFlatIcon color="info" />;
      default:
        return <TrendingFlatIcon />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'improving':
        return 'success.main';
      case 'worsening':
        return 'error.main';
      case 'stable':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  const getTrendText = () => {
    switch (stats.trend) {
      case 'improving':
        return 'Mejorando';
      case 'worsening':
        return 'Empeorando';
      case 'stable':
        return 'Estable';
      default:
        return 'Sin datos';
    }
  };

  const getCriticalPercentage = () => {
    return stats.total > 0 ? (stats.critical / stats.total) * 100 : 0;
  };

  const getWarningPercentage = () => {
    return stats.total > 0 ? (stats.warning / stats.total) * 100 : 0;
  };

  if (loading) {
    return (
      <Card elevation={1}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">Calculando estadísticas...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={1}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h3">
            Estadísticas de Alertas
          </Typography>
          {onConfigureAlerts && (
            <Tooltip title="Configurar alertas">
              <IconButton onClick={onConfigureAlerts} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Overview Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: stats.total > 0 ? 'warning.50' : 'success.50',
                border: '1px solid',
                borderColor: stats.total > 0 ? 'warning.200' : 'success.200'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color={stats.total > 0 ? 'warning.main' : 'success.main'}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Alertas
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: stats.critical > 0 ? 'error.50' : 'grey.50',
                border: '1px solid',
                borderColor: stats.critical > 0 ? 'error.200' : 'grey.200'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color={stats.critical > 0 ? 'error.main' : 'text.secondary'}>
                {stats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Críticas
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: stats.warning > 0 ? 'warning.50' : 'grey.50',
                border: '1px solid',
                borderColor: stats.warning > 0 ? 'warning.200' : 'grey.200'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color={stats.warning > 0 ? 'warning.main' : 'text.secondary'}>
                {stats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advertencias
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                {getTrendIcon()}
                <Typography variant="h6" fontWeight="bold" color={getTrendColor()}>
                  {getTrendText()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tendencia
              </Typography>
            </Paper>
          </Grid>

          {/* Severity Breakdown */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Distribución por Severidad
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" fontSize="small" />
                  <Typography variant="body2">Críticas</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {stats.critical} ({getCriticalPercentage().toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getCriticalPercentage()}
                color="error"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography variant="body2">Advertencias</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {stats.warning} ({getWarningPercentage().toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getWarningPercentage()}
                color="warning"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>

          {/* Type Breakdown */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Alertas por Tipo
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<ErrorIcon />}
                label={`Sin Stock: ${stats.byType.out_of_stock || 0}`}
                color="error"
                size="small"
                variant={stats.byType.out_of_stock > 0 ? 'filled' : 'outlined'}
              />
              <Chip
                icon={<WarningIcon />}
                label={`Stock Bajo: ${stats.byType.low_stock || 0}`}
                color="warning"
                size="small"
                variant={stats.byType.low_stock > 0 ? 'filled' : 'outlined'}
              />
              <Chip
                icon={<InfoIcon />}
                label={`Por Vencer: ${stats.byType.expiring_soon || 0}`}
                color="info"
                size="small"
                variant={stats.byType.expiring_soon > 0 ? 'filled' : 'outlined'}
              />
              <Chip
                icon={<ErrorIcon />}
                label={`Vencidos: ${stats.byType.expired || 0}`}
                color="error"
                size="small"
                variant={stats.byType.expired > 0 ? 'filled' : 'outlined'}
              />
            </Box>
          </Grid>

          {/* Health Score */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Estado General del Inventario
              </Typography>
              {stats.total === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<TrendingUpIcon />} label="Excelente" color="success" />
                  <Typography variant="body2" color="text.secondary">
                    No hay alertas activas. Todos los productos están en niveles óptimos.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {stats.critical > 0 && (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label={`Requiere Atención Inmediata (${stats.critical} alertas críticas)`} 
                      color="error" 
                      sx={{ mb: 1 }}
                    />
                  )}
                  {stats.warning > 0 && (
                    <Chip 
                      icon={<WarningIcon />} 
                      label={`Monitoreo Necesario (${stats.warning} advertencias)`} 
                      color="warning"
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StockAlertStats;