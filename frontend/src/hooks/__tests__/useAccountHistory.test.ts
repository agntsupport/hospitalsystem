import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccountHistory } from '../useAccountHistory';
import { posService } from '@/services/posService';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('@/services/posService');
jest.mock('react-toastify');

const mockedPosService = posService as jest.Mocked<typeof posService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('useAccountHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state values', () => {
      const { result } = renderHook(() => useAccountHistory());

      expect(result.current.closedAccounts).toEqual([]);
      expect(result.current.quickSales).toEqual([]);
      expect(result.current.expandedAccount).toBeNull();
      expect(result.current.expandedSale).toBeNull();
      expect(result.current.selectedAccount).toBeNull();
      expect(result.current.selectedSale).toBeNull();
      expect(result.current.accountDetailsOpen).toBe(false);
      expect(result.current.saleDetailsOpen).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.filters).toEqual({});
      expect(result.current.showFilters).toBe(false);
      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.historyTab).toBe(0);
    });
  });

  describe('loadClosedAccounts', () => {
    it('should load closed accounts successfully', async () => {
      const mockAccounts = [
        { id: 1, pacienteId: 1, estado: 'cerrada' as const, totalCuenta: 1000 },
        { id: 2, pacienteId: 2, estado: 'cerrada' as const, totalCuenta: 2000 }
      ];

      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: mockAccounts },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        expect(result.current.closedAccounts).toEqual(mockAccounts);
        expect(result.current.loading).toBe(false);
      });

      expect(mockedPosService.getPatientAccounts).toHaveBeenCalledWith({
        estado: 'cerrada'
      });
    });

    it('should calculate total pages correctly based on accounts count', async () => {
      const mockAccounts = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        pacienteId: i + 1,
        estado: 'cerrada' as const,
        totalCuenta: 1000
      }));

      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: mockAccounts },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        // 25 accounts with 10 per page = 3 pages
        expect(result.current.totalPages).toBe(3);
      });
    });

    it('should handle empty accounts response', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        expect(result.current.closedAccounts).toEqual([]);
        expect(result.current.totalPages).toBe(0);
      });
    });

    it('should handle API error when loading closed accounts', async () => {
      const error = new Error('API Error');
      mockedPosService.getPatientAccounts.mockRejectedValue(error);

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(mockedToast.error).toHaveBeenCalledWith('Error al cargar cuentas cerradas');
      });
    });

    it('should handle missing data in response', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: null,
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        expect(result.current.closedAccounts).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading state correctly during load', async () => {
      mockedPosService.getPatientAccounts.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { accounts: [] },
          message: 'Success'
        }), 100))
      );

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.loadClosedAccounts();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('loadQuickSales', () => {
    it('should load quick sales successfully', async () => {
      const mockSales = [
        {
          id: 1,
          numeroVenta: 'V001',
          total: 500,
          metodoPago: 'efectivo',
          montoRecibido: 500,
          cambio: 0,
          cajero: { id: 1, username: 'cajero1' },
          fecha: '2025-10-31',
          items: []
        }
      ];

      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: {
          items: mockSales,
          pagination: { total: 1, page: 1, limit: 10 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        expect(result.current.quickSales).toEqual(mockSales);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should apply pagination parameters correctly', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      // Change to page 3
      act(() => {
        result.current.setPage(3);
      });

      await waitFor(() => {
        expect(mockedPosService.getSalesHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 20 // (page 3 - 1) * 10
          })
        );
      });
    });

    it('should apply date filters correctly', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      act(() => {
        result.current.setFilters({
          fechaInicio: startDate,
          fechaFin: endDate
        });
      });

      await waitFor(() => {
        expect(mockedPosService.getSalesHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            fechaInicio: '2025-10-01',
            fechaFin: '2025-10-31'
          })
        );
      });
    });

    it('should apply pacienteNombre filter as cajero parameter', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setFilters({ pacienteNombre: 'Juan' });
      });

      await waitFor(() => {
        expect(mockedPosService.getSalesHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            cajero: 'Juan'
          })
        );
      });
    });

    it('should apply tipoAtencion filter as metodoPago parameter', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setFilters({ tipoAtencion: 'efectivo' });
      });

      await waitFor(() => {
        expect(mockedPosService.getSalesHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            metodoPago: 'efectivo'
          })
        );
      });
    });

    it('should handle API error when loading quick sales', async () => {
      const error = new Error('Network Error');
      mockedPosService.getSalesHistory.mockRejectedValue(error);

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(mockedToast.error).toHaveBeenCalledWith('Error al cargar ventas rápidas');
      });
    });

    it('should calculate total pages from pagination data', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 35, page: 1, limit: 10 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        // 35 items / 10 per page = 4 pages
        expect(result.current.totalPages).toBe(4);
      });
    });
  });

  describe('handleExpandAccount', () => {
    it('should expand account when not currently expanded', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.handleExpandAccount(1);
      });

      expect(result.current.expandedAccount).toBe(1);
    });

    it('should collapse account when already expanded', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.handleExpandAccount(1);
      });

      expect(result.current.expandedAccount).toBe(1);

      act(() => {
        result.current.handleExpandAccount(1);
      });

      expect(result.current.expandedAccount).toBeNull();
    });

    it('should switch from one account to another', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.handleExpandAccount(1);
      });

      expect(result.current.expandedAccount).toBe(1);

      act(() => {
        result.current.handleExpandAccount(2);
      });

      expect(result.current.expandedAccount).toBe(2);
    });
  });

  describe('handleViewDetails', () => {
    it('should load account details and open dialog', async () => {
      const mockAccount = {
        id: 1,
        pacienteId: 1,
        estado: 'cerrada' as const,
        totalCuenta: 1000,
        transacciones: []
      };

      mockedPosService.getPatientAccountById.mockResolvedValue({
        success: true,
        data: { account: mockAccount },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.handleViewDetails(mockAccount);
      });

      await waitFor(() => {
        expect(result.current.selectedAccount).toEqual(mockAccount);
        expect(result.current.accountDetailsOpen).toBe(true);
      });

      expect(mockedPosService.getPatientAccountById).toHaveBeenCalledWith(1);
    });

    it('should handle error when loading account details', async () => {
      const mockAccount = {
        id: 1,
        pacienteId: 1,
        estado: 'cerrada' as const,
        totalCuenta: 1000,
        transacciones: []
      };

      const error = new Error('Failed to load');
      mockedPosService.getPatientAccountById.mockRejectedValue(error);

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.handleViewDetails(mockAccount);
      });

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Error al cargar detalles de la cuenta');
      });
    });

    it('should not open dialog if API returns no data', async () => {
      const mockAccount = {
        id: 1,
        pacienteId: 1,
        estado: 'cerrada' as const,
        totalCuenta: 1000,
        transacciones: []
      };

      mockedPosService.getPatientAccountById.mockResolvedValue({
        success: false,
        data: null,
        message: 'Not found'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.handleViewDetails(mockAccount);
      });

      await waitFor(() => {
        expect(result.current.accountDetailsOpen).toBe(false);
        expect(result.current.selectedAccount).toBeNull();
      });
    });
  });

  describe('handleExpandSale', () => {
    it('should expand sale when not currently expanded', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.handleExpandSale(1);
      });

      expect(result.current.expandedSale).toBe(1);
    });

    it('should collapse sale when already expanded', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.handleExpandSale(1);
      });

      act(() => {
        result.current.handleExpandSale(1);
      });

      expect(result.current.expandedSale).toBeNull();
    });
  });

  describe('handleViewSaleDetails', () => {
    it('should set selected sale and open dialog', () => {
      const { result } = renderHook(() => useAccountHistory());

      const mockSale = {
        id: 1,
        numeroVenta: 'V001',
        total: 500,
        metodoPago: 'efectivo',
        montoRecibido: 500,
        cambio: 0,
        cajero: { id: 1, username: 'cajero1' },
        fecha: '2025-10-31',
        items: []
      };

      act(() => {
        result.current.handleViewSaleDetails(mockSale);
      });

      expect(result.current.selectedSale).toEqual(mockSale);
      expect(result.current.saleDetailsOpen).toBe(true);
    });
  });

  describe('handleApplyFilters', () => {
    it('should reset page to 1 and reload closed accounts when on tab 0', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setPage(3);
        result.current.setHistoryTab(0);
      });

      await act(async () => {
        await result.current.handleApplyFilters();
      });

      await waitFor(() => {
        expect(result.current.page).toBe(1);
        expect(result.current.showFilters).toBe(false);
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalled();
      });
    });

    it('should reset page to 1 and reload quick sales when on tab 1', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setPage(3);
        result.current.setHistoryTab(1);
      });

      await act(async () => {
        await result.current.handleApplyFilters();
      });

      await waitFor(() => {
        expect(result.current.page).toBe(1);
        expect(result.current.showFilters).toBe(false);
        expect(mockedPosService.getSalesHistory).toHaveBeenCalled();
      });
    });

    it('should close filters panel after applying', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setShowFilters(true);
      });

      expect(result.current.showFilters).toBe(true);

      await act(async () => {
        await result.current.handleApplyFilters();
      });

      await waitFor(() => {
        expect(result.current.showFilters).toBe(false);
      });
    });
  });

  describe('handleClearFilters', () => {
    it('should reset all filter states', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setFilters({
          fechaInicio: new Date(),
          pacienteNombre: 'Juan'
        });
        result.current.setSearchTerm('test');
        result.current.setPage(5);
      });

      act(() => {
        result.current.handleClearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.searchTerm).toBe('');
      expect(result.current.page).toBe(1);
    });
  });

  describe('handleExportData', () => {
    it('should show success toast for closed accounts export', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setHistoryTab(0);
      });

      // Simulate having closed accounts
      act(() => {
        result.current.handleExportData();
      });

      expect(mockedToast.success).toHaveBeenCalledWith(
        expect.stringContaining('cuentas cerradas')
      );
    });

    it('should show success toast for quick sales export', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setHistoryTab(1);
      });

      act(() => {
        result.current.handleExportData();
      });

      expect(mockedToast.success).toHaveBeenCalledWith(
        expect.stringContaining('ventas rápidas')
      );
    });

    it('should include correct count in export message', () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: {
          accounts: [
            { id: 1, pacienteId: 1, estado: 'cerrada' as const, totalCuenta: 1000, transacciones: [] },
            { id: 2, pacienteId: 2, estado: 'cerrada' as const, totalCuenta: 2000, transacciones: [] }
          ]
        },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setHistoryTab(0);
      });

      waitFor(() => {
        act(() => {
          result.current.handleExportData();
        });

        expect(mockedToast.success).toHaveBeenCalledWith('Exportando 2 cuentas cerradas');
      });
    });
  });

  describe('useEffect - Auto Load on Tab Change', () => {
    it('should load closed accounts when historyTab is 0', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      renderHook(() => useAccountHistory());

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalledWith({
          estado: 'cerrada'
        });
      });
    });

    it('should load quick sales when historyTab changes to 1', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalled();
      });

      act(() => {
        result.current.setHistoryTab(1);
      });

      await waitFor(() => {
        expect(mockedPosService.getSalesHistory).toHaveBeenCalled();
      });
    });

    it('should reload data when page changes', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalledTimes(2);
      });
    });

    it('should reload data when filters change', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: [] },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setFilters({ pacienteNombre: 'Juan' });
      });

      await waitFor(() => {
        expect(mockedPosService.getPatientAccounts).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined accounts in response', async () => {
      mockedPosService.getPatientAccounts.mockResolvedValue({
        success: true,
        data: { accounts: undefined as any },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadClosedAccounts();
      });

      await waitFor(() => {
        expect(result.current.closedAccounts).toEqual([]);
      });
    });

    it('should handle undefined items in sales response', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: undefined as any, pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        expect(result.current.quickSales).toEqual([]);
      });
    });

    it('should handle missing pagination in sales response', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: undefined as any },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(0);
      });
    });

    it('should handle zero total in pagination', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      await act(async () => {
        await result.current.loadQuickSales();
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(0);
      });
    });

    it('should handle date filter with invalid dates gracefully', async () => {
      mockedPosService.getSalesHistory.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { total: 0 } },
        message: 'Success'
      });

      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setFilters({
          fechaInicio: new Date('invalid'),
          fechaFin: new Date('invalid')
        });
      });

      await waitFor(() => {
        // Should not crash, but dates will be Invalid Date
        expect(mockedPosService.getSalesHistory).toHaveBeenCalled();
      });
    });
  });

  describe('Dialog State Management', () => {
    it('should open and close account details dialog', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setAccountDetailsOpen(true);
      });

      expect(result.current.accountDetailsOpen).toBe(true);

      act(() => {
        result.current.setAccountDetailsOpen(false);
      });

      expect(result.current.accountDetailsOpen).toBe(false);
    });

    it('should open and close sale details dialog', () => {
      const { result } = renderHook(() => useAccountHistory());

      act(() => {
        result.current.setSaleDetailsOpen(true);
      });

      expect(result.current.saleDetailsOpen).toBe(true);

      act(() => {
        result.current.setSaleDetailsOpen(false);
      });

      expect(result.current.saleDetailsOpen).toBe(false);
    });

    it('should toggle filters visibility', () => {
      const { result } = renderHook(() => useAccountHistory());

      expect(result.current.showFilters).toBe(false);

      act(() => {
        result.current.setShowFilters(true);
      });

      expect(result.current.showFilters).toBe(true);

      act(() => {
        result.current.setShowFilters(false);
      });

      expect(result.current.showFilters).toBe(false);
    });
  });
});
