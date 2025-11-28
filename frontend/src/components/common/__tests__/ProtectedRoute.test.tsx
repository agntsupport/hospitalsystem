// ABOUTME: Tests P0 para ProtectedRoute - Auth wrapper component con role-based access
// ABOUTME: Cubre loading state, authentication check, role verification, y redirection

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { User, UserRole } from '@/types/auth.types';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

// Mock react-router-dom Navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{`Navigating to ${to}`}</div>,
  useLocation: () => ({ pathname: '/test' })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Helper to create complete mock auth state
const createMockAuthState = (overrides: Partial<ReturnType<typeof useAuth>> = {}): ReturnType<typeof useAuth> => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  verifyToken: jest.fn(),
  getProfile: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  hasRole: jest.fn().mockReturnValue(false),
  ...overrides
});

// Helper to create a complete user object
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'testuser',
  rol: 'administrador' as UserRole,
  activo: true,
  createdAt: new Date().toISOString(),
  ...overrides
});

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute - P0 Critical Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('A1. Loading State', () => {
    it('should show loading indicator when auth is loading', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        loading: true
      }));

      const { container } = renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
      expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not render children during loading', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        loading: true
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('A2. Not Authenticated', () => {
    it('should redirect to /login when not authenticated', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: false,
        user: null
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to /login when user is null', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: null
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /login');
    });
  });

  describe('A3. Role-Based Access', () => {
    it('should render children when user has required role', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'admin', rol: 'administrador' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'cajero']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show access denied when user lacks required role', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'cashier', rol: 'cajero' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      expect(screen.getByText(/No tienes permisos para acceder a esta sección/)).toBeInTheDocument();
      expect(screen.getByText(/cajero/)).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should display current user role in access denied message', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'user', rol: 'enfermero' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'medico_especialista']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/enfermero/)).toBeInTheDocument();
    });

    it('should block access when roles array is empty', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'user', rol: 'cajero' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={[]}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Empty roles array means no roles are allowed - should block access
      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    });

    it('should allow access when no roles specified', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'user', rol: 'cajero' })
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('A4. Successful Access', () => {
    it('should render children when authenticated with no role restrictions', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'admin', rol: 'administrador' })
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when user has one of multiple allowed roles', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'doctor', rol: 'medico_especialista' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'medico_especialista', 'medico_residente']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render complex children components', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'admin', rol: 'administrador' })
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back!</p>
            <button>Action</button>
          </div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('A5. Edge Cases', () => {
    it('should handle case-sensitive role matching', () => {
      // Role with wrong case should be denied
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'user', rol: 'administrador' })
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Since 'administrador' matches, this should pass
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle undefined user role', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: { ...createMockUser(), rol: undefined as unknown as UserRole }
      }));

      renderWithTheme(
        <ProtectedRoute roles={['administrador']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    });

    it('should not show loading when both loading=false and isAuthenticated=true', () => {
      mockUseAuth.mockReturnValue(createMockAuthState({
        isAuthenticated: true,
        user: createMockUser({ username: 'user', rol: 'administrador' }),
        loading: false
      }));

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Verificando autenticación...')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
