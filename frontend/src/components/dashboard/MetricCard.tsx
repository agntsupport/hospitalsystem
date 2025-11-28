// ABOUTME: MetricCard wrapper sobre el nuevo StatCard unificado del Design System
// ABOUTME: Mantiene compatibilidad hacia atrás con la API anterior mientras usa el nuevo diseño

import React from 'react';
import { CardProps } from '@mui/material';
import StatCard from '@/components/common/StatCard';

export interface MetricCardProps {
  /** Título de la métrica (ej: "Ingresos Totales") */
  title: string;

  /** Valor numérico o string a mostrar */
  value: number | string;

  /** Icono de Material-UI (ej: <AttachMoney />) */
  icon: React.ReactElement;

  /** Color del avatar (hex o theme color) */
  color: string;

  /** Formato del valor */
  format?: 'currency' | 'percentage' | 'number';

  /** Subtítulo descriptivo opcional */
  subtitle?: string;

  /** Datos de tendencia opcional */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };

  /** Información adicional para tooltip (no usado en nuevo diseño) */
  tooltipInfo?: string;

  /** Altura fija o auto (no usado en nuevo diseño) */
  height?: string | number;

  /** Props adicionales de Card (no usado en nuevo diseño) */
  CardProps?: Partial<CardProps>;
}

/**
 * Mapea colores hex a colores del tema MUI
 */
const mapColorToTheme = (hexColor: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    // Greens
    '#4caf50': 'success',
    '#388e3c': 'success',
    '#2e7d32': 'success',
    // Blues
    '#2196f3': 'info',
    '#1976d2': 'primary',
    '#1565c0': 'primary',
    '#00bcd4': 'info',
    '#0288d1': 'info',
    // Oranges/Warnings
    '#ff9800': 'warning',
    '#f57c00': 'warning',
    '#ed6c02': 'warning',
    // Reds/Errors
    '#f44336': 'error',
    '#d32f2f': 'error',
    // Purples/Secondary
    '#9c27b0': 'secondary',
    '#7b1fa2': 'secondary',
    // Grays (default to primary)
    '#607d8b': 'primary',
  };

  return colorMap[hexColor.toLowerCase()] || 'primary';
};

/**
 * MetricCard - Wrapper compatible con API anterior que usa StatCard internamente
 *
 * @deprecated Usar StatCard directamente para nuevos componentes
 *
 * @example
 * <MetricCard
 *   title="Ingresos del Mes"
 *   value={15000}
 *   icon={<AttachMoney />}
 *   color="#4caf50"
 *   format="currency"
 *   subtitle="Ventas + Servicios"
 * />
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  format = 'number',
  subtitle,
  trend,
}) => {
  // Mapear la estructura de trend antigua a la nueva
  const mappedTrend = trend
    ? {
        value: trend.value,
        direction: trend.isPositive ? 'up' as const : 'down' as const,
        label: trend.label,
      }
    : undefined;

  // Mapear formato
  const mappedFormat = format === 'number' ? 'none' as const : format;

  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      color={mapColorToTheme(color)}
      format={mappedFormat}
      subtitle={subtitle}
      trend={mappedTrend}
    />
  );
};

export default MetricCard;
