// ABOUTME: Tests unitarios para CuentasPorCobrarPage - Página de gestión de CPC
// ABOUTME: Cubre rendering, filtros, búsqueda, tabla, y apertura de diálogos

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
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

// MemoryRouter necesario porque PageHeader usa useNavigate()
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </MemoryRouter>
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

// Mock para getCPCStats - debe coincidir con estructura esperada por el componente
// El componente espera { resumen, distribucion } y transforma a CPCStatsCards format
const mockStatsResponse = {
  resumen: {
    totalCPC: 15,
    montoTotalPendiente: 45000.50,
    montoTotalRecuperado: 25000.75,
    porcentajeRecuperacion: 35.7,
  },
  distribucion: [
    { estado: 'pendiente', cantidad: 5, saldoPendiente: 15000.00 },
    { estado: 'pagado_parcial', cantidad: 8, saldoPendiente: 20000.00 },
    { estado: 'pagado_total', cantidad: 10, saldoPendiente: 30000.00 },
    { estado: 'cancelado', cantidad: 2, saldoPendiente: 5000.00 },
  ],
};

describe('CuentasPorCobrarPage - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (posService.getCuentasPorCobrar as jest.Mock).mockResolvedValue({
      success: true,
      data: { cuentasPorCobrar: mockCuentas },
    });
    // La estructura debe coincidir con lo que espera loadStats()
    // El componente extrae response.data -> { resumen, distribucion }
    (posService.getCPCStats as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStatsResponse,
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
        // Material-UI Select: buscar el combobox por su role
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should filter by estado', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CuentasPorCobrarPage />);

      // Esperar a que el combobox esté disponible
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Material-UI Select: hacer click en el combobox para abrir el dropdown
      const estadoSelect = screen.getByRole('combobox');
      await user.click(estadoSelect);

      // Esperar a que las opciones aparezcan y clickear en Pendiente
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /^Pendiente$/i })).toBeInTheDocument();
      });

      const pendienteOption = screen.getByRole('option', { name: /^Pendiente$/i });
      await user.click(pendienteOption);

      // El componente debería llamar getCuentasPorCobrar con el filtro de estado
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

      // Esperar a que la tabla se cargue (verificando que un dato de la tabla ya está visible)
      await waitFor(() => {
        expect(screen.getByTestId('cpc-table')).toBeInTheDocument();
      });

      // Verificar los headers de la tabla
      // Usamos role="columnheader" para ser más específicos
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThanOrEqual(8);

      // Verificar que los textos específicos existen en los headers
      expect(screen.getByText('Paciente')).toBeInTheDocument();
      expect(screen.getByText('Monto Original')).toBeInTheDocument();
      expect(screen.getByText('Monto Pagado')).toBeInTheDocument();
      expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Fecha Creación')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
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
        // La función formatCurrency usa toFixed(2) que NO agrega separadores de miles
        expect(screen.getByText(/\$5000\.00/)).toBeInTheDocument();
        // $3000.00 aparece varias veces (montoOriginal y saldoPendiente)
        const threeThousandElements = screen.getAllByText(/\$3000\.00/);
        expect(threeThousandElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/\$2000\.00/)).toBeInTheDocument();
      });
    });

    it('should display status chips', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      // Esperar a que la tabla se cargue
      await waitFor(() => {
        expect(screen.getByTestId('cpc-table')).toBeInTheDocument();
      });

      // Verificar que los chips de estado están presentes
      // El mock tiene 2 cuentas: una con estado 'pagado_parcial' y otra con 'pendiente'
      // "Pago Parcial" aparece múltiples veces (chip en tabla + opción en dropdown filtro)
      await waitFor(() => {
        const pagoParcialElements = screen.getAllByText('Pago Parcial');
        expect(pagoParcialElements.length).toBeGreaterThan(0);
      });

      // "Pendiente" también aparece en el dropdown de filtros, así que buscamos todos
      const pendienteElements = screen.getAllByText('Pendiente');
      expect(pendienteElements.length).toBeGreaterThan(0);
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
        // El componente muestra "No hay cuentas por cobrar" cuando no hay filtros activos
        expect(screen.getByText('No hay cuentas por cobrar')).toBeInTheDocument();
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
    it('should handle failed data load gracefully', async () => {
      // El componente captura errores internamente con try/catch en loadCuentas y loadStats
      // Por lo que errores de red no propagan al estado de error, solo se loguean en console
      // Esto significa que la tabla estará vacía pero no mostrará mensaje de error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (posService.getCuentasPorCobrar as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<CuentasPorCobrarPage />);

      // El componente debería mostrar estado vacío en lugar de error
      await waitFor(() => {
        expect(screen.getByText('No hay cuentas por cobrar')).toBeInTheDocument();
      });

      // Verificar que console.error fue llamado
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
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
        // La función formatCurrency usa toFixed(2) sin separadores de miles
        expect(screen.getByText(/\$5000\.00/)).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      renderWithTheme(<CuentasPorCobrarPage />);

      await waitFor(() => {
        // toLocaleDateString('es-MX') formatea como "1/1/2025"
        expect(screen.getByText(/1\/1\/2025/i)).toBeInTheDocument();
      });
    });
  });
});
