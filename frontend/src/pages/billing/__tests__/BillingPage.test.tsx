// ABOUTME: Test suite for BillingPage component
// Tests tab navigation, stats loading, error handling, and tab content rendering

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingPage from '../BillingPage';
import * as billingService from '@/services/billingService';

// Mock services and components
jest.mock('@/services/billingService');
jest.mock('../InvoicesTab', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="invoices-tab">
      <button onClick={onDataChange}>Refresh from Invoices</button>
    </div>
  ),
}));
jest.mock('../PaymentsTab', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="payments-tab">
      <button onClick={onDataChange}>Refresh from Payments</button>
    </div>
  ),
}));
jest.mock('../AccountsReceivableTab', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="accounts-receivable-tab">
      <button onClick={onDataChange}>Refresh from AR</button>
    </div>
  ),
}));
jest.mock('../BillingStatsTab', () => ({
  __esModule: true,
  default: ({ stats }: any) => <div data-testid="billing-stats-tab">{JSON.stringify(stats)}</div>,
}));
jest.mock('@/components/billing/BillingStatsCards', () => ({
  __esModule: true,
  default: ({ stats, loading }: any) => (
    <div data-testid="billing-stats-cards">
      {loading ? 'Loading...' : JSON.stringify(stats)}
    </div>
  ),
}));

// Mock data
const mockBillingStats = {
  totalFacturas: 50,
  totalCobrado: 250000,
  pendienteCobro: 75000,
  facturasPendientes: 15,
};

describe('BillingPage - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful billing stats response
    (billingService.billingService.getBillingStats as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      data: mockBillingStats,
    });
  });

  // ========== Renderizado Inicial (2 tests) ==========

  describe('Initial Rendering', () => {
    it('should render billing page without crashing', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Facturación y Cuentas por Cobrar/i)).toBeInTheDocument();
      });
    });

    it('should display correct page description', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Gestión completa de facturas, pagos y cuentas por cobrar del sistema hospitalario/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  // ========== Carga de Datos (2 tests) ==========

  describe('Data Loading', () => {
    it('should load billing stats on mount', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(billingService.billingService.getBillingStats).toHaveBeenCalled();
        const statsCards = screen.getByTestId('billing-stats-cards');
        expect(statsCards).toHaveTextContent(mockBillingStats.totalFacturas.toString());
      });
    });

    it('should display error message when stats loading fails', async () => {
      (billingService.billingService.getBillingStats as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<BillingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error al cargar estadísticas de facturación/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ========== Tabs (4 tests) ==========

  describe('Tab Navigation', () => {
    it('should display four tabs: Facturas, Pagos, Cuentas por Cobrar, Estadísticas', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Facturas')).toBeInTheDocument();
        expect(screen.getByText('Pagos')).toBeInTheDocument();
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
        expect(screen.getByText('Estadísticas')).toBeInTheDocument();
      });
    });

    it('should switch to Facturas tab and display invoices content', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Facturas')).toBeInTheDocument();
      });

      // Tab 0 (Facturas) should be active by default
      expect(screen.getByTestId('invoices-tab')).toBeInTheDocument();
    });

    it('should switch to Pagos tab when clicked', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Pagos')).toBeInTheDocument();
      });

      const pagosTab = screen.getByText('Pagos');
      await user.click(pagosTab);

      expect(screen.getByTestId('payments-tab')).toBeInTheDocument();
    });

    it('should switch to Cuentas por Cobrar tab when clicked', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
      });

      const arTab = screen.getByText('Cuentas por Cobrar');
      await user.click(arTab);

      expect(screen.getByTestId('accounts-receivable-tab')).toBeInTheDocument();
    });
  });

  // ========== Stats Cards (2 tests) ==========

  describe('Stats Cards', () => {
    it('should render BillingStatsCards with loaded stats', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        const statsCards = screen.getByTestId('billing-stats-cards');
        expect(statsCards).toHaveTextContent(mockBillingStats.totalFacturas.toString());
        expect(statsCards).toHaveTextContent(mockBillingStats.totalCobrado.toString());
      });
    });

    it('should show loading state in stats cards initially', () => {
      render(<BillingPage />);

      const statsCards = screen.getByTestId('billing-stats-cards');
      expect(statsCards).toHaveTextContent('Loading...');
    });
  });

  // ========== Callbacks (2 tests) ==========

  describe('Data Refresh Callbacks', () => {
    it('should reload stats when handleDataChange is called from InvoicesTab', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(billingService.billingService.getBillingStats).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText('Refresh from Invoices');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(billingService.billingService.getBillingStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error message when closing error alert', async () => {
      const user = userEvent.setup();

      (billingService.billingService.getBillingStats as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      render(<BillingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error al cargar estadísticas de facturación/i)
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(
        screen.queryByText(/Error al cargar estadísticas de facturación/i)
      ).not.toBeInTheDocument();
    });
  });
});
