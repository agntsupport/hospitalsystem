// Mock de billingService para Jest
export const billingService = {
  getStats: jest.fn(),
  getInvoices: jest.fn(),
  getInvoiceById: jest.fn(),
  createInvoice: jest.fn(),
  getPayments: jest.fn(),
  addPayment: jest.fn(),
  getAccountsReceivable: jest.fn(),
};