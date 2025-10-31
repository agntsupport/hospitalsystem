import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import CirugiaFormDialog from '../CirugiaFormDialog';
import quirofanosService from '@/services/quirofanosService';
import { patientsService } from '@/services/patientsService';
import { employeeService } from '@/services/employeeService';
import authSlice from '@/store/slices/authSlice';
import uiSlice from '@/store/slices/uiSlice';

// Mock services
jest.mock('@/services/quirofanosService');
jest.mock('@/services/patientsService');
jest.mock('@/services/employeeService');

const mockedQuirofanosService = quirofanosService as jest.Mocked<typeof quirofanosService>;
const mockedPatientsService = patientsService as jest.Mocked<typeof patientsService>;
const mockedEmployeeService = employeeService as jest.Mocked<typeof employeeService>;

// Mock DateTimePicker
jest.mock('@mui/x-date-pickers/DateTimePicker', () => {
  return function MockDateTimePicker({ label, value, onChange, slotProps }: any) {
    return (
      <input
        data-testid={`datetime-picker-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        type="datetime-local"
        value={value ? new Date(value).toISOString().slice(0, 16) : ''}
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

// Test data
const mockQuirofanos = [
  { id: 1, numero: 101, tipo: 'general', estado: 'disponible' },
  { id: 2, numero: 102, tipo: 'especializado', estado: 'disponible' },
];

const mockPatients = [
  {
    id: 1,
    numeroExpediente: 'EXP001',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    fechaNacimiento: '1990-01-01',
    edad: 35,
    genero: 'M' as const,
    activo: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: 2,
    numeroExpediente: 'EXP002',
    nombre: 'María',
    apellidoPaterno: 'González',
    apellidoMaterno: 'López',
    fechaNacimiento: '1985-01-01',
    edad: 40,
    genero: 'F' as const,
    activo: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
];

const mockMedicos = [
  {
    id: 1,
    nombre: 'Dr. Carlos',
    apellidoPaterno: 'Martínez',
    tipoEmpleado: 'medico_especialista' as const,
    especialidad: 'Cirugía General',
    fechaIngreso: '2020-01-01',
    activo: true,
    createdAt: '2020-01-01'
  },
  {
    id: 2,
    nombre: 'Dra. Ana',
    apellidoPaterno: 'Rodríguez',
    tipoEmpleado: 'medico_especialista' as const,
    especialidad: 'Cardiología',
    fechaIngreso: '2020-01-01',
    activo: true,
    createdAt: '2020-01-01'
  },
];

const mockPersonalMedico = [
  {
    id: 3,
    nombre: 'Enfermera Laura',
    apellidoPaterno: 'Sánchez',
    tipoEmpleado: 'enfermero' as const,
    fechaIngreso: '2020-01-01',
    activo: true,
    createdAt: '2020-01-01'
  },
  ...mockMedicos,
];

const mockCirugia = {
  id: 1,
  quirofanoId: 1,
  pacienteId: 1,
  medicoId: 1,
  tipoIntervencion: 'Cirugía General',
  fechaInicio: '2025-08-15T09:00:00.000Z',
  fechaFin: '2025-08-15T11:00:00.000Z',
  observaciones: 'Cirugía de prueba',
  equipoMedico: [3],
  estado: 'programada' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'testuser',
          rol: 'medico_especialista' as const,
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

describe('CirugiaFormDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedQuirofanosService.getQuirofanos.mockResolvedValue({
      success: true,
      data: { items: mockQuirofanos },
    });

    mockedPatientsService.getPatients.mockResolvedValue({
      success: true,
      message: 'Patients fetched successfully',
      data: {
        items: mockPatients,
        pagination: {
          page: 1,
          limit: 100,
          total: mockPatients.length,
          totalPages: 1
        }
      },
    });

    mockedEmployeeService.getEmployees.mockResolvedValue({
      success: true,
      data: mockPersonalMedico,
    });

    mockedQuirofanosService.programarCirugia.mockResolvedValue({
      success: true,
      data: mockCirugia,
    });

    mockedQuirofanosService.actualizarCirugia.mockResolvedValue({
      success: true,
      data: { ...mockCirugia, observaciones: 'Actualizada' },
    });

    mockedQuirofanosService.getQuirofanosDisponibles.mockResolvedValue({
      success: true,
      data: mockQuirofanos,
    });
  });

  describe('Rendering', () => {
    it('should render create surgery dialog when no surgery is provided', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('➕ Programar Nueva Cirugía')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/quirófano/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/paciente/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/médico principal/i)).toBeInTheDocument();
      expect(screen.getByText('Programar')).toBeInTheDocument();
    });

    it('should render edit surgery dialog when surgery is provided', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} cirugia={mockCirugia} />);
      
      await waitFor(() => {
        expect(screen.getByText('✏️ Editar Cirugía')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
    });

    it('should load initial data on mount', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockedQuirofanosService.getQuirofanos).toHaveBeenCalledWith(
          expect.objectContaining({ estado: 'disponible', limit: 100 })
        );
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 100 })
        );
        expect(mockedEmployeeService.getEmployees).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 100 })
        );
      });
    });

    it('should show loading state while fetching data', () => {
      // Mock delayed responses
      mockedQuirofanosService.getQuirofanos.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { items: mockQuirofanos }
        }), 100))
      );

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should populate quirófano dropdown', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        
        expect(screen.getByText('Quirófano 101 - general')).toBeInTheDocument();
        expect(screen.getByText('Quirófano 102 - especializado')).toBeInTheDocument();
      });
    });

    it('should populate patient autocomplete', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const patientField = screen.getByLabelText(/paciente/i);
        fireEvent.click(patientField);
        
        expect(screen.getByText('Juan Pérez García')).toBeInTheDocument();
        expect(screen.getByText('María González López')).toBeInTheDocument();
      });
    });

    it('should populate doctor autocomplete with only medical staff', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const medicoField = screen.getByLabelText(/médico principal/i);
        fireEvent.click(medicoField);
        
        expect(screen.getByText('Dr. Carlos Martínez - Cirugía General')).toBeInTheDocument();
        expect(screen.getByText('Dra. Ana Rodríguez - Cardiología')).toBeInTheDocument();
        // Should not show nurses in doctor field
        expect(screen.queryByText('Enfermera Laura Sánchez')).not.toBeInTheDocument();
      });
    });

    it('should populate medical team autocomplete', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const equipoField = screen.getByLabelText(/equipo médico/i);
        fireEvent.click(equipoField);
        
        expect(screen.getByText('Enfermera Laura Sánchez - enfermero')).toBeInTheDocument();
        expect(screen.getByText('Dr. Carlos Martínez - medico_especialista')).toBeInTheDocument();
      });
    });

    it('should show intervention type suggestions', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const tipoField = screen.getByLabelText(/tipo de intervención/i);
        fireEvent.click(tipoField);
        
        expect(screen.getByText('Cirugía General')).toBeInTheDocument();
        expect(screen.getByText('Cirugía Cardíaca')).toBeInTheDocument();
        expect(screen.getByText('Neurocirugía')).toBeInTheDocument();
      });
    });
  });

  describe('Date and Time Handling', () => {
    it('should set end time automatically when start time is selected', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        const startTime = new Date('2025-08-15T09:00:00');
        
        fireEvent.change(startTimeField, { 
          target: { value: startTime.toISOString().slice(0, 16) } 
        });
        
        // End time should be set to 2 hours later
        const endTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-fin-(estimada)');
        const expectedEndTime = new Date('2025-08-15T11:00:00');
        
        expect(endTimeField).toHaveValue(expectedEndTime.toISOString().slice(0, 16));
      });
    });

    it('should validate that end time is after start time', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        const endTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-fin-(estimada)');
        
        const startTime = new Date('2025-08-15T11:00:00');
        const endTime = new Date('2025-08-15T09:00:00'); // Earlier than start
        
        fireEvent.change(startTimeField, { 
          target: { value: startTime.toISOString().slice(0, 16) } 
        });
        fireEvent.change(endTimeField, { 
          target: { value: endTime.toISOString().slice(0, 16) } 
        });
      });
      
      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/fecha de fin debe ser posterior/i)).toBeInTheDocument();
      });
    });

    it('should validate that surgery cannot be scheduled in the past', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        fireEvent.change(startTimeField, { 
          target: { value: yesterday.toISOString().slice(0, 16) } 
        });
      });
      
      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/no se pueden programar cirugías en fechas pasadas/i)).toBeInTheDocument();
      });
    });

    it('should show estimated duration', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        const endTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-fin-(estimada)');
        
        const startTime = new Date('2025-08-15T09:00:00');
        const endTime = new Date('2025-08-15T11:30:00'); // 2.5 hours later
        
        fireEvent.change(startTimeField, { 
          target: { value: startTime.toISOString().slice(0, 16) } 
        });
        fireEvent.change(endTimeField, { 
          target: { value: endTime.toISOString().slice(0, 16) } 
        });
        
        expect(screen.getByText('Duración estimada: 150 minutos')).toBeInTheDocument();
      });
    });
  });

  describe('Availability Checking', () => {
    it('should check quirófano availability when all fields are filled', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill quirófano, start time, and end time
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        const endTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-fin-(estimada)');
        
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
        fireEvent.change(endTimeField, { 
          target: { value: '2025-08-15T11:00' } 
        });
      });

      await waitFor(() => {
        expect(mockedQuirofanosService.getQuirofanosDisponibles).toHaveBeenCalledWith(
          '2025-08-15',
          '09:00',
          '11:00'
        );
      });
    });

    it('should show availability confirmation when quirófano is available', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill quirófano and times
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });

      await waitFor(() => {
        expect(screen.getByText('✅ Quirófano disponible')).toBeInTheDocument();
      });
    });

    it('should show warning when quirófano is not available', async () => {
      mockedQuirofanosService.getQuirofanosDisponibles.mockResolvedValue({
        success: true,
        data: [], // No available quirófanos
      });

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill quirófano and times
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });

      await waitFor(() => {
        expect(screen.getByText('⚠️ El quirófano no está disponible en ese horario')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const submitButton = screen.getByText('Programar');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Por favor complete todos los campos requeridos')).toBeInTheDocument();
      });
    });

    it('should validate intervention type is specified', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill some required fields but not intervention type
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const submitButton = screen.getByText('Programar');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Por favor especifique el tipo de intervención')).toBeInTheDocument();
      });
    });

    it('should validate dates are selected', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);

      await waitFor(() => {
        // Fill quirófano but not dates
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
      });

      const tipoField = screen.getByLabelText(/tipo de intervención/i);
      await userEvent.type(tipoField, 'Cirugía General');

      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor seleccione las fechas de inicio y fin')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new surgery successfully', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill all required fields
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const patientField = screen.getByLabelText(/paciente/i);
        fireEvent.click(patientField);
        fireEvent.click(screen.getByText('Juan Pérez García'));
        
        const medicoField = screen.getByLabelText(/médico principal/i);
        fireEvent.click(medicoField);
        fireEvent.click(screen.getByText('Dr. Carlos Martínez - Cirugía General'));
        
        const tipoField = screen.getByLabelText(/tipo de intervención/i);
        fireEvent.click(tipoField);
        fireEvent.click(screen.getByText('Cirugía General'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
        
        const endTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-fin-(estimada)');
        fireEvent.change(endTimeField, { 
          target: { value: '2025-08-15T11:00' } 
        });
      });
      
      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedQuirofanosService.programarCirugia).toHaveBeenCalledWith(
          expect.objectContaining({
            quirofanoId: 1,
            pacienteId: 1,
            medicoId: 1,
            tipoIntervencion: 'Cirugía General',
            fechaInicio: expect.any(String),
            fechaFin: expect.any(String),
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should update existing surgery successfully', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} cirugia={mockCirugia} />);
      
      await waitFor(() => {
        const observacionesField = screen.getByLabelText(/observaciones/i);
        fireEvent.change(observacionesField, { 
          target: { value: 'Observaciones actualizadas' } 
        });
      });
      
      const submitButton = screen.getByText('Actualizar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedQuirofanosService.actualizarCirugia).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            observaciones: 'Observaciones actualizadas',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedQuirofanosService.programarCirugia.mockRejectedValue({
        response: {
          data: {
            message: 'Quirófano no disponible en ese horario',
          },
        },
      });

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill required fields
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const patientField = screen.getByLabelText(/paciente/i);
        fireEvent.click(patientField);
        fireEvent.click(screen.getByText('Juan Pérez García'));
        
        const medicoField = screen.getByLabelText(/médico principal/i);
        fireEvent.click(medicoField);
        fireEvent.click(screen.getByText('Dr. Carlos Martínez - Cirugía General'));
        
        const tipoField = screen.getByLabelText(/tipo de intervención/i);
        fireEvent.click(tipoField);
        fireEvent.click(screen.getByText('Cirugía General'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });
      
      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Quirófano no disponible en ese horario')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockedQuirofanosService.programarCirugia.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockCirugia
        }), 100))
      );

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        // Fill required fields quickly
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const patientField = screen.getByLabelText(/paciente/i);
        fireEvent.click(patientField);
        fireEvent.click(screen.getByText('Juan Pérez García'));
        
        const medicoField = screen.getByLabelText(/médico principal/i);
        fireEvent.click(medicoField);
        fireEvent.click(screen.getByText('Dr. Carlos Martínez - Cirugía General'));
        
        const tipoField = screen.getByLabelText(/tipo de intervención/i);
        fireEvent.click(tipoField);
        fireEvent.click(screen.getByText('Cirugía General'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });
      
      const submitButton = screen.getByText('Programar');
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Medical Team Selection', () => {
    it('should allow multiple medical team member selection', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const equipoField = screen.getByLabelText(/equipo médico/i);
        fireEvent.click(equipoField);
        
        // Select multiple team members
        fireEvent.click(screen.getByText('Enfermera Laura Sánchez - enfermero'));
        fireEvent.click(screen.getByText('Dr. Carlos Martínez - medico_especialista'));
      });

      // Should show selected members as chips
      expect(screen.getByText('Enfermera Laura')).toBeInTheDocument();
      expect(screen.getByText('Dr. Carlos')).toBeInTheDocument();
    });

    it('should allow removing team members', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const equipoField = screen.getByLabelText(/equipo médico/i);
        fireEvent.click(equipoField);
        fireEvent.click(screen.getByText('Enfermera Laura Sánchez - enfermero'));
      });

      // Find and click remove button on chip
      const removeButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText('Enfermera Laura')).not.toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when cancel button is clicked', async () => {
      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should disable submit button during availability checking', async () => {
      // Mock delayed availability check
      mockedQuirofanosService.getQuirofanosDisponibles.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockQuirofanos
        }), 100))
      );

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });

      const submitButton = screen.getByText('Programar');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading errors', async () => {
      mockedQuirofanosService.getQuirofanos.mockRejectedValue({
        message: 'Failed to load quirófanos'
      });

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar los datos necesarios')).toBeInTheDocument();
      });
    });

    it('should handle availability check errors gracefully', async () => {
      mockedQuirofanosService.getQuirofanosDisponibles.mockRejectedValue({
        message: 'Availability check failed'
      });

      renderWithProviders(<CirugiaFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const quirofanoField = screen.getByLabelText(/quirófano/i);
        fireEvent.mouseDown(quirofanoField);
        fireEvent.click(screen.getByText('Quirófano 101 - general'));
        
        const startTimeField = screen.getByTestId('datetime-picker-fecha-y-hora-de-inicio');
        fireEvent.change(startTimeField, { 
          target: { value: '2025-08-15T09:00' } 
        });
      });

      // Should continue to work despite availability check error
      await waitFor(() => {
        expect(screen.getByText('Programar')).toBeEnabled();
      });
    });
  });
});