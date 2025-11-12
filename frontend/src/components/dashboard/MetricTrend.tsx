// ABOUTME: Componente de indicador de tendencia con iconos TrendingUp/Down y tooltip contextual
// Valida valores NaN/null/undefined y formatea porcentajes con color semántico (verde=positivo, rojo=negativo)

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface MetricTrendProps {
  /** Valor de la tendencia (porcentaje) */
  value: number;

  /** Si es positiva o negativa */
  isPositive: boolean;

  /** Label explicativo (ej: "vs mes anterior") */
  label?: string;

  /** Mostrar ícono de tendencia */
  showIcon?: boolean;
}

export const MetricTrend: React.FC<MetricTrendProps> = ({
  value,
  isPositive,
  label = 'vs mes anterior',
  showIcon = true
}) => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  const tooltipText = `${Math.abs(value).toFixed(1)}% ${label}`;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'success.main' : 'error.main';

  return (
    <Tooltip title={tooltipText} placement="top" arrow>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 1,
          cursor: 'help'
        }}
      >
        {showIcon && (
          <TrendIcon
            color={isPositive ? 'success' : 'error'}
            fontSize="small"
          />
        )}
        <Typography
          variant="body2"
          color={color}
          sx={{
            ml: showIcon ? 0.5 : 0,
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          {Math.abs(value).toFixed(1)}%
        </Typography>
      </Box>
    </Tooltip>
  );
};
