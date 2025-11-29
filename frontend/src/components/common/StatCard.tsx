// ABOUTME: Componente StatCard unificado del Design System
// ABOUTME: Reemplaza MetricCard, BillingStatsCards, CPCStatsCards y POSStatsCards

import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { spacing, elevation, iconSize } from '@/theme';

/**
 * Props del componente StatCard
 */
export interface StatCardProps {
  /** Título de la métrica */
  title: string;
  /** Valor principal a mostrar */
  value: string | number;
  /** Subtítulo o descripción adicional */
  subtitle?: string;
  /** Icono a mostrar (componente MUI Icon) */
  icon: React.ReactNode;
  /** Color del tema para el icono y acentos */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Indicador de tendencia */
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  /** Estado de carga */
  loading?: boolean;
  /** Función al hacer click */
  onClick?: () => void;
  /** Formato del valor (currency, number, percentage) */
  format?: 'currency' | 'number' | 'percentage' | 'none';
  /** Prefijo para el valor (ej: "$") */
  prefix?: string;
  /** Sufijo para el valor (ej: "%") */
  suffix?: string;
}

/**
 * Formatea el valor según el tipo especificado
 */
const formatValue = (
  value: string | number,
  format?: 'currency' | 'number' | 'percentage' | 'none',
  prefix?: string,
  suffix?: string
): string => {
  if (typeof value === 'string' && format === 'none') {
    return `${prefix || ''}${value}${suffix || ''}`;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  let formatted: string;
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
      break;
    case 'percentage':
      formatted = `${numValue.toFixed(1)}%`;
      break;
    case 'number':
      formatted = new Intl.NumberFormat('es-MX').format(numValue);
      break;
    default:
      formatted = String(value);
  }

  return `${prefix || ''}${formatted}${suffix || ''}`;
};

/**
 * StatCard - Componente unificado para mostrar métricas y estadísticas
 *
 * @example
 * // Uso básico
 * <StatCard
 *   title="Pacientes Activos"
 *   value={42}
 *   icon={<PeopleIcon />}
 *   color="primary"
 * />
 *
 * @example
 * // Con tendencia y formato de moneda
 * <StatCard
 *   title="Ingresos del Día"
 *   value={15000}
 *   icon={<AttachMoneyIcon />}
 *   color="success"
 *   format="currency"
 *   trend={{ value: 12, direction: 'up', label: 'vs ayer' }}
 * />
 */
const StatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  loading = false,
  onClick,
  format = 'none',
  prefix,
  suffix,
}) => {
  const theme = useTheme();
  const colorValue = theme.palette[color].main;
  const lightColor = alpha(colorValue, 0.1);

  if (loading) {
    return (
      <Card
        elevation={elevation.card}
        sx={{
          height: '100%',
          minHeight: 140,
        }}
      >
        <CardContent sx={{ p: spacing.md }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
            <Skeleton variant="circular" width={iconSize.xxl} height={iconSize.xxl} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={36} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={elevation.card}
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: 140,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              elevation: elevation.raised,
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[3],
            }
          : {},
      }}
    >
      <CardContent sx={{ p: spacing.md, '&:last-child': { pb: spacing.md } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.sm,
          }}
        >
          {/* Icono en Avatar */}
          <Avatar
            sx={{
              width: iconSize.xxl,
              height: iconSize.xxl,
              bgcolor: lightColor,
              color: colorValue,
            }}
          >
            {icon}
          </Avatar>

          {/* Contenido */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Título */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>

            {/* Valor principal */}
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatValue(value, format, prefix, suffix)}
            </Typography>

            {/* Subtítulo o Tendencia */}
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {trend && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: trend.direction === 'up' ? 'success.main' : 'error.main',
                  }}
                >
                  {trend.direction === 'up' ? (
                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </Typography>
                  {trend.label && (
                    <Typography variant="caption" color="text.secondary">
                      {trend.label}
                    </Typography>
                  )}
                </Box>
              )}
              {subtitle && !trend && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

/**
 * StatCardSkeleton - Skeleton para estado de carga
 */
export const StatCardSkeleton: React.FC = () => (
  <StatCard
    title=""
    value=""
    icon={null}
    loading={true}
  />
);

/**
 * StatCardsGrid - Grid responsive para múltiples StatCards
 */
export interface StatCardsGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Estilos adicionales MUI sx */
  sx?: object;
}

export const StatCardsGrid: React.FC<StatCardsGridProps> = memo(({
  children,
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${12 / (columns.xs || 12)}, 1fr)`,
          sm: `repeat(${12 / (columns.sm || 6)}, 1fr)`,
          md: `repeat(${12 / (columns.md || 4)}, 1fr)`,
          lg: `repeat(${12 / (columns.lg || 3)}, 1fr)`,
        },
        gap: spacing.md,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
});

StatCardsGrid.displayName = 'StatCardsGrid';

export default StatCard;
