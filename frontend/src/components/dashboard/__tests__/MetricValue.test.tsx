// ABOUTME: Tests unitarios para MetricValue - Formateo de valores con tooltips automáticos
// Cubre formatos (currency, percentage, number), edge cases (NaN, null, undefined) y tooltips largos

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricValue } from '../MetricValue';

describe('MetricValue', () => {
  describe('currency format', () => {
    it('formatea moneda correctamente', () => {
      render(<MetricValue value={1250000} format="currency" />);
      expect(screen.getByText('$1,250,000.00')).toBeInTheDocument();
    });

    it('maneja valores con decimales', () => {
      render(<MetricValue value={500.50} format="currency" />);
      expect(screen.getByText('$500.50')).toBeInTheDocument();
    });

    it('maneja valores negativos', () => {
      render(<MetricValue value={-1250000} format="currency" />);
      expect(screen.getByText('-$1,250,000.00')).toBeInTheDocument();
    });
  });

  describe('percentage format', () => {
    it('formatea porcentajes correctamente', () => {
      render(<MetricValue value={15.7} format="percentage" />);
      expect(screen.getByText('15.7%')).toBeInTheDocument();
    });

    it('maneja porcentajes negativos', () => {
      render(<MetricValue value={-5.3} format="percentage" />);
      expect(screen.getByText('-5.3%')).toBeInTheDocument();
    });
  });

  describe('number format', () => {
    it('formatea números con separadores de miles', () => {
      render(<MetricValue value={1250000} format="number" />);
      expect(screen.getByText('1,250,000')).toBeInTheDocument();
    });

    it('redondea decimales', () => {
      render(<MetricValue value={1250.99} format="number" />);
      expect(screen.getByText('1,251')).toBeInTheDocument();
    });
  });

  describe('tooltips', () => {
    it('muestra tooltip cuando tooltipInfo está proporcionado', async () => {
      const user = userEvent.setup();
      render(
        <MetricValue
          value={1250000}
          format="currency"
          tooltipInfo="Total acumulado del mes"
        />
      );

      const valueElement = screen.getByText('$1,250,000.00');
      await user.hover(valueElement);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Total acumulado del mes');
      });
    });

    it('muestra tooltip automático para valores largos (>12 caracteres)', async () => {
      const user = userEvent.setup();
      render(<MetricValue value={999999999999999} format="currency" />);

      const valueElement = screen.getByText('$999,999,999,999,999.00');
      await user.hover(valueElement);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('$999,999,999,999,999.00');
      });
    });

    it('no muestra tooltip para valores cortos sin tooltipInfo', async () => {
      const user = userEvent.setup();
      render(<MetricValue value={100} format="currency" />);

      const valueElement = screen.getByText('$100.00');
      await user.hover(valueElement);

      // Esperar un momento para asegurarse que no aparece
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('maneja valores cero', () => {
      render(<MetricValue value={0} format="currency" />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja null retornando $0.00', () => {
      render(<MetricValue value={null as any} format="currency" />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja undefined retornando $0.00', () => {
      render(<MetricValue value={undefined as any} format="currency" />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja NaN retornando $0.00', () => {
      render(<MetricValue value={NaN} format="currency" />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja strings directamente', () => {
      render(<MetricValue value="Valor personalizado" />);
      expect(screen.getByText('Valor personalizado')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('aplica wordBreak para valores largos', () => {
      const { container } = render(
        <MetricValue value={999999999999999} format="currency" />
      );

      const typography = container.querySelector('[class*="MuiTypography"]');
      expect(typography).toHaveStyle({
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      });
    });

    it('limita a 2 líneas máximo con overflow hidden', () => {
      const { container } = render(
        <MetricValue value={999999999999999} format="currency" />
      );

      const typography = container.querySelector('[class*="MuiTypography"]');
      expect(typography).toHaveStyle({
        overflow: 'hidden'
      });
    });

    it('aplica props personalizados de Typography', () => {
      render(
        <MetricValue
          value={1250000}
          format="currency"
          TypographyProps={{ 'data-testid': 'custom-value' }}
        />
      );

      expect(screen.getByTestId('custom-value')).toBeInTheDocument();
    });
  });
});
