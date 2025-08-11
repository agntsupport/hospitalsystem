import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';

import Login from '../Login';

// Simple reducer mocks
const mockAuthReducer = (state = { user: null, token: null, loading: false, error: null }, action: any) => state;
const mockUiReducer = (state = { sidebarOpen: false }, action: any) => state;

// Mock del hook useAuth
const mockLogin = jest.fn();
const mockClearError = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    error: null,
    isAuthenticated: false,
    clearError: mockClearError,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const theme = createTheme();

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: mockAuthReducer,
      ui: mockUiReducer,
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Sistema Hospitalario')).toBeInTheDocument();
    expect(screen.getByText('Ingrese sus credenciales para acceder al sistema')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('displays test credentials', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Credenciales de prueba:')).toBeInTheDocument();
    expect(screen.getByText(/Administrador/)).toBeInTheDocument();
    expect(screen.getByText(/admin.*admin123/)).toBeInTheDocument();
    expect(screen.getByText(/Cajero/)).toBeInTheDocument();
    expect(screen.getByText(/cajero1.*cajero123/)).toBeInTheDocument();
    expect(screen.getByText(/Enfermero/)).toBeInTheDocument();
    expect(screen.getByText(/enfermero1.*enfermero123/)).toBeInTheDocument();
    expect(screen.getByText(/Especialista/)).toBeInTheDocument();
    expect(screen.getByText(/especialista1.*medico123/)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    });
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    await user.type(usernameInput, 'ab'); // Menos de 3 caracteres
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario debe tener al menos 3 caracteres')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, '12345'); // Menos de 6 caracteres
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');
    
    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('calls login function with correct credentials on form submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
    });
  });

  it('navigates to dashboard on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('trims whitespace from username', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, '  admin  '); // With spaces
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin', // Should be trimmed
        password: 'admin123',
      });
    });
  });

  it('calls clearError on component mount', () => {
    renderWithProviders(<Login />);
    expect(mockClearError).toHaveBeenCalled();
  });

  it('calls clearError before form submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    
    // Clear previous calls
    mockClearError.mockClear();
    
    await user.click(submitButton);
    
    expect(mockClearError).toHaveBeenCalled();
  });
});

// Test con diferentes estados del hook useAuth
describe('Login Component - Different States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays error message when error prop is provided', () => {
    // Reemplazar temporalmente el mock
    const mockUseAuthWithError = jest.fn(() => ({
      login: mockLogin,
      loading: false,
      error: 'Credenciales inválidas',
      isAuthenticated: false,
      clearError: mockClearError,
    }));
    
    jest.mocked(require('@/hooks/useAuth')).useAuth = mockUseAuthWithError;

    renderWithProviders(<Login />);
    
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    // Reemplazar temporalmente el mock
    const mockUseAuthLoading = jest.fn(() => ({
      login: mockLogin,
      loading: true,
      error: null,
      isAuthenticated: false,
      clearError: mockClearError,
    }));
    
    jest.mocked(require('@/hooks/useAuth')).useAuth = mockUseAuthLoading;

    renderWithProviders(<Login />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeDisabled();
    expect(screen.getByLabelText(/contraseña/i)).toBeDisabled();
  });

  it('redirects to dashboard when already authenticated', () => {
    // Reemplazar temporalmente el mock
    const mockUseAuthAuthenticated = jest.fn(() => ({
      login: mockLogin,
      loading: false,
      error: null,
      isAuthenticated: true,
      clearError: mockClearError,
    }));
    
    jest.mocked(require('@/hooks/useAuth')).useAuth = mockUseAuthAuthenticated;

    renderWithProviders(<Login />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});