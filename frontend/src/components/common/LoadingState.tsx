// ABOUTME: Componente LoadingState unificado del Design System
// ABOUTME: Proporciona estados de carga consistentes para contenido, tablas y cards

import React, { memo } from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { spacing, loadingState, statsCard } from '@/theme';

/**
 * Tipos de loading disponibles
 */
export type LoadingType = 'spinner' | 'linear' | 'skeleton' | 'card' | 'table' | 'stats';

/**
 * Props del componente LoadingState
 */
export interface LoadingStateProps {
  /** Tipo de indicador de carga */
  type?: LoadingType;
  /** Mensaje de carga */
  message?: string;
  /** Tamaño del spinner */
  size?: 'small' | 'medium' | 'large';
  /** Número de skeletons a mostrar (para type='card' o 'table') */
  count?: number;
  /** Altura mínima del contenedor */
  minHeight?: number | string;
  /** Centrar verticalmente */
  centered?: boolean;
  /** Color del indicador */
  color?: 'primary' | 'secondary' | 'inherit';
}

/**
 * Configuración de tamaños
 */
const sizeConfig = {
  small: {
    spinner: 24,
    text: 'caption' as const,
  },
  medium: {
    spinner: 40,
    text: 'body2' as const,
  },
  large: {
    spinner: 56,
    text: 'body1' as const,
  },
};

/**
 * LoadingState - Componente para mostrar estados de carga
 *
 * @example
 * // Spinner centrado
 * <LoadingState type="spinner" message="Cargando datos..." />
 *
 * @example
 * // Skeletons de cards
 * <LoadingState type="card" count={4} />
 *
 * @example
 * // Skeleton de tabla
 * <LoadingState type="table" count={5} />
 */
const LoadingState: React.FC<LoadingStateProps> = memo(({
  type = 'spinner',
  message,
  size = 'medium',
  count = 3,
  minHeight = loadingState.minHeight,
  centered = true,
  color = 'primary',
}) => {
  const config = sizeConfig[size];

  // Spinner centrado
  if (type === 'spinner') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: centered ? 'center' : 'flex-start',
          minHeight,
          py: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <CircularProgress size={config.spinner} color={color} />
        {message && (
          <Typography variant={config.text} color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Barra de progreso lineal
  if (type === 'linear') {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress color={color} />
        {message && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Skeleton básico
  if (type === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={40}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  // Skeleton de cards (Stats Cards)
  if (type === 'stats') {
    return (
      <Grid container spacing={spacing.md}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid item xs={statsCard.columns.xs} sm={statsCard.columns.sm} md={statsCard.columns.md} lg={statsCard.columns.lg} key={index}>
            <Card elevation={1}>
              <CardContent sx={{ p: spacing.md }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="80%" height={32} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Skeleton de cards genéricas
  if (type === 'card') {
    return (
      <Grid container spacing={spacing.md}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={1}>
              <CardContent>
                <Skeleton variant="text" width="70%" height={28} />
                <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="90%" height={20} />
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Skeleton de tabla
  if (type === 'table') {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Header de tabla */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: '8px 8px 0 0',
          }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              variant="text"
              width={`${100 / 5}%`}
              height={24}
            />
          ))}
        </Box>
        {/* Filas de tabla */}
        {Array.from({ length: count }).map((_, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <Skeleton
                key={`row-${rowIndex}-col-${colIndex}`}
                variant="text"
                width={`${100 / 5}%`}
                height={20}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return null;
});

LoadingState.displayName = 'LoadingState';

/**
 * FullPageLoader - Loader de página completa
 */
export const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2,
    }}
  >
    <CircularProgress size={60} />
    {message && (
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

/**
 * InlineLoader - Loader pequeño inline
 */
export const InlineLoader: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <CircularProgress size={size} thickness={4} />
);

/**
 * ButtonLoader - Loader para dentro de botones
 */
export const ButtonLoader: React.FC<{ color?: 'inherit' | 'primary' | 'secondary' }> = ({
  color = 'inherit',
}) => <CircularProgress size={20} color={color} thickness={4} />;

/**
 * StatsCardsLoader - Loader específico para stats cards
 */
export const StatsCardsLoader: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <LoadingState type="stats" count={count} />
);

/**
 * TableLoader - Loader específico para tablas
 */
export const TableLoader: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <LoadingState type="table" count={rows} />
);

export default LoadingState;
