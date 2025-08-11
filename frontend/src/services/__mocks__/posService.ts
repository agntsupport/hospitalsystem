// Mock de posService para Jest
export const posService = {
  getStats: jest.fn(),
  getOpenAccounts: jest.fn(),
  createAccount: jest.fn(),
  addTransaction: jest.fn(),
  closeAccount: jest.fn(),
};