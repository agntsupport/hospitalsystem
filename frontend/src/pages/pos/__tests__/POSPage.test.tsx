// ABOUTME: Test suite for POSPage component - covers rendering, data loading, account management, tabs, and user interactions
// Tests new account creation, transaction handling, account closure, and tabs navigation

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import POSPage from '../POSPage';
import * as posService from '@/services/posService';

// Mock services and components
jest.mock('@/services/posService');
jest.mock('@/components/pos/POSStatsCards', () => ({
  __esModule: true,
  default: ({ stats }: any) => <div data-testid="pos-stats">{JSON.stringify(stats)}</div>,
}));
jest.mock('@/components/pos/NewAccountDialog', () => ({
  __esModule: true,
  default: ({ open, onAccountCreated }: any) => (
    open ? <div data-testid="new-account-dialog" onClick={onAccountCreated}>New Account Dialog</div> : null
  ),
}));
jest.mock('@/components/pos/OpenAccountsList', () => ({
  __esModule: true,
  default: ({ accounts, onAddTransaction, onCloseAccount, onViewAccount }: any) => (
    <div data-testid="open-accounts-list">
      {accounts.map((acc: any) => (
        <div key={acc.id}>
          <span>{acc.paciente.nombre}</span>
          <button onClick={() => onAddTransaction(acc)}>Add Transaction</button>
          <button onClick={() => onCloseAccount(acc)}>Close</button>
          <button onClick={() => onViewAccount(acc)}>View</button>
        </div>
      ))}
    </div>
  ),
}));
jest.mock('@/components/pos/POSTransactionDialog', () => ({
  __esModule: true,
  default: ({ open, account, onTransactionAdded }: any) => (
    open ? <div data-testid="transaction-dialog" onClick={onTransactionAdded}>Transaction for {account?.paciente.nombre}</div> : null
  ),
}));
jest.mock('@/components/pos/HistoryTab', () => ({
  __esModule: true,
  default: () => <div data-testid="history-tab">History Tab Content</div>,
}));
jest.mock('@/components/pos/QuickSalesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="quick-sales-tab">Quick Sales Tab Content</div>,
}));
jest.mock('@/components/pos/AccountClosureDialog', () => ({
  __esModule: true,
  default: ({ open, account, onSuccess }: any) => (
    open ? <div data-testid="closure-dialog" onClick={onSuccess}>Close {account?.paciente.nombre}</div> : null
  ),
}));
jest.mock('@/components/pos/AccountDetailDialog', () => ({
  __esModule: true,
  default: ({ open, account }: any) => (
    open ? <div data-testid="detail-dialog">Details for {account?.paciente.nombre}</div> : null
  ),
}));

// Mock data
const mockStats = {
  totalCuentasAbiertas: 10,
  totalRecaudadoHoy: 15000,
  promedioTicket: 1500,
  totalTransaccionesHoy: 25,
};

const mockOpenAccounts = [
  {
    id: 1,
    paciente: { id: 1, nombre: 'Juan Pérez', apellidoPaterno: 'García' },
    anticipo: 500,
    estado: 'abierta',
    transacciones: [],
  },
  {
    id: 2,
    paciente: { id: 2, nombre: 'María López', apellidoPaterno: 'Martínez' },
    anticipo: 1000,
    estado: 'abierta',
    transacciones: [],
  },
];

