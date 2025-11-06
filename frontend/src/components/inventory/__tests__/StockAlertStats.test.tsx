// ABOUTME: Tests P0 para StockAlertStats - Stats display component
// ABOUTME: Cubre loading state y rendering básico (tests passing)

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StockAlertStats from '../StockAlertStats';

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockStats = {
  total: 10,
  critical: 4,
  warning: 6,
  byType: {
    out_of_stock: 2,
    low_stock: 4,
    expiring_soon: 3,
    expired: 1
  },
  trend: 'worsening' as const
};

const mockStatsZero = {
  total: 0,
  critical: 0,
  warning: 0,
  byType: {
    out_of_stock: 0,
    low_stock: 0,
    expiring_soon: 0,
    expired: 0
  },
  trend: 'stable' as const
};

describe('StockAlertStats - P0 Basic Tests', () => {
  describe('A1. Loading State', () => {
    it('should show loading message when loading', () => {
      renderWithTheme(<StockAlertStats stats={mockStats} loading={true} />);

      expect(screen.getByText('Calculando estadísticas...')).toBeInTheDocument();
    });

    it('should not show stats when loading', () => {
      renderWithTheme(<StockAlertStats stats={mockStats} loading={true} />);

      expect(screen.queryByText('Estadísticas de Alertas')).not.toBeInTheDocument();
    });
  });

  describe('A2. Basic Rendering', () => {
    it('should display component title', () => {
      renderWithTheme(<StockAlertStats stats={mockStats} loading={false} />);

      expect(screen.getByText('Estadísticas de Alertas')).toBeInTheDocument();
    });

    it('should display section titles', () => {
      renderWithTheme(<StockAlertStats stats={mockStats} loading={false} />);

      expect(screen.getByText('Distribución por Severidad')).toBeInTheDocument();
      expect(screen.getByText('Alertas por Tipo')).toBeInTheDocument();
      expect(screen.getByText('Estado General del Inventario')).toBeInTheDocument();
    });
  });

  describe('A3. Type Breakdown', () => {
    it('should display all alert type counts', () => {
      renderWithTheme(<StockAlertStats stats={mockStats} loading={false} />);

      expect(screen.getByText(/Sin Stock: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Stock Bajo: 4/)).toBeInTheDocument();
      expect(screen.getByText(/Por Vencer: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Vencidos: 1/)).toBeInTheDocument();
    });

    it('should display zero counts when no alerts', () => {
      renderWithTheme(<StockAlertStats stats={mockStatsZero} loading={false} />);

      expect(screen.getByText(/Sin Stock: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Stock Bajo: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Por Vencer: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Vencidos: 0/)).toBeInTheDocument();
    });
  });

  describe('A4. Health Messages', () => {
    it('should show "Excelente" when no alerts', () => {
      renderWithTheme(<StockAlertStats stats={mockStatsZero} loading={false} />);

      expect(screen.getByText('Excelente')).toBeInTheDocument();
      expect(screen.getByText(/No hay alertas activas/)).toBeInTheDocument();
    });
  });
});
