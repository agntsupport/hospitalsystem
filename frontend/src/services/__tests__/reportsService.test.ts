// ABOUTME: Tests comprehensivos para reportsService
// ABOUTME: Cubre reportes financieros, operativos y utilidades

import reportsService from '../reportsService';
import { api } from '@/utils/api';

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('reportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFinancialSummary', () => {
    it('should fetch financial summary', async () => {
      const mockResponse = {
        success: true,
        data: { ingresos: { total: 50000 }, egresos: { total: 35000 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getFinancialSummary();

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/reports/financial'));
      expect(result.success).toBe(true);
      expect(result.data?.totalIngresos).toBe(50000);
    });

    it('should handle filters', async () => {
      const mockResponse = { success: true, data: { ingresos: { total: 0 } } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await reportsService.getFinancialSummary({ fechaInicio: '2025-01-01', fechaFin: '2025-01-31', periodo: 'mes' });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('fechaInicio=2025-01-01'));
    });
  });

  describe('getRevenueByPeriod', () => {
    it('should fetch revenue by period', async () => {
      const mockResponse = {
        success: true,
        data: { ingresos: { total: 50000, facturasPagadas: { cantidad: 10 }, ventasRapidas: { cantidad: 5 } } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getRevenueByPeriod();

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
    });
  });

  describe('getRevenueByService', () => {
    it('should fetch revenue by service', async () => {
      const mockResponse = {
        success: true,
        data: { ingresos: { ventasRapidas: { monto: 10000, cantidad: 5 }, facturasPagadas: { monto: 20000, cantidad: 10 } } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getRevenueByService();

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBeGreaterThan(0);
    });
  });

  describe('getRevenueByPaymentMethod', () => {
    it('should fetch revenue by payment method', async () => {
      const mockResponse = {
        success: true,
        data: { ingresos: { total: 50000 }, distribucionMetodosPago: { efectivo: { monto: 30000, cantidad: 10 } } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getRevenueByPaymentMethod();

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
    });
  });

  describe('getAccountsReceivable', () => {
    it('should fetch accounts receivable', async () => {
      const mockResponse = {
        success: true,
        data: { cuentasPorCobrar: { monto: 15000, cantidad: 5 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getAccountsReceivable();

      expect(result.success).toBe(true);
      expect(result.data?.totalPendiente).toBe(15000);
    });
  });

  describe('getRoomOccupancy', () => {
    it('should fetch room occupancy', async () => {
      const mockResponse = {
        success: true,
        data: { ocupacion: { ocupadas: 10 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getRoomOccupancy();

      expect(result.success).toBe(true);
      expect(result.data?.ocupadas).toBe(10);
    });
  });

  describe('getEmployeeProductivity', () => {
    it('should fetch employee productivity', async () => {
      const mockResponse = {
        success: true,
        data: { atencionPacientes: { pacientesAtendidos: 100 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getEmployeeProductivity();

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
    });
  });

  describe('getInventoryTurnover', () => {
    it('should fetch inventory turnover', async () => {
      const mockResponse = {
        success: true,
        data: { inventario: { movimientos: 50 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getInventoryTurnover();

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
    });
  });

  describe('getPatientFlow', () => {
    it('should fetch patient flow', async () => {
      const mockResponse = {
        success: true,
        data: { atencionPacientes: { admisionesHospitalarias: 20, pacientesAtendidos: 100 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getPatientFlow();

      expect(result.success).toBe(true);
      expect(result.data?.nuevosIngresos).toBe(20);
    });
  });

  describe('getExecutiveSummary', () => {
    it('should fetch executive summary', async () => {
      const mockResponse = { data: { summary: 'test' } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getExecutiveSummary();

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/reports/managerial/executive-summary'));
      expect(result.success).toBe(true);
    });
  });

  describe('getKPIs', () => {
    it('should fetch KPIs', async () => {
      const mockResponse = { data: { items: [{ nombre: 'KPI1', valor: 100 }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportsService.getKPIs();

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/reports/managerial/kpis'));
      expect(result.success).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should format currency', () => {
      expect(reportsService.formatCurrency(1500.50)).toContain('1,500.50');
      expect(reportsService.formatCurrency(0)).toContain('0.00');
      expect(reportsService.formatCurrency(null)).toBe('$0.00');
      expect(reportsService.formatCurrency(undefined)).toBe('$0.00');
    });

    it('should format percentage', () => {
      expect(reportsService.formatPercentage(50)).toContain('50');
      expect(reportsService.formatPercentage(12.5)).toContain('12.5');
    });

    it('should format number', () => {
      expect(reportsService.formatNumber(1000000)).toContain('1,000,000');
    });

    it('should format date', () => {
      const formatted = reportsService.formatDate('2025-01-15T10:00:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should get trend color', () => {
      expect(reportsService.getTrendColor('up')).toBe('#2e7d32');
      expect(reportsService.getTrendColor('down')).toBe('#d32f2f');
      expect(reportsService.getTrendColor('stable')).toBe('#ed6c02');
    });

    it('should validate filters', () => {
      const valid = reportsService.validateFilters({ fechaInicio: '2025-01-01', fechaFin: '2025-01-31' });
      expect(valid.valid).toBe(true);

      const invalid = reportsService.validateFilters({ fechaInicio: '2025-02-01', fechaFin: '2025-01-01' });
      expect(invalid.valid).toBe(false);
    });
  });
});