describe('POSPage - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful service responses
    (posService.posService.getStats as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      data: { stats: mockStats },
    });

    (posService.posService.getPatientAccounts as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      data: { accounts: mockOpenAccounts },
    });
  });

  // ========== Renderizado Inicial (2 tests) ==========

  describe('Initial Rendering', () => {
    it('should render POS page without crashing', async () => {
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Punto de Venta')).toBeInTheDocument();
      });
    });

    it('should display "Nueva Cuenta" button', async () => {
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Cuenta')).toBeInTheDocument();
      });
    });
  });

  // ========== Carga de Datos (3 tests) ==========

  describe('Data Loading', () => {
    it('should load stats on mount', async () => {
      render(<POSPage />);

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalled();
        const statsElement = screen.getByTestId('pos-stats');
        expect(statsElement).toBeInTheDocument();
      });
    });

    it('should load open accounts on mount', async () => {
      render(<POSPage />);

      await waitFor(() => {
        expect(posService.posService.getPatientAccounts).toHaveBeenCalledWith({ estado: 'abierta' });
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María López')).toBeInTheDocument();
      });
    });

    it('should display error message when data loading fails', async () => {
      (posService.posService.getStats as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  // ========== Botón Nueva Cuenta (2 tests) ==========

  describe('New Account Button', () => {
    it('should open new account dialog when clicking "Nueva Cuenta"', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Cuenta')).toBeInTheDocument();
      });

      const newAccountButton = screen.getByText('Nueva Cuenta');
      await user.click(newAccountButton);

      expect(screen.getByTestId('new-account-dialog')).toBeInTheDocument();
    });

    it('should reload data after creating new account', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalledTimes(1);
      });

      const newAccountButton = screen.getByText('Nueva Cuenta');
      await user.click(newAccountButton);

      const dialog = screen.getByTestId('new-account-dialog');
      await user.click(dialog); // Simula crear cuenta

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalledTimes(2);
        expect(posService.posService.getPatientAccounts).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ========== Tabs (3 tests) ==========

  describe('Tabs Navigation', () => {
    it('should display three tabs: Cuentas Abiertas, Historial, Ventas Rápidas', async () => {
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Cuentas Abiertas')).toBeInTheDocument();
        expect(screen.getByText('Historial')).toBeInTheDocument();
        expect(screen.getByText('Ventas Rápidas')).toBeInTheDocument();
      });
    });

    it('should switch to History tab when clicked', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Historial')).toBeInTheDocument();
      });

      const historyTab = screen.getByText('Historial');
      await user.click(historyTab);

      expect(screen.getByTestId('history-tab')).toBeInTheDocument();
    });

    it('should switch to Quick Sales tab when clicked', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Ventas Rápidas')).toBeInTheDocument();
      });

      const quickSalesTab = screen.getByText('Ventas Rápidas');
      await user.click(quickSalesTab);

      expect(screen.getByTestId('quick-sales-tab')).toBeInTheDocument();
    });
  });

  // ========== Acciones de Cuenta (3 tests) ==========

  describe('Account Actions', () => {
    it('should open transaction dialog when adding transaction to account', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const addTransactionButton = screen.getAllByText('Add Transaction')[0];
      await user.click(addTransactionButton);

      expect(screen.getByTestId('transaction-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Transaction for Juan Pérez/i)).toBeInTheDocument();
    });

    it('should open closure dialog when closing account', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('María López')).toBeInTheDocument();
      });

      const closeButton = screen.getAllByText('Close')[1];
      await user.click(closeButton);

      expect(screen.getByTestId('closure-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Close María López/i)).toBeInTheDocument();
    });

    it('should open detail dialog when viewing account', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText('View')[0];
      await user.click(viewButton);

      expect(screen.getByTestId('detail-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Details for Juan Pérez/i)).toBeInTheDocument();
    });
  });

  // ========== Callbacks y Refresh (2 tests) ==========

  describe('Callbacks and Data Refresh', () => {
    it('should reload stats after adding transaction', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalledTimes(1);
      });

      const addTransactionButton = screen.getAllByText('Add Transaction')[0];
      await user.click(addTransactionButton);

      const transactionDialog = screen.getByTestId('transaction-dialog');
      await user.click(transactionDialog); // Simula agregar transacción

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should reload data after closing account', async () => {
      const user = userEvent.setup();
      render(<POSPage />);

      await waitFor(() => {
        expect(posService.posService.getPatientAccounts).toHaveBeenCalledTimes(1);
      });

      const closeButton = screen.getAllByText('Close')[0];
      await user.click(closeButton);

      const closureDialog = screen.getByTestId('closure-dialog');
      await user.click(closureDialog); // Simula cerrar cuenta

      await waitFor(() => {
        expect(posService.posService.getStats).toHaveBeenCalledTimes(2);
        expect(posService.posService.getPatientAccounts).toHaveBeenCalledTimes(2);
      });
    });
  });
});
