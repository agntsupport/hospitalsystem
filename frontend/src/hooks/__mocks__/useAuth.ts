// Mock de useAuth hook para Jest
export const useAuth = jest.fn(() => ({
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  clearError: jest.fn(),
}));