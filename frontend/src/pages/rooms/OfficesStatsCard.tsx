import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  MeetingRoom as OfficeIcon,
  CheckCircle as AvailableIcon,
  Block as OccupiedIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  TrendingUp as StatsIcon,
} from '@mui/icons-material';

import { OfficeStats, OFFICE_TYPES } from '@/types/rooms.types';

interface OfficesStatsCardProps {
  stats: OfficeStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const OfficesStatsCard: React.FC<OfficesStatsCardProps> = ({ stats, loading, onRefresh }) => {
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'error';
    if (rate >= 70) return 'warning';
    if (rate >= 50) return 'info';
    return 'success';
  };

  if (loading || !stats) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfficeIcon color="secondary" />
            <Typography variant="h6" component="h2">
              Estadísticas de Consultorios
            </Typography>
          </Box>
          <IconButton onClick={onRefresh} size="small" title="Actualizar">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Overall Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary" fontWeight="bold">
                {stats?.totalOffices || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats?.availableOffices || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Disponibles
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {stats?.occupiedOffices || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ocupados
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats?.maintenanceOffices || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mantenimiento
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Occupancy Rate */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              Tasa de Ocupación
            </Typography>
            <Chip
              label={`${(stats?.occupancyRate || 0).toFixed(1)}%`}
              color={getOccupancyColor(stats?.occupancyRate || 0)}
              size="small"
              icon={<StatsIcon />}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats?.occupancyRate || 0}
            color={getOccupancyColor(stats.occupancyRate)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* By Office Type */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfficeIcon fontSize="small" />
            Distribución por Tipo
          </Typography>
          <Box sx={{ mt: 2 }}>
            {Object.entries(stats?.officesByType || {}).map(([tipo, data]) => (
              <Box key={tipo} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {OFFICE_TYPES[tipo as keyof typeof OFFICE_TYPES] || tipo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.total} consultorios
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    label={`${data.available} Disp.`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`${data.occupied} Ocup.`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                  {data.maintenance > 0 && (
                    <Chip
                      label={`${data.maintenance} Mant.`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
                {data.total > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={(data.occupied / data.total) * 100}
                    color={data.occupied / data.total >= 0.8 ? 'error' : 'secondary'}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OfficesStatsCard;