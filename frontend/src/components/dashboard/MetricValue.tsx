// ABOUTME: Componente para formatear y mostrar valores numéricos de métricas con tooltip automático
// Maneja edge cases (NaN, null, undefined) y valores muy largos con wordBreak

import React from 'react';
import { Typography, Tooltip, Box, TypographyProps } from '@mui/material';
import { formatMetricValue } from '@/utils/formatters';

export interface MetricValueProps {
  /** Valor a mostrar */
  value: number | string;

  /** Formato del valor */
  format?: 'currency' | 'percentage' | 'number';

  /** Texto del tooltip (opcional) */
  tooltipInfo?: string;

  /** Props de Typography */
  TypographyProps?: Partial<TypographyProps>;
}

export const MetricValue: React.FC<MetricValueProps> = ({
  value,
  format = 'number',
  tooltipInfo,
  TypographyProps: customTypographyProps
}) => {
  const formattedValue = formatMetricValue(value, format);

  // Si el valor formateado es muy largo, agregar tooltip automático
  const isLongValue = formattedValue.length > 12;
  const tooltipTitle = tooltipInfo || (isLongValue ? formattedValue : '');

  const valueElement = (
    <Typography
      variant="h4"
      component="div"
      sx={{
        fontWeight: 'bold',
        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
        lineHeight: 1.2,
        // ✅ SOLUCIÓN: Permitir wrap en valores largos
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        // Limitar a 2 líneas máximo
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        ...customTypographyProps?.sx
      }}
      {...customTypographyProps}
    >
      {formattedValue}
    </Typography>
  );

  // Solo envolver en tooltip si hay contenido
  if (tooltipTitle) {
    return (
      <Tooltip
        title={tooltipTitle}
        placement="top"
        arrow
        enterDelay={300}
        leaveDelay={200}
      >
        <Box sx={{ cursor: 'help' }}>
          {valueElement}
        </Box>
      </Tooltip>
    );
  }

  return valueElement;
};
