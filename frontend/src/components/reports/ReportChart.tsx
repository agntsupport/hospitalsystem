import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  useTheme,
  Paper
} from '@mui/material';
import { ChartDataPoint, CHART_COLORS } from '@/types/reports.types';

interface BaseChartProps {
  title: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  showValues?: boolean;
}

// Componente base para crear gráficos SVG simples
const BaseChart: React.FC<BaseChartProps & { children: React.ReactNode }> = ({
  title,
  children,
  height = 300,
  showLegend = true,
  data
}) => {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height, position: 'relative' }}>
          {children}
        </Box>
        {showLegend && data.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length],
                    mr: 1,
                    borderRadius: '2px'
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Gráfico de barras
export const BarChart: React.FC<BaseChartProps> = ({
  title,
  data,
  height = 300,
  showLegend = true,
  showValues = true
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Filtrar datos válidos y asegurar valores numéricos
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value) && isFinite(d.value));
  
  if (validData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos válidos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...validData.map(d => d.value));
  const chartHeight = height - 80; // Espacio para labels
  const chartWidth = 400;
  const barWidth = Math.min(60, chartWidth / validData.length - 10);
  const spacing = (chartWidth - (barWidth * validData.length)) / (validData.length + 1);

  return (
    <BaseChart title={title} data={validData} height={height} showLegend={showLegend}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {validData.map((item, index) => {
          // Calcular posiciones con validaciones adicionales
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
          const x = spacing + (index * (barWidth + spacing));
          const y = height - 60 - barHeight;
          const color = item.color || CHART_COLORS[index % CHART_COLORS.length];

          // Validar que todas las coordenadas sean números válidos
          if (!isFinite(x) || !isFinite(y) || !isFinite(barHeight) || !isFinite(barWidth)) {
            return null; // Omitir barras con coordenadas inválidas
          }

          return (
            <g key={index}>
              {/* Barra */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={2}
              />
              
              {/* Valor */}
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#666"
                >
                  {item.value.toLocaleString()}
                </text>
              )}
              
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - 40}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - 40})`}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </BaseChart>
  );
};

// Gráfico de líneas
export const LineChart: React.FC<BaseChartProps & { showGrid?: boolean }> = ({
  title,
  data,
  height = 300,
  showLegend = true,
  showValues = false,
  showGrid = true
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Filtrar datos válidos y asegurar valores numéricos
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value));
  
  if (validData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos válidos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...validData.map(d => d.value));
  const minValue = Math.min(...validData.map(d => d.value));
  const chartHeight = height - 80;
  const chartWidth = 400;
  const padding = 40;

  const getX = (index: number) => {
    // Evitar división por cero cuando hay un solo punto o menos
    if (validData.length <= 1) return chartWidth / 2;
    return padding + (index * (chartWidth - 2 * padding)) / (validData.length - 1);
  };
  
  const getY = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return height / 2; // Valor por defecto si el valor es inválido
    const range = maxValue - minValue;
    if (range === 0) return height / 2; // Si todos los valores son iguales
    const normalizedValue = (value - minValue) / range;
    return height - 60 - (normalizedValue * chartHeight);
  };

  // Crear path para la línea usando datos válidos
  const pathData = validData.map((item, index) => {
    const x = getX(index);
    const y = getY(item.value);
    
    // Validar que las coordenadas sean números válidos
    if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
      return null; // Omitir coordenadas inválidas
    }
    
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).filter(Boolean).join(' ');

  return (
    <BaseChart title={title} data={[]} height={height} showLegend={false}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {/* Grid */}
        {showGrid && (
          <g stroke="#e0e0e0" strokeWidth="1">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = height - 60 - (ratio * chartHeight);
              return (
                <line
                  key={index}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                />
              );
            })}
          </g>
        )}

        {/* Línea */}
        <path
          d={pathData}
          stroke={CHART_COLORS[0]}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos y labels */}
        {validData.map((item, index) => {
          const x = getX(index);
          const y = getY(item.value);

          // Validar que todas las coordenadas sean números válidos antes de renderizar
          if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
            return null; // Omitir elementos con coordenadas inválidas
          }

          return (
            <g key={index}>
              {/* Punto */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={CHART_COLORS[0]}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Valor */}
              {showValues && (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                >
                  {item.value.toLocaleString()}
                </text>
              )}
              
              {/* Label */}
              <text
                x={x}
                y={height - 40}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </BaseChart>
  );
};

// Gráfico de dona/pie
export const DonutChart: React.FC<BaseChartProps & { innerRadius?: number }> = ({
  title,
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0.4
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Filtrar datos válidos y asegurar valores numéricos
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value) && d.value > 0);
  
  if (validData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No hay datos válidos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const total = validData.reduce((sum, item) => sum + item.value, 0);
  const centerX = 200;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  const innerR = radius * innerRadius;

  let currentAngle = -90; // Empezar desde arriba

  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const start1 = polarToCartesian(centerX, centerY, outerR, endAngle);
    const end1 = polarToCartesian(centerX, centerY, outerR, startAngle);
    const start2 = polarToCartesian(centerX, centerY, innerR, endAngle);
    const end2 = polarToCartesian(centerX, centerY, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start1.x, start1.y,
      "A", outerR, outerR, 0, largeArcFlag, 0, end1.x, end1.y,
      "L", end2.x, end2.y,
      "A", innerR, innerR, 0, largeArcFlag, 1, start2.x, start2.y,
      "L", start1.x, start1.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <BaseChart title={title} data={validData} height={height} showLegend={showLegend}>
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}>
        {validData.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (item.value / total) * 360;
          const endAngle = currentAngle + angle;
          const color = item.color || CHART_COLORS[index % CHART_COLORS.length];

          const path = createArcPath(currentAngle, endAngle, radius, innerR);
          
          // Calcular posición para el porcentaje
          const labelAngle = currentAngle + angle / 2;
          const labelRadius = (radius + innerR) / 2;
          const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);

          currentAngle = endAngle;

          return (
            <g key={index}>
              <path
                d={path}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
              {percentage > 5 && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  fontWeight="bold"
                >
                  {percentage.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
        
        {/* Centro del donut con total */}
        {innerRadius > 0 && (
          <g>
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              fontSize="14"
              fill="#666"
              fontWeight="bold"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              fontSize="18"
              fill="#333"
              fontWeight="bold"
            >
              {total.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </BaseChart>
  );
};

// Componente de métricas simples
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: string;
  icon?: React.ReactNode;
}> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary',
  icon
}) => {
  const theme = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return theme.palette.success.main;
      case 'down': return theme.palette.error.main;
      case 'stable': return theme.palette.warning.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
          cursor: 'help'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 1,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {subtitle}
            </Typography>
          )}
          {trend && trendValue !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: getTrendColor(),
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {getTrendIcon()} {Math.abs(trendValue).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs período anterior
              </Typography>
            </Box>
          )}
        </Box>
        {icon && (
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default {
  BarChart,
  LineChart,
  DonutChart,
  MetricCard
};