// ABOUTME: Utilidades de formateo para valores de métricas (moneda, porcentajes, números)
// Incluye validación de edge cases (NaN, null, undefined, división por cero)

/**
 * Formatea un valor según el tipo especificado
 * @param value - Valor a formatear (number o string)
 * @param format - Tipo de formato ('currency' | 'percentage' | 'number')
 * @returns String formateado con separadores de miles y decimales apropiados
 */
export const formatMetricValue = (
  value: number | string,
  format: 'currency' | 'percentage' | 'number'
): string => {
  // Manejar strings directamente
  if (typeof value === 'string') {
    return value;
  }

  // Validar número
  const numericValue = Number(value);
  if (isNaN(numericValue) || value === null || value === undefined) {
    return format === 'currency' ? '$0.00' : '0';
  }

  switch (format) {
    case 'currency':
      // Usar Intl.NumberFormat para formato consistente
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericValue);

    case 'percentage':
      // Validar para evitar NaN%
      return `${numericValue.toFixed(1)}%`;

    case 'number':
      // Con separadores de miles
      return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numericValue);

    default:
      return String(numericValue);
  }
};

/**
 * Formatea un margen de utilidad con validación de división por cero
 * @param utilidad - Utilidad neta
 * @param ingresos - Ingresos totales
 * @returns String formateado (ej: "30.5% margen" o "0.0% margen" si división inválida)
 */
export const formatMarginPercentage = (
  utilidad: number,
  ingresos: number
): string => {
  // ✅ SOLUCIÓN: Validar división por cero
  if (ingresos <= 0 || isNaN(ingresos) || isNaN(utilidad)) {
    return '0.0% margen';
  }

  const margin = ((utilidad / ingresos) * 100).toFixed(1);
  return `${margin}% margen`;
};
