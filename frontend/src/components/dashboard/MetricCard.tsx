// ABOUTME: Tarjeta de métrica reutilizable con layout Grid 9/3, tooltips, formato de valores y responsive design
// Combina MetricLabel, MetricValue y MetricTrend en un Card cohesivo con avatar de icono

import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Avatar,
  Typography,
  CardProps,
} from '@mui/material';
import { MetricLabel } from './MetricLabel';
import { MetricValue } from './MetricValue';
import { MetricTrend } from './MetricTrend';

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

  /** Información adicional para tooltip */
  tooltipInfo?: string;

  /** Altura fija o auto */
  height?: string | number;

  /** Props adicionales de Card */
  CardProps?: Partial<CardProps>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  format = 'number',
  subtitle,
  trend,
  tooltipInfo,
  height,
  CardProps: customCardProps
}) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: height || '100%',
        minHeight: 140,
        ...customCardProps?.sx
      }}
      {...customCardProps}
    >
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Columna de contenido - flexible */}
          <Grid item xs={9} sm={8} md={9}>
            <MetricLabel title={title} />
            <MetricValue
              value={value}
              format={format}
              tooltipInfo={tooltipInfo}
            />
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <MetricTrend
                value={trend.value}
                isPositive={trend.isPositive}
                label={trend.label}
              />
            )}
          </Grid>

          {/* Columna de icono - fijo */}
          <Grid item xs={3} sm={4} md={3}>
            <Avatar
              sx={{
                bgcolor: color,
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 },
                margin: '0 auto'
              }}
            >
              {icon && React.isValidElement(icon)
                ? React.cloneElement(icon, {
                    sx: {
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }
                  } as any)
                : icon}
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
