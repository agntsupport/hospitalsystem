// ABOUTME: Tests comprehensivos para posService
// ABOUTME: Cubre gestión de POS, cuentas de pacientes, ventas rápidas y transacciones

import { posService } from '../posService';
import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('posService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should fetch POS stats', async () => {
      const mockResponse = { success: true, data: { stats: { totalVentas: 50, ingresoTotal: 50000 } } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getStats();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.POS.STATS);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('services', () => {
    it('should fetch services', async () => {
      const mockResponse = { success: true, data: { services: [{ id: 1, nombre: 'Consulta' }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getServices();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.SERVICES.BASE);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch services with filters', async () => {
      const mockResponse = { success: true, data: { services: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.getServices({ search: 'test', activo: true });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('search=test'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('activo=true'));
    });

    it('should search services', async () => {
      const mockResponse = { success: true, data: { services: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.searchServices('consulta', 10);

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('q=consulta'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });
  });

  describe('products', () => {
    it('should fetch products', async () => {
      const mockResponse = { success: true, data: { products: [{ id: 1, nombre: 'Aspirina' }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getProducts();

      expect(mockedApi.get).toHaveBeenCalledWith('/inventory/products');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch products with filters', async () => {
      const mockResponse = { success: true, data: { products: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.getProducts({ search: 'test', categoria: 'medicamento', activo: true, stockMinimo: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('search=test'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('categoria=medicamento'));
    });

    it('should search products', async () => {
      const mockResponse = { success: true, data: { products: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.searchProducts('aspirina', 5);

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('q=aspirina'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
    });
  });

  describe('patient accounts', () => {
    it('should fetch patient accounts', async () => {
      const mockResponse = { success: true, data: { accounts: [{ id: 1, pacienteId: 5 }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getPatientAccounts();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENT_ACCOUNTS.BASE);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with filters', async () => {
      const mockResponse = { success: true, data: { accounts: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.getPatientAccounts({ estado: 'abierta', pacienteId: 5 });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('estado=abierta'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('pacienteId=5'));
    });

    it('should create patient account', async () => {
      const accountData = { pacienteId: 5, tipoAtencion: 'ambulatoria' as const, descripcion: 'Test' };
      const mockResponse = { success: true, data: { account: { id: 1, ...accountData } } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await posService.createPatientAccount(accountData);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ROUTES.PATIENT_ACCOUNTS.BASE, accountData);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch account by ID', async () => {
      const mockResponse = { success: true, data: { account: { id: 1, pacienteId: 5 } } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getPatientAccountById(1);

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENT_ACCOUNTS.BY_ID(1));
      expect(result).toEqual(mockResponse);
    });

    it('should add transaction', async () => {
      const transactionData = { items: [{ tipo: 'servicio' as const, itemId: 1, cantidad: 1, precioUnitario: 500 }] };
      const mockResponse = { success: true, data: { transaction: { id: 1 }, account: {} } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await posService.addTransaction(1, transactionData);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ROUTES.PATIENT_ACCOUNTS.TRANSACTIONS(1), transactionData);
      expect(result).toEqual(mockResponse);
    });

    it('should close account', async () => {
      const closeData = { metodoPago: 'efectivo' as const, montoRecibido: 1000 };
      const mockResponse = { success: true, data: { account: { id: 1, estado: 'cerrada' } } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await posService.closeAccount(1, closeData);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.PATIENT_ACCOUNTS.CLOSE(1), closeData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('quick sales', () => {
    it('should fetch available services', async () => {
      const mockResponse = { success: true, data: { services: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getAvailableServices();

      expect(mockedApi.get).toHaveBeenCalledWith('/pos/services');
      expect(result).toEqual(mockResponse);
    });

    it('should process quick sale', async () => {
      const saleData = { items: [{ tipo: 'servicio' as const, itemId: 1, cantidad: 1, precioUnitario: 500 }], metodoPago: 'efectivo' as const, montoRecibido: 500 };
      const mockResponse = { success: true, data: { sale: { id: 1, total: 500 } } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await posService.processQuickSale(saleData);

      expect(mockedApi.post).toHaveBeenCalledWith('/pos/quick-sale', saleData);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch sales history', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getSalesHistory();

      expect(mockedApi.get).toHaveBeenCalledWith('/pos/sales-history');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch sales history with filters', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.getSalesHistory({ fechaInicio: '2025-01-01', fechaFin: '2025-01-31', cajero: 'test', metodoPago: 'efectivo', limit: 10, offset: 0 });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('fechaInicio=2025-01-01'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('cajero=test'));
    });
  });

  describe('account transactions', () => {
    it('should fetch account transactions', async () => {
      const mockResponse = { success: true, data: { transacciones: [{ id: 1, tipo: 'servicio' }], pagination: { total: 1, totalPages: 1, currentPage: 1, pageSize: 10 } } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getAccountTransactions(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/pos/cuenta/1/transacciones');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with filters', async () => {
      const mockResponse = { success: true, data: { transacciones: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await posService.getAccountTransactions(1, { page: 1, limit: 10, tipo: 'servicio' });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('tipo=servicio'));
    });

    it('should handle empty transactions', async () => {
      const mockResponse = { success: true, data: { transacciones: [], pagination: { total: 0, totalPages: 0, currentPage: 1, pageSize: 10 } } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getAccountTransactions(999);

      expect(result.data?.transacciones).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(posService.getStats()).rejects.toThrow();
    });

    it('should handle missing data', async () => {
      const mockResponse = { success: false, message: 'Not found' };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await posService.getStats();

      expect(result.success).toBe(false);
    });
  });
});
