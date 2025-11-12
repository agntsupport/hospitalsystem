// ABOUTME: Tests unitarios para MetricCard - Tarjeta completa integrando Label, Value y Trend
// Cubre integración de componentes, responsive design, formatos, tooltips, trends y edge cases

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricCard } from '../MetricCard';
import { AttachMoney } from '@mui/icons-material';

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 1250000,
    icon: <AttachMoney />,
    color: '#4caf50',
    format: 'currency' as const
  };

  describe('rendering', () => {
    it('renderiza sin errores', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });

    it('renderiza título, valor e icono', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('$1,250,000.00')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="AttachMoneyIcon"]')).toBeInTheDocument();
    });

    it('renderiza subtítulo cuando se proporciona', () => {
      render(
        <MetricCard
          {...defaultProps}
          subtitle="Ventas + Servicios"
        />
      );
      expect(screen.getByText('Ventas + Servicios')).toBeInTheDocument();
    });

    it('renderiza indicador de tendencia cuando se proporciona', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 12.5, isPositive: true }}
        />
      );
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });
  });

  describe('formats', () => {
    it('formatea valores de moneda correctamente', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByText('$1,250,000.00')).toBeInTheDocument();
    });

    it('formatea porcentajes correctamente', () => {
      render(
        <MetricCard
          {...defaultProps}
          value={15.7}
          format="percentage"
        />
      );
      expect(screen.getByText('15.7%')).toBeInTheDocument();
    });

    it('formatea números con separadores', () => {
      render(
        <MetricCard
          {...defaultProps}
          value={1250000}
          format="number"
        />
      );
      expect(screen.getByText('1,250,000')).toBeInTheDocument();
    });
  });

  describe('trends', () => {
    it('muestra icono verde para tendencia positiva', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 12.5, isPositive: true }}
        />
      );

      const icon = container.querySelector('[data-testid="TrendingUpIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('muestra icono rojo para tendencia negativa', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: -5.3, isPositive: false }}
        />
      );

      const icon = container.querySelector('[data-testid="TrendingDownIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('muestra label personalizado en tendencia', async () => {
      const user = userEvent.setup();
      render(
        <MetricCard
          {...defaultProps}
          trend={{
            value: 12.5,
            isPositive: true,
            label: 'vs trimestre'
          }}
        />
      );

      const trendBox = screen.getByText('12.5%').closest('div');
      if (trendBox) {
        await user.hover(trendBox);

        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('12.5% vs trimestre');
        });
      }
    });
  });

  describe('tooltips', () => {
    it('muestra tooltip en valor cuando tooltipInfo está proporcionado', async () => {
      const user = userEvent.setup();
      render(
        <MetricCard
          {...defaultProps}
          value={999999999}
          tooltipInfo="Valor total acumulado"
        />
      );

      const valueElement = screen.getByText('$999,999,999.00');
      await user.hover(valueElement);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Valor total acumulado');
      });
    });
  });

  describe('styling and layout', () => {
    it('aplica color correcto al avatar', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const avatar = container.querySelector('.MuiAvatar-root');
      expect(avatar).toHaveStyle({ backgroundColor: '#4caf50' });
    });

    it('aplica altura personalizada cuando se proporciona', () => {
      const { container } = render(
        <MetricCard {...defaultProps} height={200} />
      );
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ height: '200px' });
    });

    it('usa altura 100% por defecto', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ height: '100%' });
    });

    it('tiene minHeight de 140px', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ minHeight: '140px' });
    });
  });

  describe('edge cases', () => {
    it('maneja valores cero', () => {
      render(<MetricCard {...defaultProps} value={0} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja null retornando $0.00', () => {
      render(<MetricCard {...defaultProps} value={null as any} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja undefined retornando $0.00', () => {
      render(<MetricCard {...defaultProps} value={undefined as any} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja NaN retornando $0.00', () => {
      render(<MetricCard {...defaultProps} value={NaN} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('maneja valores negativos', () => {
      render(<MetricCard {...defaultProps} value={-1250000} />);
      expect(screen.getByText('-$1,250,000.00')).toBeInTheDocument();
    });

    it('maneja valores string directamente', () => {
      render(<MetricCard {...defaultProps} value="Valor personalizado" />);
      expect(screen.getByText('Valor personalizado')).toBeInTheDocument();
    });

    it('maneja números muy grandes sin romper layout', () => {
      render(<MetricCard {...defaultProps} value={999999999999999} />);
      expect(screen.getByText(/\$999,999,999,999,999\.00/)).toBeInTheDocument();
    });

    it('maneja títulos muy largos', () => {
      const longTitle = 'This is a very long title that should be truncated with ellipsis in a single line';
      render(<MetricCard {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('maneja subtítulos muy largos', () => {
      const longSubtitle = 'This is a very long subtitle that should be truncated';
      render(<MetricCard {...defaultProps} subtitle={longSubtitle} />);
      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('renderiza sin trend cuando no se proporciona', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      expect(container.querySelector('[data-testid="TrendingUpIcon"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="TrendingDownIcon"]')).not.toBeInTheDocument();
    });

    it('renderiza sin subtitle cuando no se proporciona', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      expect(screen.queryByText('Ventas + Servicios')).not.toBeInTheDocument();
      // Verificar que hay un Avatar renderizado
      expect(container.querySelector('.MuiAvatar-root')).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('renderiza todos los elementos juntos correctamente', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          subtitle="Ventas + Servicios"
          trend={{ value: 12.5, isPositive: true }}
          tooltipInfo="Total acumulado del mes"
        />
      );

      // Verificar título
      expect(screen.getByText('Test Metric')).toBeInTheDocument();

      // Verificar valor
      expect(screen.getByText('$1,250,000.00')).toBeInTheDocument();

      // Verificar subtítulo
      expect(screen.getByText('Ventas + Servicios')).toBeInTheDocument();

      // Verificar tendencia
      expect(screen.getByText('12.5%')).toBeInTheDocument();

      // Verificar icono
      expect(container.querySelector('[data-testid="AttachMoneyIcon"]')).toBeInTheDocument();
    });
  });
});
