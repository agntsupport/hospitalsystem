import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import PatientsTab from '../PatientsTab';
import { patientsService } from '@/services/patientsService';
import authSlice from '@/store/slices/authSlice';
import uiSlice from '@/store/slices/uiSlice';
import patientsSlice from '@/store/slices/patientsSlice';

// Mock services
jest.mock('@/services/patientsService');
const mockedPatientsService = patientsService as jest.Mocked<typeof patientsService>;

// Mock components that might cause issues
jest.mock('../PatientFormDialog', () => {
  return function MockPatientFormDialog({ open, onClose, onSuccess, patient }: any) {
    if (!open) return null;
    return (
      <div data-testid="patient-form-dialog">
        <button onClick={onSuccess}>Mock Success</button>
        <button onClick={onClose}>Mock Close</button>
        {patient && <span data-testid="editing-patient">{patient.id}</span>}
      </div>
    );
  };
});

// Test data
const mockPatients = [
  {
    id: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    fechaNacimiento: '1990-05-15',
    genero: 'M' as const,
    telefono: '5551234567',
    email: 'juan.perez@email.com',
    direccion: 'Calle Test 123',
    ciudad: 'Ciudad Test',
    estado: 'Estado Test',
    codigoPostal: '12345',
    activo: true,
    createdAt: '2025-01-01',
  },
  {
    id: 2,
    nombre: 'María',
    apellidoPaterno: 'González',
    apellidoMaterno: 'López',
    fechaNacimiento: '1985-08-22',
    genero: 'F' as const,
    telefono: '5559876543',
    email: 'maria.gonzalez@email.com',
    direccion: 'Avenida Test 456',
    ciudad: 'Ciudad Test',
    estado: 'Estado Test',
    codigoPostal: '54321',
    activo: true,
    createdAt: '2025-01-02',
  },
  {
    id: 3,
    nombre: 'Carlos',
    apellidoPaterno: 'Rodríguez',
    apellidoMaterno: 'Martínez',
    fechaNacimiento: '1992-12-10',
    genero: 'M' as const,
    telefono: '5555555555',
    email: 'carlos.rodriguez@email.com',
    direccion: 'Boulevard Test 789',
    ciudad: 'Ciudad Test',
    estado: 'Estado Test',
    codigoPostal: '67890',
    activo: false,
    createdAt: '2025-01-03',
  },
];

