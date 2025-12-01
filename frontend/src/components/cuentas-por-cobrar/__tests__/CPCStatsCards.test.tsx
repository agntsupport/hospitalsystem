// ABOUTME: Tests unitarios para CPCStatsCards - Dashboard de estadísticas de Cuentas por Cobrar
// ABOUTME: Cubre rendering de métricas, formateo de moneda, y distribución por estado

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CPCStatsCards from '../CPCStatsCards';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockStats = {
  totalCPCActivas: 15,
  montoPendienteTotal: 45000.50,
  montoRecuperadoTotal: 25000.75,
  porcentajeRecuperacion: 35.7,
  distribucionPorEstado: {
    pendiente: { cantidad: 5, monto: 15000.00 },
    pagado_parcial: { cantidad: 8, monto: 20000.00 },
    pagado_total: { cantidad: 10, monto: 30000.00 },
    cancelado: { cantidad: 2, monto: 5000.00 },
  },
};

describe('CPCStatsCards - Unit Tests', () => {
  describe('A1. Basic Rendering', () => {
    it('should render all 4 main stat cards', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText('CPC Activas')).toBeInTheDocument();
      expect(screen.getByText('Monto Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Monto Recuperado')).toBeInTheDocument();
      expect(screen.getByText('Tasa de Recuperación')).toBeInTheDocument();
    });

    it('should display stat values correctly', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText('15')).toBeInTheDocument(); // totalCPCActivas
      expect(screen.getByText(/\$45,000\.50/)).toBeInTheDocument(); // montoPendienteTotal
      expect(screen.getByText(/\$25,000\.75/)).toBeInTheDocument(); // montoRecuperadoTotal
      expect(screen.getByText('35.7%')).toBeInTheDocument(); // porcentajeRecuperacion
    });

    it('should display stat subtitles', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText('Cuentas pendientes de pago')).toBeInTheDocument();
      expect(screen.getByText('Total por recuperar')).toBeInTheDocument();
      expect(screen.getByText('Total cobrado')).toBeInTheDocument();
      expect(screen.getByText('Porcentaje cobrado')).toBeInTheDocument();
    });

    it('should render distribution by status', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Pago Parcial')).toBeInTheDocument();
      expect(screen.getByText('Pagado Total')).toBeInTheDocument();
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });

    it('should display distribution quantities', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // pendiente cantidad
      expect(screen.getByText('8')).toBeInTheDocument(); // pagado_parcial cantidad
      expect(screen.getByText('10')).toBeInTheDocument(); // pagado_total cantidad
      expect(screen.getByText('2')).toBeInTheDocument(); // cancelado cantidad
    });

    it('should display distribution amounts', () => {
      renderWithTheme(<CPCStatsCards stats={mockStats} />);

      expect(screen.getByText(/\$15,000\.00/)).toBeInTheDocument(); // pendiente monto
      expect(screen.getByText(/\$20,000\.00/)).toBeInTheDocument(); // pagado_parcial monto
      expect(screen.getByText(/\$30,000\.00/)).toBeInTheDocument(); // pagado_total monto
      expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument(); // cancelado monto
    });
  });

  describe('A2. Formatting', () => {
    it('should format large currency values correctly', () => {
      const largeStats = {
        ...mockStats,
        montoPendienteTotal: 1500000.99,
        montoRecuperadoTotal: 850000.50,
      };

      renderWithTheme(<CPCStatsCards stats={largeStats} />);

      expect(screen.getByText(/\$1,500,000\.99/)).toBeInTheDocument();
      expect(screen.getByText(/\$850,000\.50/)).toBeInTheDocument();
    });

    it('should format percentage with one decimal', () => {
      const statsWithDecimals = {
        ...mockStats,
        porcentajeRecuperacion: 45.678,
      };

      renderWithTheme(<CPCStatsCards stats={statsWithDecimals} />);

      expect(screen.getByText('45.7%')).toBeInTheDocument();
    });

    it('should handle 0% recovery rate', () => {
      const statsWithZero = {
        ...mockStats,
        porcentajeRecuperacion: 0,
      };

      renderWithTheme(<CPCStatsCards stats={statsWithZero} />);

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('should handle 100% recovery rate', () => {
      const statsWithFull = {
        ...mockStats,
        porcentajeRecuperacion: 100,
      };

      renderWithTheme(<CPCStatsCards stats={statsWithFull} />);

      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  describe('A3. Zero Values', () => {
    it('should display zero values correctly', () => {
      const zeroStats = {
        totalCPCActivas: 0,
        montoPendienteTotal: 0,
        montoRecuperadoTotal: 0,
        porcentajeRecuperacion: 0,
        distribucionPorEstado: {
          pendiente: { cantidad: 0, monto: 0 },
          pagado_parcial: { cantidad: 0, monto: 0 },
          pagado_total: { cantidad: 0, monto: 0 },
          cancelado: { cantidad: 0, monto: 0 },
        },
      };

      renderWithTheme(<CPCStatsCards stats={zeroStats} />);

      // Should show 0 for activas and distribution quantities
      // Multiple elements show "0" (main stat + 4 distribution quantities)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(5); // 1 main + 4 distribution

      // Should show $0.00 for amounts (6 total: 2 main + 4 distribution)
      const zeroAmounts = screen.getAllByText(/\$0\.00/);
      expect(zeroAmounts.length).toBeGreaterThanOrEqual(4);

      // Should show 0.0% for percentage
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('A4. Icons', () => {
    it('should render icons for each stat card', () => {
      const { container } = renderWithTheme(<CPCStatsCards stats={mockStats} />);

      // Should have at least 4 icons (one per main stat card)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('A5. Grid Layout', () => {
    it('should render stat cards in grid', () => {
      const { container } = renderWithTheme(<CPCStatsCards stats={mockStats} />);

      // Check for Grid container
      const grids = container.querySelectorAll('.MuiGrid-root');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should render distribution boxes in grid', () => {
      const { container } = renderWithTheme(<CPCStatsCards stats={mockStats} />);

      // Distribution section should have 4 boxes
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Pago Parcial')).toBeInTheDocument();
      expect(screen.getByText('Pagado Total')).toBeInTheDocument();
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });
  });

  describe('A6. Edge Cases', () => {
    it('should handle very small decimal amounts', () => {
      const smallStats = {
        ...mockStats,
        montoPendienteTotal: 0.01,
        montoRecuperadoTotal: 0.99,
      };

      renderWithTheme(<CPCStatsCards stats={smallStats} />);

      expect(screen.getByText(/\$0\.01/)).toBeInTheDocument();
      expect(screen.getByText(/\$0\.99/)).toBeInTheDocument();
    });

    it('should handle mixed positive and zero distribution', () => {
      const mixedStats = {
        ...mockStats,
        distribucionPorEstado: {
          pendiente: { cantidad: 10, monto: 50000.00 },
          pagado_parcial: { cantidad: 0, monto: 0 },
          pagado_total: { cantidad: 5, monto: 25000.00 },
          cancelado: { cantidad: 0, monto: 0 },
        },
      };

      renderWithTheme(<CPCStatsCards stats={mixedStats} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument();

      // Should show 0 for empty categories
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2); // At least 2 zeros for empty categories
    });
  });
});
