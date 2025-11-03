// Mock completo de posService para Jest - actualizado para incluir todas las funciones
export const posService = {
  // Stats
  getStats: jest.fn(),

  // Services
  getServices: jest.fn(),
  searchServices: jest.fn(),
  getAvailableServices: jest.fn(),

  // Products
  getProducts: jest.fn(),
  searchProducts: jest.fn(),

  // Patient Accounts - AGREGADO para useAccountHistory
  getPatientAccounts: jest.fn(),
  createPatientAccount: jest.fn(),
  getPatientAccountById: jest.fn(),
  addTransaction: jest.fn(),
  closeAccount: jest.fn(),
  getAccountTransactions: jest.fn(),

  // Quick Sales - AGREGADO para useAccountHistory
  processQuickSale: jest.fn(),
  getSalesHistory: jest.fn(),

  // Legacy aliases (mantener compatibilidad con tests antiguos)
  getOpenAccounts: jest.fn(),
  createAccount: jest.fn(),
};