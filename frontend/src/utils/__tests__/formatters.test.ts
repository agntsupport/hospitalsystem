// ABOUTME: Tests unitarios para funciones de formateo de métricas (currency, percentage, number, margin)
// Cubre edge cases: NaN, null, undefined, división por cero, números negativos, muy grandes

import { formatMetricValue, formatMarginPercentage } from '../formatters';

describe('formatters', () => {
  describe('formatMetricValue', () => {
    describe('currency format', () => {
      it('formatea valores de moneda correctamente', () => {
        expect(formatMetricValue(1250000, 'currency')).toBe('$1,250,000.00');
        expect(formatMetricValue(500.50, 'currency')).toBe('$500.50');
        expect(formatMetricValue(0, 'currency')).toBe('$0.00');
      });

      it('maneja valores negativos correctamente', () => {
        expect(formatMetricValue(-1250000, 'currency')).toBe('-$1,250,000.00');
      });

      it('maneja números muy grandes', () => {
        expect(formatMetricValue(999999999999999, 'currency')).toBe('$999,999,999,999,999.00');
      });

      it('maneja NaN retornando $0.00', () => {
        expect(formatMetricValue(NaN, 'currency')).toBe('$0.00');
      });

      it('maneja null retornando $0.00', () => {
        expect(formatMetricValue(null as any, 'currency')).toBe('$0.00');
      });

      it('maneja undefined retornando $0.00', () => {
        expect(formatMetricValue(undefined as any, 'currency')).toBe('$0.00');
      });
    });

    describe('percentage format', () => {
      it('formatea porcentajes correctamente', () => {
        expect(formatMetricValue(15.7, 'percentage')).toBe('15.7%');
        expect(formatMetricValue(100, 'percentage')).toBe('100.0%');
        expect(formatMetricValue(0, 'percentage')).toBe('0.0%');
      });

      it('maneja porcentajes negativos', () => {
        expect(formatMetricValue(-5.3, 'percentage')).toBe('-5.3%');
      });

      it('maneja NaN retornando 0', () => {
        expect(formatMetricValue(NaN, 'percentage')).toBe('0');
      });

      it('maneja null retornando 0', () => {
        expect(formatMetricValue(null as any, 'percentage')).toBe('0');
      });

      it('maneja undefined retornando 0', () => {
        expect(formatMetricValue(undefined as any, 'percentage')).toBe('0');
      });
    });

    describe('number format', () => {
      it('formatea números con separadores de miles', () => {
        expect(formatMetricValue(1250000, 'number')).toBe('1,250,000');
        expect(formatMetricValue(500, 'number')).toBe('500');
        expect(formatMetricValue(0, 'number')).toBe('0');
      });

      it('redondea decimales', () => {
        expect(formatMetricValue(1250000.99, 'number')).toBe('1,250,001');
      });

      it('maneja números negativos', () => {
        expect(formatMetricValue(-1250000, 'number')).toBe('-1,250,000');
      });

      it('maneja NaN retornando 0', () => {
        expect(formatMetricValue(NaN, 'number')).toBe('0');
      });
    });

    describe('string values', () => {
      it('retorna strings directamente', () => {
        expect(formatMetricValue('Valor personalizado', 'currency')).toBe('Valor personalizado');
        expect(formatMetricValue('100 pacientes', 'number')).toBe('100 pacientes');
        expect(formatMetricValue('', 'currency')).toBe('');
      });
    });
  });

  describe('formatMarginPercentage', () => {
    it('calcula margen correctamente', () => {
      expect(formatMarginPercentage(300, 1000)).toBe('30.0% margen');
      expect(formatMarginPercentage(500, 2000)).toBe('25.0% margen');
      expect(formatMarginPercentage(0, 1000)).toBe('0.0% margen');
    });

    it('maneja división por cero retornando 0.0%', () => {
      expect(formatMarginPercentage(100, 0)).toBe('0.0% margen');
      expect(formatMarginPercentage(0, 0)).toBe('0.0% margen');
    });

    it('maneja ingresos negativos retornando 0.0%', () => {
      expect(formatMarginPercentage(100, -500)).toBe('0.0% margen');
    });

    it('maneja NaN retornando 0.0%', () => {
      expect(formatMarginPercentage(NaN, 1000)).toBe('0.0% margen');
      expect(formatMarginPercentage(100, NaN)).toBe('0.0% margen');
      expect(formatMarginPercentage(NaN, NaN)).toBe('0.0% margen');
    });

    it('maneja utilidad negativa (pérdida)', () => {
      expect(formatMarginPercentage(-200, 1000)).toBe('-20.0% margen');
    });

    it('maneja margen mayor a 100%', () => {
      expect(formatMarginPercentage(1500, 1000)).toBe('150.0% margen');
    });
  });
});
