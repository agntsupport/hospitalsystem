// ABOUTME: Tests P0 para BillingStatsCards - Display component con 4 stat cards
// ABOUTME: Cubre loading states, null handling, rendering, y refresh functionality

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BillingStatsCards from '../BillingStatsCards';
import { BillingStats } from '@/types/billing.types';
import { billingService } from '@/services/billingService';

// Mock billingService
jest.mock('@/services/billingService', () => ({
  billingService: {
    formatCurrency: jest.fn((value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  }
}));

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockStats: BillingStats = {
  totalFacturado: 500000.00,
  totalCobrado: 425000.00,
  facturasPendientes: 15,
  promedioFactura: 12500.00,
  crecimientoMensual: 8.5,
  facturasPorMes: [],
  topPacientes: []
};

describe('BillingStatsCards - P0 Critical Tests', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('A1. Loading State', () => {
    it('should render loading skeletons when loading is true', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={null} loading={true} onRefresh={mockOnRefresh} />
      );

      // Should show 4 loading cards with CircularProgress
      const progressIndicators = container.querySelectorAll('.MuiCircularProgress-root');
      expect(progressIndicators.length).toBe(4);

      // Should show "Cargando..." text
      const loadingTexts = screen.getAllByText('Cargando...');
      expect(loadingTexts.length).toBe(4);
    });

    it('should not show stats when loading', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={true} onRefresh={mockOnRefresh} />
      );

      // Should not show stat titles
      expect(screen.queryByText('Total Facturado')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Cobrado')).not.toBeInTheDocument();
    });
  });

  describe('A2. Null/Error State', () => {
    it('should show error message when stats is null and not loading', () => {
      renderWithTheme(
        <BillingStatsCards stats={null} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText('No se pudieron cargar las estadísticas')).toBeInTheDocument();
    });

    it('should show refresh button in error state', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={null} loading={false} onRefresh={mockOnRefresh} />
      );

      const refreshIcon = container.querySelector('svg[data-testid="RefreshIcon"]');
      expect(refreshIcon).toBeInTheDocument();
    });

    it('should call onRefresh when refresh button clicked in error state', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={null} loading={false} onRefresh={mockOnRefresh} />
      );

      const refreshButton = container.querySelector('button');
      if (refreshButton) fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('A3. Basic Rendering', () => {
    it('should render all 4 stat cards', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText('Total Facturado')).toBeInTheDocument();
      expect(screen.getByText('Total Cobrado')).toBeInTheDocument();
      expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Promedio/Factura')).toBeInTheDocument();
    });

    it('should display formatted currency values', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Should call formatCurrency for each currency value
      expect(billingService.formatCurrency).toHaveBeenCalledWith(500000.00); // totalFacturado
      expect(billingService.formatCurrency).toHaveBeenCalledWith(425000.00); // totalCobrado
      expect(billingService.formatCurrency).toHaveBeenCalledWith(75000.00);  // saldoPendiente (calculated)
      expect(billingService.formatCurrency).toHaveBeenCalledWith(12500.00);  // promedioFactura
    });

    it('should display growth percentage', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText(/\+8\.5% mensual/)).toBeInTheDocument();
    });

    it('should display cobranza rate chip', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Cobranza rate = (425000 / 500000) * 100 = 85%
      expect(screen.getByText(/85\.0% de cobranza/)).toBeInTheDocument();
    });

    it('should display pending invoices count', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText('15 facturas pendientes')).toBeInTheDocument();
    });

    it('should render icons for each card', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Should have icons (multiple SVGs)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('A4. Calculated Values', () => {
    it('should calculate saldo pendiente correctly', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // saldoPendiente = totalFacturado - totalCobrado = 500000 - 425000 = 75000
      expect(billingService.formatCurrency).toHaveBeenCalledWith(75000.00);
    });

    it('should calculate cobranza rate correctly', () => {
      renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // cobranzaRate = (totalCobrado / totalFacturado) * 100 = (425000 / 500000) * 100 = 85%
      expect(screen.getByText(/85\.0% de cobranza/)).toBeInTheDocument();
    });

    it('should show 0% cobranza when totalFacturado is 0', () => {
      const zeroStats: BillingStats = {
        ...mockStats,
        totalFacturado: 0,
        totalCobrado: 0
      };

      renderWithTheme(
        <BillingStatsCards stats={zeroStats} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText(/0\.0% de cobranza/)).toBeInTheDocument();
    });

    it('should handle negative growth correctly', () => {
      const negativeGrowthStats: BillingStats = {
        ...mockStats,
        crecimientoMensual: -5.2
      };

      renderWithTheme(
        <BillingStatsCards stats={negativeGrowthStats} loading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText(/-5\.2% mensual/)).toBeInTheDocument();
    });
  });

  describe('A5. Refresh Functionality', () => {
    it('should render refresh button in Promedio/Factura card', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Should have at least one refresh button
      const refreshIcons = container.querySelectorAll('svg[data-testid="RefreshIcon"]');
      expect(refreshIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should call onRefresh when refresh button clicked', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      const refreshButton = container.querySelector('button[aria-label*="Refrescar"], button svg[data-testid="RefreshIcon"]')?.closest('button');
      if (refreshButton) fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe('A6. Null/Undefined Handling', () => {
    it('should handle undefined values in stats gracefully', () => {
      const undefinedStats = {
        totalFacturado: undefined,
        totalCobrado: undefined,
        facturasPendientes: undefined,
        promedioFactura: undefined,
        crecimientoMensual: undefined,
        facturasPorMes: [],
        topPacientes: []
      } as unknown as BillingStats;

      renderWithTheme(
        <BillingStatsCards stats={undefinedStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Should call formatCurrency with 0 for undefined values
      expect(billingService.formatCurrency).toHaveBeenCalledWith(0);

      // Should show 0 facturas pendientes
      expect(screen.getByText('0 facturas pendientes')).toBeInTheDocument();

      // Should show 0% growth
      expect(screen.getByText(/\+0\.0% mensual/)).toBeInTheDocument();
    });

    it('should handle null values in stats gracefully', () => {
      const nullStats = {
        totalFacturado: null,
        totalCobrado: null,
        facturasPendientes: null,
        promedioFactura: null,
        crecimientoMensual: null,
        facturasPorMes: [],
        topPacientes: []
      } as unknown as BillingStats;

      renderWithTheme(
        <BillingStatsCards stats={nullStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // Should call formatCurrency with 0 for null values
      expect(billingService.formatCurrency).toHaveBeenCalledWith(0);

      // Should show 0 facturas pendientes
      expect(screen.getByText('0 facturas pendientes')).toBeInTheDocument();
    });
  });

  describe('A7. Cobranza Rate Chip Colors', () => {
    it('should show success color when cobranza >= 85%', () => {
      const { container } = renderWithTheme(
        <BillingStatsCards stats={mockStats} loading={false} onRefresh={mockOnRefresh} />
      );

      // cobranzaRate = 85%, should have success color
      const chip = container.querySelector('.MuiChip-colorSuccess');
      expect(chip).toBeInTheDocument();
    });

    it('should show warning color when 70% <= cobranza < 85%', () => {
      const warningStats: BillingStats = {
        ...mockStats,
        totalCobrado: 375000 // 75% cobranza
      };

      const { container } = renderWithTheme(
        <BillingStatsCards stats={warningStats} loading={false} onRefresh={mockOnRefresh} />
      );

      const chip = container.querySelector('.MuiChip-colorWarning');
      expect(chip).toBeInTheDocument();
    });

    it('should show error color when cobranza < 70%', () => {
      const errorStats: BillingStats = {
        ...mockStats,
        totalCobrado: 300000 // 60% cobranza
      };

      const { container } = renderWithTheme(
        <BillingStatsCards stats={errorStats} loading={false} onRefresh={mockOnRefresh} />
      );

      const chip = container.querySelector('.MuiChip-colorError');
      expect(chip).toBeInTheDocument();
    });
  });
});
