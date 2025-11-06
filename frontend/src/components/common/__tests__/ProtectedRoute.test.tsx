// ABOUTME: Tests P0 para ProtectedRoute - Auth wrapper component con role-based access
// ABOUTME: Cubre loading state, authentication check, role verification, y redirection

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

// Mock react-router-dom Navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{`Navigating to ${to}`}</div>,
  useLocation: () => ({ pathname: '/test' })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to /login when user is null', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'admin', rol: 'administrador' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'cajero']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show access denied when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'cashier', rol: 'cajero' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: 'enfermero' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'medico_especialista']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/enfermero/)).toBeInTheDocument();
    });

    it('should block access when roles array is empty', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: 'cajero' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={[]}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Empty roles array means no roles are allowed - should block access
      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    });

    it('should allow access when no roles specified', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: 'cajero' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'admin', rol: 'administrador' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when user has one of multiple allowed roles', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'doctor', rol: 'medico_especialista' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={['administrador', 'medico_especialista', 'medico_residente']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render complex children components', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'admin', rol: 'administrador' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

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
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: 'Administrador' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={['administrador']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Role matching is case-sensitive, so this should be denied
      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    });

    it('should handle undefined user role', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: undefined as any },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

      renderWithTheme(
        <ProtectedRoute roles={['administrador']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    });

    it('should not show loading when both loading=false and isAuthenticated=true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'user', rol: 'administrador' },
        loading: false,
        login: jest.fn(),
        logout: jest.fn()
      });

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
