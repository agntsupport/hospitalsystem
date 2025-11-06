// ABOUTME: Tests P0 para POSStatsCards - Display component con 7 stat cards
// ABOUTME: Cubre rendering, formatting, y manejo de valores null/undefined

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import POSStatsCards from '../POSStatsCards';
import { POSStats } from '@/types/pos.types';

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockStats: POSStats = {
  cuentasAbiertas: 5,
  totalVentasHoy: 15000.50,
  totalVentasMes: 450000.75,
  serviciosVendidos: 25,
  productosVendidos: 120,
  saldosAFavor: 5000.00,
  saldosPorCobrar: 3000.00,
};

describe('POSStatsCards - P0 Critical Tests', () => {
  describe('A1. Basic Rendering', () => {
    it('should render all 7 stat cards', () => {
      renderWithTheme(<POSStatsCards stats={mockStats} />);

      expect(screen.getByText('Cuentas Abiertas')).toBeInTheDocument();
      expect(screen.getByText('Ventas de Hoy')).toBeInTheDocument();
      expect(screen.getByText('Ventas del Mes')).toBeInTheDocument();
      expect(screen.getByText('Servicios Vendidos')).toBeInTheDocument();
      expect(screen.getByText('Productos Vendidos')).toBeInTheDocument();
      expect(screen.getByText('Saldos a Favor')).toBeInTheDocument();
      expect(screen.getByText('Por Cobrar')).toBeInTheDocument();
    });

    it('should display formatted numbers', () => {
      renderWithTheme(<POSStatsCards stats={mockStats} />);

      // Numbers should be formatted with locale
      expect(screen.getByText('5')).toBeInTheDocument(); // cuentasAbiertas
      expect(screen.getByText('25')).toBeInTheDocument(); // serviciosVendidos
      expect(screen.getByText('120')).toBeInTheDocument(); // productosVendidos
    });

    it('should display formatted currency values', () => {
      renderWithTheme(<POSStatsCards stats={mockStats} />);

      // Currency values should be formatted as MXN
      expect(screen.getByText(/\$15,000\.50/)).toBeInTheDocument(); // totalVentasHoy
      expect(screen.getByText(/\$450,000\.75/)).toBeInTheDocument(); // totalVentasMes
      expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument(); // saldosAFavor
      expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument(); // saldosPorCobrar
    });

    it('should render descriptions for each card', () => {
      renderWithTheme(<POSStatsCards stats={mockStats} />);

      expect(screen.getByText('Cuentas activas')).toBeInTheDocument();
      expect(screen.getByText('Ingresos del día')).toBeInTheDocument();
      expect(screen.getByText('Ingresos mensuales')).toBeInTheDocument();
      expect(screen.getByText('Servicios facturados')).toBeInTheDocument();
      expect(screen.getByText('Medicamentos/insumos')).toBeInTheDocument();
      expect(screen.getByText('Crédito de pacientes')).toBeInTheDocument();
      expect(screen.getByText('Deuda de pacientes')).toBeInTheDocument();
    });

    it('should render icons for each card', () => {
      const { container } = renderWithTheme(<POSStatsCards stats={mockStats} />);

      // Should have 7 icons (one per card)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('A2. Null/Undefined Handling', () => {
    it('should handle undefined stats gracefully', () => {
      const undefinedStats = {
        cuentasAbiertas: undefined,
        totalVentasHoy: undefined,
        totalVentasMes: undefined,
        serviciosVendidos: undefined,
        productosVendidos: undefined,
        saldosAFavor: undefined,
        saldosPorCobrar: undefined,
      } as POSStats;

      renderWithTheme(<POSStatsCards stats={undefinedStats} />);

      // Should display 0 for all undefined values (multiple cards will show 0)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);

      // Should display $0.00 for currency values (4 currency cards)
      const currencyZeros = screen.getAllByText(/\$0\.00/);
      expect(currencyZeros.length).toBe(4); // totalVentasHoy, totalVentasMes, saldosAFavor, saldosPorCobrar
    });

    it('should handle null stats gracefully', () => {
      const nullStats = {
        cuentasAbiertas: null,
        totalVentasHoy: null,
        totalVentasMes: null,
        serviciosVendidos: null,
        productosVendidos: null,
        saldosAFavor: null,
        saldosPorCobrar: null,
      } as unknown as POSStats;

      renderWithTheme(<POSStatsCards stats={nullStats} />);

      // Should display 0 for all null values (multiple cards will show 0)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);

      // Should display $0.00 for currency values (4 currency cards)
      const currencyZeros = screen.getAllByText(/\$0\.00/);
      expect(currencyZeros.length).toBe(4);
    });

    it('should handle zero values correctly', () => {
      const zeroStats: POSStats = {
        cuentasAbiertas: 0,
        totalVentasHoy: 0,
        totalVentasMes: 0,
        serviciosVendidos: 0,
        productosVendidos: 0,
        saldosAFavor: 0,
        saldosPorCobrar: 0,
      };

      renderWithTheme(<POSStatsCards stats={zeroStats} />);

      // Should display 0 explicitly (multiple cards will show 0)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);

      // Should display $0.00 for currency values (4 currency cards)
      const currencyZeros = screen.getAllByText(/\$0\.00/);
      expect(currencyZeros.length).toBe(4);
    });
  });

  describe('A3. Large Numbers', () => {
    it('should format large currency values correctly', () => {
      const largeStats: POSStats = {
        cuentasAbiertas: 1000,
        totalVentasHoy: 1000000.99,
        totalVentasMes: 50000000.50,
        serviciosVendidos: 5000,
        productosVendidos: 10000,
        saldosAFavor: 500000.00,
        saldosPorCobrar: 250000.00,
      };

      renderWithTheme(<POSStatsCards stats={largeStats} />);

      // Large numbers should be formatted with thousand separators
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
      expect(screen.getByText(/\$1,000,000\.99/)).toBeInTheDocument();
    });
  });
});
