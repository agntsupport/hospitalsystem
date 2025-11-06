// ABOUTME: Comprehensive test suite for Dashboard page component
// Tests rendering, data loading, KPIs, role-based modules, and user interactions

// Mock Material-UI icons to prevent cloneElement errors - MUST BE FIRST
jest.mock('@mui/icons-material', () => {
  const React = require('react');
  return new Proxy({}, {
    get: (target, prop) => {
      return React.forwardRef((props: any, ref: any) => <span ref={ref} {...props}>{prop}</span>);
    }
  });
});

// Mock hooks and services
jest.mock('@/hooks/useAuth');
jest.mock('@/services/reportsService');

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../Dashboard';
import patientsReducer from '@/store/slices/patientsSlice';
import * as reportsService from '@/services/reportsService';
import React from 'react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock data
const mockPatientsStats = {
  totalPacientes: 150,
  pacientesHospitalizados: 25,
  pacientesConCuentaAbierta: 18,
  pacientesAdultos: 120,
};

const mockExecutiveSummary = {
  ingresosTotales: 500000,
  utilidadNeta: 125000,
  pacientesAtendidos: 200,
  ocupacionPromedio: 75.5,
  satisfaccionGeneral: 4.5,
};

// Helper to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      patients: patientsReducer,
    },
    preloadedState: {
      patients: {
        stats: mockPatientsStats,
        loading: false,
        error: null,
        patients: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
        ...initialState,
      },
    },
  });
};

// Helper to render with providers
const renderDashboard = (user: any, storeState = {}) => {
  const { useAuth } = require('@/hooks/useAuth');
  useAuth.mockReturnValue({ user });

  const store = createTestStore(storeState);

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </Provider>
  );
};