// Test store setup
const createTestStore = (initialState?: any) => {
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
          nombreUsuario: 'testuser',
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
        loading: false,
        error: null,
        success: null,
      },
      patients: {
        patients: mockPatients,
        currentPatient: null,
        stats: {
          totalPacientes: 3,
          pacientesActivos: 2,
          pacientesInactivos: 1,
          nuevosEsteMes: 3,
          edadPromedio: 30,
          distribucionGenero: { M: 2, F: 1, Otro: 0 },
          distribucionEdad: { '20-30': 1, '30-40': 2 },
        },
        loading: false,
        error: null,
        filters: {
          search: '',
          estado: 'todos',
          genero: 'todos',
        },
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        ...initialState,
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

describe('PatientsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPatientsService.getPatients.mockResolvedValue({
      success: true,
      data: {
        items: mockPatients,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    });

    mockedPatientsService.deletePatient.mockResolvedValue({
      success: true,
      data: { message: 'Paciente eliminado correctamente' },
    });
  });

  describe('Rendering', () => {
    it('should render patients table with data', () => {
      renderWithProviders(<PatientsTab />);
      
      expect(screen.getByText('Juan Pérez García')).toBeInTheDocument();
      expect(screen.getByText('María González López')).toBeInTheDocument();
      expect(screen.getByText('Carlos Rodríguez Martínez')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithProviders(<PatientsTab />);
      
      expect(screen.getByPlaceholderText(/buscar pacientes/i)).toBeInTheDocument();
    });

    it('should render filter controls', () => {
      renderWithProviders(<PatientsTab />);
      
      expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/género/i)).toBeInTheDocument();
    });

    it('should render add patient button', () => {
      renderWithProviders(<PatientsTab />);
      
      expect(screen.getByText(/nuevo paciente/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const store = createTestStore({ loading: true });
      renderWithProviders(<PatientsTab />, { store });
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show empty state when no patients', () => {
      const store = createTestStore({ 
        patients: [],
        pagination: { ...mockPatients[0], total: 0 }
      });
      renderWithProviders(<PatientsTab />, { store });
      
      expect(screen.getByText(/no se encontraron pacientes/i)).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('should filter patients by search term', async () => {
      renderWithProviders(<PatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await userEvent.type(searchInput, 'Juan');
      
      // Should trigger search after debounce or on enter
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Juan',
          })
        );
      });
    });

    it('should filter patients by estado', async () => {
      renderWithProviders(<PatientsTab />);
      
      const estadoFilter = screen.getByLabelText(/estado/i);
      fireEvent.mouseDown(estadoFilter);
      
      const activosOption = screen.getByText('Activos');
      fireEvent.click(activosOption);
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            activo: true,
          })
        );
      });
    });

    it('should filter patients by género', async () => {
      renderWithProviders(<PatientsTab />);
      
      const generoFilter = screen.getByLabelText(/género/i);
      fireEvent.mouseDown(generoFilter);
      
      const masculinoOption = screen.getByText('Masculino');
      fireEvent.click(masculinoOption);
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            genero: 'M',
          })
        );
      });
    });

    it('should clear search when clear button is clicked', async () => {
      renderWithProviders(<PatientsTab />);
      
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await userEvent.type(searchInput, 'Juan');
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Patient Actions', () => {
    it('should open create patient dialog when add button is clicked', () => {
      renderWithProviders(<PatientsTab />);
      
      const addButton = screen.getByText(/nuevo paciente/i);
      fireEvent.click(addButton);
      
      expect(screen.getByTestId('patient-form-dialog')).toBeInTheDocument();
    });

    it('should open edit patient dialog when edit button is clicked', () => {
      renderWithProviders(<PatientsTab />);
      
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByTestId('patient-form-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('editing-patient')).toHaveTextContent('1');
    });

    it('should show confirmation dialog when delete button is clicked', () => {
      renderWithProviders(<PatientsTab />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument();
      expect(screen.getByText(/está seguro.*eliminar.*paciente/i)).toBeInTheDocument();
    });

    it('should delete patient when deletion is confirmed', async () => {
      renderWithProviders(<PatientsTab />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByText(/eliminar/i);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockedPatientsService.deletePatient).toHaveBeenCalledWith(1);
      });
    });

    it('should cancel deletion when cancel button is clicked', () => {
      renderWithProviders(<PatientsTab />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteButtons[0]);
      
      const cancelButton = screen.getByText(/cancelar/i);
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText(/confirmar eliminación/i)).not.toBeInTheDocument();
    });
  });

  describe('Table Functionality', () => {
    it('should display patient information correctly', () => {
      renderWithProviders(<PatientsTab />);
      
      // Check patient data is displayed
      expect(screen.getByText('Juan Pérez García')).toBeInTheDocument();
      expect(screen.getByText('juan.perez@email.com')).toBeInTheDocument();
      expect(screen.getByText('5551234567')).toBeInTheDocument();
      expect(screen.getByText('Masculino')).toBeInTheDocument();
    });

    it('should show patient status badges', () => {
      renderWithProviders(<PatientsTab />);
      
      // Should show active and inactive badges
      expect(screen.getAllByText('Activo')).toHaveLength(2);
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      renderWithProviders(<PatientsTab />);
      
      // Check if dates are formatted (you may need to adjust based on your date formatting)
      expect(screen.getByText(/15\/05\/1990/)).toBeInTheDocument();
    });

    it('should calculate and display age', () => {
      renderWithProviders(<PatientsTab />);
      
      // Assuming age calculation is displayed
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1990;
      expect(screen.getByText(expectedAge.toString())).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when there are multiple pages', () => {
      const store = createTestStore({
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
      renderWithProviders(<PatientsTab />, { store });
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should change page when pagination button is clicked', async () => {
      const store = createTestStore({
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
      renderWithProviders(<PatientsTab />, { store });
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it('should change page size when rows per page is changed', async () => {
      renderWithProviders(<PatientsTab />);
      
      const rowsPerPageSelect = screen.getByDisplayValue('20');
      fireEvent.mouseDown(rowsPerPageSelect);
      
      const option50 = screen.getByText('50');
      fireEvent.click(option50);
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 50,
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', () => {
      const store = createTestStore({ 
        error: 'Error loading patients',
        loading: false 
      });
      renderWithProviders(<PatientsTab />, { store });
      
      expect(screen.getByText('Error loading patients')).toBeInTheDocument();
    });

    it('should handle delete error gracefully', async () => {
      mockedPatientsService.deletePatient.mockRejectedValue({
        response: {
          data: {
            message: 'Cannot delete patient with active records',
          },
        },
      });

      renderWithProviders(<PatientsTab />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByText(/eliminar/i);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Cannot delete patient with active records')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure for screen readers', () => {
      renderWithProviders(<PatientsTab />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(7); // Adjust based on your columns
      expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 data rows
    });

    it('should have accessible action buttons', () => {
      renderWithProviders(<PatientsTab />);
      
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
      
      editButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation in table', () => {
      renderWithProviders(<PatientsTab />);
      
      const firstEditButton = screen.getAllByRole('button', { name: /editar/i })[0];
      firstEditButton.focus();
      
      expect(firstEditButton).toHaveFocus();
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when form dialog success callback is called', async () => {
      renderWithProviders(<PatientsTab />);
      
      const addButton = screen.getByText(/nuevo paciente/i);
      fireEvent.click(addButton);
      
      const successButton = screen.getByText('Mock Success');
      fireEvent.click(successButton);
      
      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('should refresh data periodically if configured', () => {
      // This test would depend on your implementation of auto-refresh
      renderWithProviders(<PatientsTab />);
      
      // Verify initial load
      expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(1);
    });
  });
});