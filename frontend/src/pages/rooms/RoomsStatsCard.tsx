// ABOUTME: Tarjeta de estadísticas de Habitaciones para el módulo de Rooms
// ABOUTME: Usa StatCard unificado del Design System para consistencia visual
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
  Hotel as RoomIcon,
  CheckCircle as AvailableIcon,
  Block as OccupiedIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  TrendingUp as StatsIcon,
} from '@mui/icons-material';

import { RoomStats, ROOM_TYPES } from '@/types/rooms.types';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';

interface RoomsStatsCardProps {
  stats: RoomStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const RoomsStatsCard: React.FC<RoomsStatsCardProps> = ({ stats, loading, onRefresh }) => {
  const getOccupancyColor = (rate: number): 'error' | 'warning' | 'info' | 'success' => {
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
            <RoomIcon color="primary" />
            <Typography variant="h6" component="h2">
              Estadísticas de Habitaciones
            </Typography>
          </Box>
          <IconButton onClick={onRefresh} size="small" title="Actualizar">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Estadísticas principales usando StatCard unificado */}
        <StatCardsGrid columns={{ xs: 6, sm: 6, md: 6, lg: 6 }} sx={{ mb: 3 }}>
          <StatCard
            title="Total"
            value={stats?.totalRooms || 0}
            icon={<RoomIcon />}
            color="primary"
          />
          <StatCard
            title="Disponibles"
            value={stats?.availableRooms || 0}
            icon={<AvailableIcon />}
            color="success"
          />
          <StatCard
            title="Ocupadas"
            value={stats?.occupiedRooms || 0}
            icon={<OccupiedIcon />}
            color="error"
          />
          <StatCard
            title="Mantenimiento"
            value={stats?.maintenanceRooms || 0}
            icon={<MaintenanceIcon />}
            color="warning"
          />
        </StatCardsGrid>

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
            color={getOccupancyColor(stats?.occupancyRate || 0)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* By Room Type */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RoomIcon fontSize="small" />
            Distribución por Tipo
          </Typography>
          <Box sx={{ mt: 2 }}>
            {Object.entries(stats?.roomsByType || {}).map(([tipo, data]) => (
              <Box key={tipo} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {ROOM_TYPES[tipo as keyof typeof ROOM_TYPES] || tipo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.total} habitaciones
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
                    color={data.occupied / data.total >= 0.8 ? 'error' : 'primary'}
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

export default RoomsStatsCard;
