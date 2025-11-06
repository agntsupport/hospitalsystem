// ABOUTME: Tests comprehensivos para billingService
// ABOUTME: Cubre todos los métodos del servicio de facturación incluyendo validaciones y utilidades

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import billingService from '../billingService';
import { api } from '@/utils/api';
import {
  Invoice,
  Payment,
  InvoiceFilters,
  BillingStats,
  CreateInvoiceRequest,
  CreatePaymentRequest
} from '@/types/billing.types';

const mockedApi = api as jest.Mocked<typeof api>;

describe('billingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should fetch invoices without filters', async () => {
      const mockResponse = {
        data: {
          invoices: [{ id: 1, folio: 'INV-001', total: 1000 }],
          total: 1
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getInvoices();

      expect(mockedApi.get).toHaveBeenCalledWith('/billing/invoices?');
      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual(mockResponse.data.invoices);
    });

    it('should fetch invoices with all filters', async () => {
      const filters: InvoiceFilters = {
        estado: 'paid',
        fechaInicio: '2025-01-01',
        fechaFin: '2025-01-31',
        pacienteId: 5,
        folio: 'INV-001',
        numeroExpediente: 'EXP-123',
        montoMinimo: 100,
        montoMaximo: 1000,
        soloVencidas: true,
        limit: 20,
        offset: 0
      };

      const mockResponse = {
        data: { invoices: [], total: 0 }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await billingService.getInvoices(filters);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/billing/invoices?')
      );
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('estado=paid')
      );
    });

    it('should handle errors gracefully', async () => {
      mockedApi.get.mockRejectedValue({ message: 'Network error' });

      const result = await billingService.getInvoices();

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('getInvoiceById', () => {
    it('should fetch invoice by ID', async () => {
      const mockInvoice = {
        id: 1,
        folio: 'INV-001',
        total: 1000,
        saldoPendiente: 0,
        estado: 'paid' as const
      };

      const mockResponse = { data: mockInvoice };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getInvoiceById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/billing/invoices/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue({ message: 'Invoice not found', error: '404' });

      const result = await billingService.getInvoiceById(999);

      expect(result.success).toBe(false);
    });
  });

  describe('createInvoice', () => {
    it('should create a new invoice', async () => {
      const invoiceData: CreateInvoiceRequest = {
        cuentaPacienteId: 5,
        fechaVencimiento: '2025-12-31',
        descuentoGlobal: 10
      };

      const mockResponse = {
        data: { id: 1, ...invoiceData }
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await billingService.createInvoice(invoiceData);

      expect(mockedApi.post).toHaveBeenCalledWith('/billing/invoices', invoiceData);
      expect(result.success).toBe(true);
    });

    it('should handle validation errors', async () => {
      const invalidData: CreateInvoiceRequest = {
        cuentaPacienteId: 0
      };

      mockedApi.post.mockRejectedValue({ message: 'Validation failed' });

      const result = await billingService.createInvoice(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('getInvoicePayments', () => {
    it('should fetch invoice payments', async () => {
      const mockPayments = [
        { id: 1, monto: 500, metodoPago: 'cash' as const }
      ];

      const mockResponse = {
        data: {
          payments: mockPayments,
          total: 1
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getInvoicePayments(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/billing/invoices/1/payments');
      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual(mockPayments);
    });

    it('should return empty array for invoice with no payments', async () => {
      const mockResponse = {
        data: { payments: [], total: 0 }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getInvoicePayments(5);

      expect(result.data?.items).toEqual([]);
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      const paymentData: CreatePaymentRequest = {
        facturaId: 1,
        monto: 500,
        metodoPago: 'cash',
        fechaPago: '2025-01-15'
      };

      const mockResponse = {
        data: {
          payment: { id: 1, ...paymentData },
          invoice: { id: 1, saldoPendiente: 500 }
        }
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await billingService.createPayment(paymentData);

      expect(mockedApi.post).toHaveBeenCalledWith('/billing/invoices/1/payments', paymentData);
      expect(result.success).toBe(true);
    });

    it('should handle payment errors', async () => {
      const paymentData: CreatePaymentRequest = {
        facturaId: 1,
        monto: -500,
        metodoPago: 'cash'
      };

      mockedApi.post.mockRejectedValue({ message: 'Invalid amount' });

      const result = await billingService.createPayment(paymentData);

      expect(result.success).toBe(false);
    });
  });

  describe('getBillingStats', () => {
    it('should fetch billing statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          resumen: {
            totalFacturado: 50000,
            facturasPagadas: 40000,
            facturasPendientes: 10000
          },
          distribucion: {}
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getBillingStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/billing/stats');
      expect(result.success).toBe(true);
      expect(result.data?.totalFacturado).toBe(50000);
    });

    it('should handle missing data', async () => {
      const mockResponse = {
        success: true,
        data: null
      };

      mockedApi.get.mockRejectedValue({ message: 'No data' });

      const result = await billingService.getBillingStats();

      expect(result.success).toBe(false);
    });
  });

  describe('getAccountsReceivable', () => {
    it('should fetch accounts receivable', async () => {
      const mockResponse = {
        data: {
          totalPendiente: 15000,
          facturasPendientes: 5
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await billingService.getAccountsReceivable();

      expect(mockedApi.get).toHaveBeenCalledWith('/billing/accounts-receivable');
      expect(result.success).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in MXN', () => {
      const formatted = billingService.formatCurrency(1500.50);
      expect(formatted).toContain('1,500.50');
    });

    it('should handle zero', () => {
      const formatted = billingService.formatCurrency(0);
      expect(formatted).toContain('0.00');
    });

    it('should handle large numbers', () => {
      const formatted = billingService.formatCurrency(1000000);
      expect(formatted).toContain('1,000,000.00');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const formatted = billingService.formatDate('2025-01-15T10:00:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle invalid date', () => {
      const formatted = billingService.formatDate('invalid-date');
      expect(formatted).toContain('Invalid');
    });
  });

  describe('getDaysOverdue', () => {
    it('should calculate days overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const days = billingService.getDaysOverdue(yesterday.toISOString());
      expect(days).toBeLessThan(0);
    });

    it('should calculate days until due', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const days = billingService.getDaysOverdue(tomorrow.toISOString());
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('isInvoiceOverdue', () => {
    const createMockInvoice = (estado: Invoice['estado'], fechaVencimiento: string): Invoice => ({
      id: 1,
      folio: 'INV-001',
      cuentaPacienteId: 1,
      pacienteId: 1,
      total: 1000,
      saldoPendiente: 1000,
      estado,
      fechaVencimiento,
      fechaEmision: '2025-01-01',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      paciente: { id: 1, nombre: 'Test', apellidoPaterno: 'Patient' }
    });

    it('should return false for paid invoice', () => {
      const invoice = createMockInvoice('paid', '2025-01-01');
      expect(billingService.isInvoiceOverdue(invoice)).toBe(false);
    });

    it('should return true for overdue invoice', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const invoice = createMockInvoice('pending', yesterday.toISOString());
      expect(billingService.isInvoiceOverdue(invoice)).toBe(true);
    });

    it('should return false for not yet due invoice', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 10);

      const invoice = createMockInvoice('pending', tomorrow.toISOString());
      expect(billingService.isInvoiceOverdue(invoice)).toBe(false);
    });
  });

  describe('getInvoiceStatusColor', () => {
    it('should return correct colors', () => {
      expect(billingService.getInvoiceStatusColor('paid')).toBe('success');
      expect(billingService.getInvoiceStatusColor('pending')).toBe('primary');
      expect(billingService.getInvoiceStatusColor('overdue')).toBe('error');
      expect(billingService.getInvoiceStatusColor('partial')).toBe('warning');
      expect(billingService.getInvoiceStatusColor('cancelled')).toBe('default');
    });
  });

  describe('validateInvoiceData', () => {
    it('should validate correct invoice data', () => {
      const validData: CreateInvoiceRequest = {
        cuentaPacienteId: 5,
        fechaVencimiento: '2025-12-31',
        descuentoGlobal: 10
      };

      const result = billingService.validateInvoiceData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid cuenta ID', () => {
      const invalidData: CreateInvoiceRequest = {
        cuentaPacienteId: 0
      };

      const result = billingService.validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid discount', () => {
      const invalidData: CreateInvoiceRequest = {
        cuentaPacienteId: 5,
        descuentoGlobal: 150
      };

      const result = billingService.validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('El descuento global debe estar entre 0 y 100%');
    });
  });

  describe('validatePaymentData', () => {
    it('should validate correct payment data', () => {
      const validData: CreatePaymentRequest = {
        facturaId: 1,
        monto: 500,
        metodoPago: 'cash',
        fechaPago: '2025-01-15'
      };

      const result = billingService.validatePaymentData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid amount', () => {
      const invalidData: CreatePaymentRequest = {
        facturaId: 1,
        monto: -500,
        metodoPago: 'cash'
      };

      const result = billingService.validatePaymentData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require authorization for card payments', () => {
      const invalidData: CreatePaymentRequest = {
        facturaId: 1,
        monto: 500,
        metodoPago: 'card'
      };

      const result = billingService.validatePaymentData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Código de autorización es requerido para pagos con tarjeta');
    });

    it('should require reference for transfers', () => {
      const invalidData: CreatePaymentRequest = {
        facturaId: 1,
        monto: 500,
        metodoPago: 'transfer'
      };

      const result = billingService.validatePaymentData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Referencia bancaria es requerida para transferencias');
    });
  });
});
