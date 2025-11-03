import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import PatientFormDialog from '../PatientFormDialog';
import { patientsService } from '@/services/patientsService';
import authSlice from '@/store/slices/authSlice';
import uiSlice from '@/store/slices/uiSlice';
import patientsSlice from '@/store/slices/patientsSlice';

// Mock services
jest.mock('@/services/patientsService');
const mockedPatientsService = patientsService as jest.Mocked<typeof patientsService>;

// Mock Material-UI components that might cause issues
jest.mock('@mui/x-date-pickers/DatePicker', () => {
  return function MockDatePicker({ label, value, onChange, slotProps }: any) {
    return (
      <input
        data-testid={`date-picker-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        type="date"
        value={value ? new Date(value).toISOString().split('T')[0] : ''}
        onChange={(e) => onChange && onChange(new Date(e.target.value))}
        {...slotProps?.textField}
      />
    );
  };
});

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  return function MockLocalizationProvider({ children }: any) {
    return <div>{children}</div>;
  };
});

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
          totalPacientes: 0,
          pacientesMenores: 0,
          pacientesAdultos: 0,
          pacientesConCuentaAbierta: 0,
          pacientesHospitalizados: 0,
          pacientesAmbulatorios: 0,
        },
        loading: false,
        error: null,
        filters: {
          search: '',
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

describe('PatientFormDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnPatientCreated = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onPatientCreated: mockOnPatientCreated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPatientsService.createPatient.mockResolvedValue({
      success: true,
      message: 'Paciente creado exitosamente',
      data: {
        id: 1,
        numeroExpediente: 'EXP-001',
        nombre: 'Test',
        apellidoPaterno: 'Patient',
        apellidoMaterno: 'Test',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'test@example.com',
        direccion: 'Test Address',
        ciudad: 'Test City',
        estado: 'Test State',
        codigoPostal: '12345',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    });

    mockedPatientsService.updatePatient.mockResolvedValue({
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: {
        id: 1,
        numeroExpediente: 'EXP-001',
        nombre: 'Updated',
        edad: 35,
        apellidoPaterno: 'Patient',
        apellidoMaterno: 'Test',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'updated@example.com',
        direccion: 'Updated Address',
        ciudad: 'Updated City',
        estado: 'Updated State',
        codigoPostal: '54321',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    });
  });

  describe('Rendering', () => {
    it('should render create patient dialog when no patient is provided', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);

      expect(screen.getByText('Registrar Nuevo Paciente')).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido paterno/i)).toBeInTheDocument();
      // Género field is a Select with label text "Género *"
      expect(screen.getByText('Género *')).toBeInTheDocument();
      expect(screen.getByText('Siguiente')).toBeInTheDocument();
    });

    it('should render edit patient dialog when patient is provided', () => {
      const patient = {
        id: 1,
        numeroExpediente: 'EXP-002',
        nombre: 'John',
        apellidoPaterno: 'Doe',
        apellidoMaterno: 'Smith',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'john.doe@example.com',
        direccion: 'Test Address',
        ciudad: 'Test City',
        estado: 'Test State',
        codigoPostal: '12345',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      renderWithProviders(<PatientFormDialog {...defaultProps} editingPatient={patient} />);

      expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByText('Siguiente')).toBeInTheDocument(); // First step shows "Siguiente"
    });

    it('should not render when dialog is closed', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Registrar Nuevo Paciente')).not.toBeInTheDocument();
      expect(screen.queryByText('Editar Paciente')).not.toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      // Required fields
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido paterno/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/género/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-fecha-de-nacimiento')).toBeInTheDocument();
      
      // Optional fields
      expect(screen.getByLabelText(/apellido materno/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
        expect(screen.getByText('El apellido paterno es requerido')).toBeInTheDocument();
        expect(screen.getByText('La fecha de nacimiento es requerida')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const emailField = screen.getByLabelText(/email/i);
      await userEvent.type(emailField, 'invalid-email');
      
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const phoneField = screen.getByLabelText(/teléfono/i);
      await userEvent.type(phoneField, '123');
      
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El teléfono debe tener al menos 10 dígitos')).toBeInTheDocument();
      });
    });

    it('should validate minimum age', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateField = screen.getByTestId('date-picker-fecha-de-nacimiento');
      fireEvent.change(dateField, { target: { value: tomorrow.toISOString().split('T')[0] } });
      
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La fecha de nacimiento no puede ser futura')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new patient successfully', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText(/nombre/i), 'John');
      await userEvent.type(screen.getByLabelText(/apellido paterno/i), 'Doe');
      
      const dateField = screen.getByTestId('date-picker-fecha-de-nacimiento');
      fireEvent.change(dateField, { target: { value: '1990-01-01' } });
      
      // Select gender
      const genderField = screen.getByLabelText(/género/i);
      fireEvent.mouseDown(genderField);
      const maleOption = screen.getByText('Masculino');
      fireEvent.click(maleOption);
      
      // Submit form
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedPatientsService.createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: 'John',
            apellidoPaterno: 'Doe',
            genero: 'M',
            fechaNacimiento: '1990-01-01',
          })
        );
        expect(mockOnPatientCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should update existing patient successfully', async () => {
      const patient = {
        id: 1,
        numeroExpediente: 'EXP-002',
        nombre: 'John',
        apellidoPaterno: 'Doe',
        apellidoMaterno: 'Smith',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'john.doe@example.com',
        direccion: 'Test Address',
        ciudad: 'Test City',
        estado: 'Test State',
        codigoPostal: '12345',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      renderWithProviders(<PatientFormDialog {...defaultProps} editingPatient={patient} />);
      
      // Update name
      const nameField = screen.getByDisplayValue('John');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Jane');
      
      // Submit form
      const submitButton = screen.getByText('Actualizar Paciente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedPatientsService.updatePatient).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            nombre: 'Jane',
          })
        );
        expect(mockOnPatientCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedPatientsService.createPatient.mockRejectedValue({
        response: {
          data: {
            message: 'Error creating patient',
          },
        },
      });

      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText(/nombre/i), 'John');
      await userEvent.type(screen.getByLabelText(/apellido paterno/i), 'Doe');
      
      const dateField = screen.getByTestId('date-picker-fecha-de-nacimiento');
      fireEvent.change(dateField, { target: { value: '1990-01-01' } });
      
      const genderField = screen.getByLabelText(/género/i);
      fireEvent.mouseDown(genderField);
      const maleOption = screen.getByText('Masculino');
      fireEvent.click(maleOption);
      
      // Submit form
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error creating patient')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockedPatientsService.createPatient.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: 'Paciente creado exitosamente',
          data: { id: 1, nombre: 'Test', apellidoPaterno: 'Patient' } as any
        }), 100))
      );

      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText(/nombre/i), 'John');
      await userEvent.type(screen.getByLabelText(/apellido paterno/i), 'Doe');
      
      const dateField = screen.getByTestId('date-picker-fecha-de-nacimiento');
      fireEvent.change(dateField, { target: { value: '1990-01-01' } });
      
      const genderField = screen.getByLabelText(/género/i);
      fireEvent.mouseDown(genderField);
      const maleOption = screen.getByText('Masculino');
      fireEvent.click(maleOption);
      
      // Submit form
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when cancel button is clicked', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close dialog when backdrop is clicked', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      // Click on backdrop (outside dialog)
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should reset form when dialog is reopened', () => {
      const { rerender } = renderWithProviders(<PatientFormDialog {...defaultProps} open={false} />);
      
      // Reopen dialog
      rerender(
        <Provider store={createTestStore()}>
          <ThemeProvider theme={theme}>
            <BrowserRouter>
              <PatientFormDialog {...defaultProps} open={true} />
            </BrowserRouter>
          </ThemeProvider>
        </Provider>
      );
      
      // Form should be empty
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
      expect(screen.getByLabelText(/apellido paterno/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido paterno/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/género/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const nameField = screen.getByLabelText(/nombre/i);
      nameField.focus();
      
      expect(nameField).toHaveFocus();
      
      // Tab to next field
      await userEvent.tab();
      expect(screen.getByLabelText(/apellido paterno/i)).toHaveFocus();
    });

    it('should announce errors to screen readers', async () => {
      renderWithProviders(<PatientFormDialog {...defaultProps} />);
      
      const submitButton = screen.getByText('Siguiente');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('El nombre es requerido');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});