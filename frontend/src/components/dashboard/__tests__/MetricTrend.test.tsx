// ABOUTME: Tests unitarios para MetricTrend - Indicadores de tendencia con iconos y tooltips
// Cubre tendencias positivas/negativas, valores absolutos, edge cases (NaN, null, undefined)

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricTrend } from '../MetricTrend';

describe('MetricTrend', () => {
  describe('rendering', () => {
    it('renderiza tendencia positiva correctamente', () => {
      render(<MetricTrend value={12.5} isPositive={true} />);
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    it('renderiza tendencia negativa correctamente', () => {
      render(<MetricTrend value={-5.3} isPositive={false} />);
      expect(screen.getByText('5.3%')).toBeInTheDocument();
    });

    it('muestra valor absoluto (sin signo negativo)', () => {
      render(<MetricTrend value={-15.7} isPositive={false} />);
      expect(screen.getByText('15.7%')).toBeInTheDocument();
      expect(screen.queryByText('-15.7%')).not.toBeInTheDocument();
    });

    it('formatea valores con 1 decimal', () => {
      render(<MetricTrend value={12.555} isPositive={true} />);
      expect(screen.getByText('12.6%')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('muestra icono TrendingUp para tendencia positiva', () => {
      const { container } = render(<MetricTrend value={12.5} isPositive={true} />);
      const icon = container.querySelector('[data-testid="TrendingUpIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('muestra icono TrendingDown para tendencia negativa', () => {
      const { container } = render(<MetricTrend value={-5.3} isPositive={false} />);
      const icon = container.querySelector('[data-testid="TrendingDownIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('puede ocultar icono con showIcon=false', () => {
      const { container } = render(
        <MetricTrend value={12.5} isPositive={true} showIcon={false} />
      );
      const icon = container.querySelector('[data-testid="TrendingUpIcon"]');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('usa color success para tendencia positiva', () => {
      render(<MetricTrend value={12.5} isPositive={true} />);
      const percentageText = screen.getByText('12.5%');
      expect(percentageText).toHaveStyle({ color: 'rgb(46, 125, 50)' }); // success.main
    });

    it('usa color error para tendencia negativa', () => {
      render(<MetricTrend value={-5.3} isPositive={false} />);
      const percentageText = screen.getByText('5.3%');
      expect(percentageText).toHaveStyle({ color: 'rgb(211, 47, 47)' }); // error.main
    });
  });

  describe('tooltips', () => {
    it('muestra tooltip con label por defecto', async () => {
      const user = userEvent.setup();
      render(<MetricTrend value={12.5} isPositive={true} />);

      const trendBox = screen.getByText('12.5%').closest('div');
      if (trendBox) {
        await user.hover(trendBox);

        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('12.5% vs mes anterior');
        });
      }
    });

    it('muestra tooltip con label personalizado', async () => {
      const user = userEvent.setup();
      render(
        <MetricTrend
          value={12.5}
          isPositive={true}
          label="vs trimestre anterior"
        />
      );

      const trendBox = screen.getByText('12.5%').closest('div');
      if (trendBox) {
        await user.hover(trendBox);

        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('12.5% vs trimestre anterior');
        });
      }
    });

    it('tooltip muestra valor absoluto', async () => {
      const user = userEvent.setup();
      render(<MetricTrend value={-15.7} isPositive={false} />);

      const trendBox = screen.getByText('15.7%').closest('div');
      if (trendBox) {
        await user.hover(trendBox);

        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('15.7% vs mes anterior');
        });
      }
    });
  });

  describe('edge cases', () => {
    it('no renderiza si value es undefined', () => {
      const { container } = render(
        <MetricTrend value={undefined as any} isPositive={true} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('no renderiza si value es null', () => {
      const { container } = render(
        <MetricTrend value={null as any} isPositive={true} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('no renderiza si value es NaN', () => {
      const { container } = render(
        <MetricTrend value={NaN} isPositive={true} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('maneja valor cero', () => {
      render(<MetricTrend value={0} isPositive={true} />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('maneja valores muy grandes', () => {
      render(<MetricTrend value={999.999} isPositive={true} />);
      expect(screen.getByText('1000.0%')).toBeInTheDocument();
    });

    it('maneja valores muy pequeños', () => {
      render(<MetricTrend value={0.001} isPositive={true} />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });
});