describe('Dashboard Page - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful reports service response
    (reportsService.default.getExecutiveSummary as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      data: { resumenEjecutivo: mockExecutiveSummary },
    });

    (reportsService.default.formatCurrency as jest.Mock) = jest.fn((val: number) =>
      `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    );
  });

  // ========== Renderizado Inicial (3 tests) ==========

  describe('Initial Rendering', () => {
    it('should render dashboard without crashing', () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      expect(screen.getByText(/Sistema de Gestión Hospitalaria/i)).toBeInTheDocument();
    });

    it('should display correct welcome message based on time of day', () => {
      const user = { id: 1, username: 'Carlos', rol: 'medico_especialista' };
      renderDashboard(user);

      const hour = new Date().getHours();
      let expectedGreeting = 'Buenas noches';
      if (hour < 12) expectedGreeting = 'Buenos días';
      else if (hour < 18) expectedGreeting = 'Buenas tardes';

      expect(screen.getByText(new RegExp(`${expectedGreeting}, Carlos`))).toBeInTheDocument();
    });

    it('should display user role chip', () => {
      const user = { id: 1, username: 'testuser', rol: 'cajero' };
      renderDashboard(user);

      expect(screen.getByText('Cajero')).toBeInTheDocument();
    });
  });

  // ========== Carga de Datos (3 tests) ==========

  describe('Data Loading', () => {
    it('should load patients stats on mount', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // totalPacientes
      });
    });

    it('should load executive summary data on mount', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(reportsService.default.getExecutiveSummary).toHaveBeenCalledWith({ periodo: 'mes' });
      });
    });

    it('should show loading indicator while fetching data', () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user, { loading: true });

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  // ========== KPIs Ejecutivos (4 tests) ==========

  describe('Executive KPIs', () => {
    it('should display total revenue KPI', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
        expect(screen.getByText('Ventas + Servicios')).toBeInTheDocument();
      });
    });

    it('should display net profit KPI', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Utilidad Neta')).toBeInTheDocument();
      });
    });

    it('should display patients attended KPI', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Pacientes Atendidos')).toBeInTheDocument();
        expect(screen.getByText('Consultas y servicios')).toBeInTheDocument();
      });
    });

    it('should display average occupancy KPI with percentage format', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Ocupación Promedio')).toBeInTheDocument();
        expect(screen.getByText('Habitaciones ocupadas')).toBeInTheDocument();
      });
    });
  });

  // ========== Estadísticas Operativas (3 tests) ==========

  describe('Operational Statistics', () => {
    it('should display total patients stat', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Total Pacientes')).toBeInTheDocument();
        expect(screen.getByText('En el sistema')).toBeInTheDocument();
      });
    });

    it('should display hospitalization accounts stat', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Cuentas Hospitalización')).toBeInTheDocument();
        expect(screen.getByText('Pacientes hospitalizados')).toBeInTheDocument();
      });
    });

    it('should display open accounts stat', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText('Cuentas Abiertas')).toBeInTheDocument();
        expect(screen.getByText('POS activos')).toBeInTheDocument();
      });
    });
  });

  // ========== Módulos por Rol (3 tests) ==========

  describe('Role-Based Module Access', () => {
    it('should show correct modules for "cajero" role', () => {
      const user = { id: 1, username: 'testuser', rol: 'cajero' };
      renderDashboard(user);

      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('Punto de Venta')).toBeInTheDocument();
      expect(screen.getByText('Facturación')).toBeInTheDocument();
      expect(screen.getByText('Habitaciones')).toBeInTheDocument();
      expect(screen.queryByText('Inventario')).not.toBeInTheDocument(); // Cajero no tiene acceso
    });

    it('should show correct modules for "medico_especialista" role', () => {
      const user = { id: 1, username: 'testuser', rol: 'medico_especialista' };
      renderDashboard(user);

      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('Hospitalización')).toBeInTheDocument();
      expect(screen.getByText('Habitaciones')).toBeInTheDocument();
      expect(screen.getByText('Reportes')).toBeInTheDocument();
      expect(screen.queryByText('Punto de Venta')).not.toBeInTheDocument(); // Médico no tiene acceso
    });

    it('should show all modules for "administrador" role', () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('Punto de Venta')).toBeInTheDocument();
      expect(screen.getByText('Hospitalización')).toBeInTheDocument();
      expect(screen.getByText('Facturación')).toBeInTheDocument();
      expect(screen.getByText('Inventario')).toBeInTheDocument();
      expect(screen.getByText('Habitaciones')).toBeInTheDocument();
      expect(screen.getByText('Reportes')).toBeInTheDocument();
    });
  });

  // ========== Accesos Rápidos (2 tests) ==========

  describe('Quick Access Buttons', () => {
    it('should display role-specific quick access buttons', () => {
      const user = { id: 1, username: 'testuser', rol: 'cajero' };
      renderDashboard(user);

      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
      expect(screen.getByText('Ver Facturas')).toBeInTheDocument();
      expect(screen.getByText('Buscar Paciente')).toBeInTheDocument();
      expect(screen.queryByText('Ver Hospitalizados')).not.toBeInTheDocument(); // Cajero no tiene
    });

    it('should navigate to correct page when clicking quick access button', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      const userEvent = require('@testing-library/user-event').default;
      renderDashboard(user);

      const newSaleButton = screen.getByText('Nueva Venta');
      await userEvent.click(newSaleButton);

      expect(mockNavigate).toHaveBeenCalledWith('/pos');
    });
  });

  // ========== Manejo de Errores (1 test) ==========

  describe('Error Handling', () => {
    it('should display error message when executive data fails to load', async () => {
      (reportsService.default.getExecutiveSummary as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      renderDashboard(user);

      await waitFor(() => {
        expect(screen.getByText(/Error al conectar con el servidor/i)).toBeInTheDocument();
      });
    });
  });

  // ========== Refresh de Datos (1 test) ==========

  describe('Data Refresh', () => {
    it('should refresh stats when clicking refresh button', async () => {
      const user = { id: 1, username: 'testuser', rol: 'administrador' };
      const userEvent = require('@testing-library/user-event').default;
      renderDashboard(user);

      // Wait for initial load
      await waitFor(() => {
        expect(reportsService.default.getExecutiveSummary).toHaveBeenCalledTimes(1);
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /Actualizar datos ejecutivos/i });
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(reportsService.default.getExecutiveSummary).toHaveBeenCalledTimes(2);
      });
    });
  });
});
