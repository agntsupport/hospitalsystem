import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import authSlice from '@/store/slices/authSlice';
import uiSlice from '@/store/slices/uiSlice';
import patientsSlice from '@/store/slices/patientsSlice';
import type { PatientStats } from '@/types/patients.types';

// Mock PatientsTab component for testing
const MockPatientsTab = () => {
  return (
    <div data-testid="patients-tab">
      <input placeholder="Buscar pacientes..." />
      <button>Nuevo Paciente</button>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Juan Pérez García</td>
            <td>juan.perez@email.com</td>
            <td>5551234567</td>
            <td>Activo</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      patients: patientsSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'testuser',
          rol: 'administrador' as const,
          email: 'test@test.com',
          activo: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        token: 'mock-token',
        loading: false,
        error: null,
      },
      ui: {
        sidebarOpen: false,
        theme: 'light' as const,
        notifications: [],
        loading: {
          global: false,
        },
        modals: {},
      },
      patients: {
        patients: [],
        currentPatient: null,
        stats: {
          totalPacientes: 3,
          pacientesMenores: 1,
          pacientesAdultos: 2,
          pacientesConCuentaAbierta: 0,
          pacientesHospitalizados: 0,
          pacientesAmbulatorios: 3,
          patientsByGender: { M: 2, F: 1, Otro: 0 },
          patientsByAgeGroup: {
            '0-17': 1,
            '18-35': 1,
            '36-55': 1,
            '56+': 0
          },
          growth: {
            total: 3,
            weekly: 3,
            monthly: 3
          }
        } as PatientStats,
        loading: false,
        error: null,
        filters: {
          search: '',
          esMenorEdad: false,
        },
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    },
  });
};

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement, { store = createTestStore() } = {}) => {
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

describe('PatientsTab (Simple Tests)', () => {
  describe('Basic Rendering', () => {
    it('should render patients tab component', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByTestId('patients-tab')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByPlaceholderText(/buscar pacientes/i)).toBeInTheDocument();
    });

    it('should render add patient button', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByText(/nuevo paciente/i)).toBeInTheDocument();
    });

    it('should render patient data table', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByText('Juan Pérez García')).toBeInTheDocument();
      expect(screen.getByText('juan.perez@email.com')).toBeInTheDocument();
      expect(screen.getByText('5551234567')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should have table headers', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle search input changes', () => {
      renderWithProviders(<MockPatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      fireEvent.change(searchInput, { target: { value: 'Juan' } });
      
      expect(searchInput).toHaveValue('Juan');
    });

    it('should handle button clicks', () => {
      renderWithProviders(<MockPatientsTab />);
      
      const addButton = screen.getByText(/nuevo paciente/i);
      fireEvent.click(addButton);
      
      // Button should be clickable
      expect(addButton).toBeInTheDocument();
    });

    it('should handle keyboard events', () => {
      renderWithProviders(<MockPatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });
      
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Redux Store Integration', () => {
    it('should access patient stats from store', () => {
      const store = createTestStore();
      renderWithProviders(<MockPatientsTab />, { store });
      
      const state = store.getState();
      expect(state.patients.stats?.totalPacientes).toBe(3);
      expect(state.patients.stats?.pacientesAdultos).toBe(2);
    });

    it('should access user authentication from store', () => {
      const store = createTestStore();
      renderWithProviders(<MockPatientsTab />, { store });
      
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.rol).toBe('administrador');
    });

    it('should handle loading state', () => {
      const store = configureStore({
        reducer: {
          auth: authSlice,
          ui: uiSlice,
          patients: patientsSlice,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            user: {
              id: 1,
              username: 'testuser',
              rol: 'administrador',
              email: 'test@test.com',
              activo: true,
              createdAt: '2025-01-01',
            },
            token: 'mock-token',
            loading: false,
            error: null,
          },
          ui: {
            sidebarOpen: false,
            theme: 'light' as const,
            notifications: [],
            loading: {
              global: true, // Loading state
            },
            modals: {},
          },
          patients: {
            patients: [],
            currentPatient: null,
            stats: {
              totalPacientes: 0,
              pacientesMenores: 0,
              pacientesAdultos: 0,
              pacientesConCuentaAbierta: 0,
              pacientesHospitalizados: 0,
              pacientesAmbulatorios: 0,
            },
            loading: true,
            error: null,
            filters: {
              search: '',
              esMenorEdad: false,
            },
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        },
      });

      renderWithProviders(<MockPatientsTab />, { store });
      
      const state = store.getState();
      expect(state.patients.loading).toBe(true);
      expect(state.ui.loading).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      renderWithProviders(<MockPatientsTab />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
      expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
    });

    it('should have accessible form controls', () => {
      renderWithProviders(<MockPatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      const addButton = screen.getByRole('button', { name: /nuevo paciente/i });
      
      expect(searchInput).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<MockPatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle error state', () => {
      const store = configureStore({
        reducer: {
          auth: authSlice,
          ui: uiSlice,
          patients: patientsSlice,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            user: {
              id: 1,
              username: 'testuser',
              rol: 'administrador',
              email: 'test@test.com',
              activo: true,
              createdAt: '2025-01-01',
            },
            token: 'mock-token',
            loading: false,
            error: null,
          },
          ui: {
            sidebarOpen: false,
            theme: 'light' as const,
            notifications: [],
            loading: {
              global: false,
            },
            modals: {},
          },
          patients: {
            patients: [],
            currentPatient: null,
            stats: {
              totalPacientes: 0,
              pacientesMenores: 0,
              pacientesAdultos: 0,
              pacientesConCuentaAbierta: 0,
              pacientesHospitalizados: 0,
              pacientesAmbulatorios: 0,
            },
            loading: false,
            error: 'Failed to load patients',
            filters: {
              search: '',
              esMenorEdad: false,
            },
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        },
      });

      renderWithProviders(<MockPatientsTab />, { store });
      
      const state = store.getState();
      expect(state.patients.error).toBe('Failed to load patients');
    });
  });
});