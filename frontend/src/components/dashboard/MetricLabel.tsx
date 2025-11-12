// ABOUTME: Componente de etiqueta para métricas con detección automática de truncamiento y tooltip
// Detecta si el texto está truncado usando scrollHeight/clientHeight y muestra tooltip solo cuando es necesario

import React, { useRef, useState, useEffect } from 'react';
import { Typography, Tooltip, TypographyProps } from '@mui/material';

export interface MetricLabelProps {
  /** Título de la métrica */
  title: string;

  /** Mostrar tooltip con título completo si se trunca */
  showTooltipOnTruncate?: boolean;

  /** Número máximo de líneas antes de truncar */
  maxLines?: number;

  /** Props de Typography */
  TypographyProps?: Partial<TypographyProps>;
}

export const MetricLabel: React.FC<MetricLabelProps> = ({
  title,
  showTooltipOnTruncate = true,
  maxLines = 1,
  TypographyProps: customTypographyProps
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Detectar si el texto está truncado
  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(
        element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth
      );
    }
  }, [title]);

  const labelElement = (
    <Typography
      ref={textRef}
      color="textSecondary"
      gutterBottom
      variant="h6"
      sx={{
        fontSize: '0.875rem',
        fontWeight: 500,
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.4,
        mb: 0.5,
        ...customTypographyProps?.sx
      }}
      {...customTypographyProps}
    >
      {title}
    </Typography>
  );

  // Mostrar tooltip solo si está truncado
  if (showTooltipOnTruncate && isTruncated) {
    return (
      <Tooltip title={title} placement="top" arrow>
        {labelElement}
      </Tooltip>
    );
  }

  return labelElement;
};
