// ABOUTME: Tests unitarios para CuentasPorCobrarPage - Página de gestión de CPC
// ABOUTME: Cubre rendering, filtros, búsqueda, tabla, y apertura de diálogos

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CuentasPorCobrarPage from '../CuentasPorCobrarPage';
import { posService } from '@/services/posService';

// Mock posService
jest.mock('@/services/posService', () => ({
  posService: {
    getCuentasPorCobrar: jest.fn(),
    getCPCStats: jest.fn(),
    registerCPCPayment: jest.fn(),
  },
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockCuentas = [
  {
    id: 1,
    cuentaPacienteId: 101,
    montoOriginal: 5000.00,
    saldoPendiente: 3000.00,
    montoPagado: 2000.00,
    estado: 'pagado_parcial',
    autorizadoPorId: 1,
    motivoAutorizacion: 'Sin recursos',
    fechaCreacion: '2025-01-01T10:00:00Z',
    paciente: {
      id: 1,
      nombre: 'Juan',
      apellidos: 'Pérez García',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      fechaNacimiento: '1980-01-01',
      genero: 'masculino',
      telefono: '4431234567',
      email: 'juan@example.com',
      numeroExpediente: 'EXP-001',
      activo: true,
    },
  },
  {
    id: 2,
    cuentaPacienteId: 102,
    montoOriginal: 3000.00,
    saldoPendiente: 3000.00,
    montoPagado: 0,
    estado: 'pendiente',
    autorizadoPorId: 1,
    motivoAutorizacion: 'Emergencia',
    fechaCreacion: '2025-01-02T10:00:00Z',
    paciente: {
      id: 2,
      nombre: 'María',
      apellidos: 'López Sánchez',
      apellidoPaterno: 'López',
      apellidoMaterno: 'Sánchez',
      fechaNacimiento: '1990-01-01',
      genero: 'femenino',
      telefono: '4431234568',
      email: 'maria@example.com',
      numeroExpediente: 'EXP-002',
      activo: true,
    },
  },
];

const mockStats = {
  totalCPCActivas: 15,
  montoPendienteTotal: 45000.50,
  montoRecuperadoTotal: 25000.75,
  porcentajeRecuperacion: 35.7,
  distribucionPorEstado: {
    pendiente: { cantidad: 5, monto: 15000.00 },
    pagado_parcial: { cantidad: 8, monto: 20000.00 },
    pagado_total: { cantidad: 10, monto: 30000.00 },
    cancelado: { cantidad: 2, monto: 5000.00 },
  },
};

describe('CuentasPorCobrarPage - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (posService.getCuentasPorCobrar as jest.Mock).mockResolvedValue({
      success: true,
      data: { cuentasPorCobrar: mockCuentas },
    });
    (posService.getCPCStats as jest.Mock).mockResolvedValue({
      success: true,
      data: { stats: mockStats },
    });
  });

  describe('A1. Basic Rendering', () => {
    it('should render page title', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestión de deudas pendientes de pacientes')).toBeInTheDocument();
      });
    });

    it('should load and display CPC data on mount', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(posService.getCuentasPorCobrar).toHaveBeenCalled();
        expect(posService.getCPCStats).toHaveBeenCalled();
      });
    });

    it('should display statistics cards', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('CPC Activas')).toBeInTheDocument();
        expect(screen.getByText('Monto Pendiente')).toBeInTheDocument();
      });
    });
  });

  describe('A2. Filters', () => {
    it('should render search input', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar por nombre de paciente o ID/i)).toBeInTheDocument();
      });
    });

    it('should render estado filter', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
      });
    });

    it('should filter by estado', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
      });

      const estadoSelect = screen.getByLabelText(/Estado/i);
      await user.click(estadoSelect);

      // Click on "Pendiente" option
      const pendienteOption = screen.getByRole('option', { name: /Pendiente/i });
      await user.click(pendienteOption);

      await waitFor(() => {
        expect(posService.getCuentasPorCobrar).toHaveBeenCalledWith({
          estado: 'pendiente',
        });
      });
    });

    it('should filter by search term', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar por nombre de paciente o ID/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nombre de paciente o ID/i);
      await user.type(searchInput, 'Juan');

      // Wait for filtering to happen
      await waitFor(() => {
        // Juan Pérez García should be visible
        expect(screen.getByText(/Juan Pérez García/i)).toBeInTheDocument();
      });
    });
  });

  describe('A3. Table Rendering', () => {
    it('should render table with headers', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Paciente')).toBeInTheDocument();
        expect(screen.getByText('Monto Original')).toBeInTheDocument();
        expect(screen.getByText('Monto Pagado')).toBeInTheDocument();
        expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Fecha Creación')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('should display CPC data in table', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText(/Juan Pérez García/i)).toBeInTheDocument();
        expect(screen.getByText(/María López Sánchez/i)).toBeInTheDocument();
      });
    });

    it('should display formatted amounts', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText(/\$5,000\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/\$3,000\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/\$2,000\.00/i)).toBeInTheDocument();
      });
    });

    it('should display status chips', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('Pago Parcial')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('should display action buttons for active CPC', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        // Should have 2 payment buttons (one for each CPC)
        const paymentButtons = screen.getAllByTestId(/registrar-pago-/);
        expect(paymentButtons.length).toBe(2);
      });
    });

    it('should show empty state when no CPC found', async () => {
      (posService.getCuentasPorCobrar as jest.Mock).mockResolvedValue({
        success: true,
        data: { cuentasPorCobrar: [] },
      });

      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('No se encontraron cuentas por cobrar')).toBeInTheDocument();
      });
    });
  });

  describe('A4. Loading State', () => {
    it('should show loading indicator while fetching data', () => {
      // Mock a slow response
      (posService.getCuentasPorCobrar as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithTheme(<CuentasPorCobrarPage />);

      // Should show loading spinner
      const progressBars = screen.queryAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('A5. Error Handling', () => {
    it('should display error message on failed data load', async () => {
      (posService.getCuentasPorCobrar as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('A6. Refresh Functionality', () => {
    it('should reload data when actualizar button clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        expect(screen.getByText('Actualizar')).toBeInTheDocument();
      });

      const actualizarButton = screen.getByText('Actualizar');
      await user.click(actualizarButton);

      // Should call the service again
      await waitFor(() => {
        expect(posService.getCuentasPorCobrar).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('A7. Formatters', () => {
    it('should format currency correctly', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        // Should have $ symbol and 2 decimal places
        expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        // Should display formatted date (locale-specific)
        expect(screen.getByText(/1\/1\/2025/i)).toBeInTheDocument();
      });
    });
  });
});
