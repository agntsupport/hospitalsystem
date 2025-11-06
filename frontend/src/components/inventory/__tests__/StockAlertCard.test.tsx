// ABOUTME: Tests P0 para StockAlertCard - Alert display component
// ABOUTME: Cubre empty state y loading state (tests básicos passing)

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StockAlertCard from '../StockAlertCard';

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('StockAlertCard - P0 Basic Tests', () => {
  const mockOnRefresh = jest.fn();
  const mockOnViewProduct = jest.fn();
  const mockOnOrderProduct = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('A1. Empty State', () => {
    it('should show success message when no alerts', () => {
      renderWithTheme(
        <StockAlertCard
          alerts={[]}
          loading={false}
          onRefresh={mockOnRefresh}
          onViewProduct={mockOnViewProduct}
          onOrderProduct={mockOnOrderProduct}
        />
      );

      expect(screen.getByText(/No hay alertas activas/)).toBeInTheDocument();
    });

    it('should render alert type chips with zero counts', () => {
      renderWithTheme(
        <StockAlertCard
          alerts={[]}
          loading={false}
          onRefresh={mockOnRefresh}
          onViewProduct={mockOnViewProduct}
          onOrderProduct={mockOnOrderProduct}
        />
      );

      expect(screen.getByText(/Sin Stock: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Stock Bajo: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Por Vencer: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Vencidos: 0/)).toBeInTheDocument();
    });
  });

  describe('A2. Loading State', () => {
    it('should show loading message when loading', () => {
      renderWithTheme(
        <StockAlertCard
          alerts={[]}
          loading={true}
          onRefresh={mockOnRefresh}
          onViewProduct={mockOnViewProduct}
          onOrderProduct={mockOnOrderProduct}
        />
      );

      expect(screen.getByText('Cargando alertas...')).toBeInTheDocument();
    });

    it('should not show success message when loading', () => {
      renderWithTheme(
        <StockAlertCard
          alerts={[]}
          loading={true}
          onRefresh={mockOnRefresh}
          onViewProduct={mockOnViewProduct}
          onOrderProduct={mockOnOrderProduct}
        />
      );

      expect(screen.queryByText(/No hay alertas activas/)).not.toBeInTheDocument();
    });
  });
});
