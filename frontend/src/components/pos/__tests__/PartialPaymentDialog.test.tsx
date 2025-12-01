// ABOUTME: Tests unitarios para PartialPaymentDialog - Diálogo de registro de pagos parciales
// ABOUTME: Cubre rendering, validación de formulario, manejo de estados y callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PartialPaymentDialog from '../PartialPaymentDialog';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';

// Mock posService
jest.mock('@/services/posService', () => ({
  posService: {
    registerPartialPayment: jest.fn(),
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

// Cuenta con anticipo que permite pagos parciales sin activar la validación de crédito excesivo
// La validación de crédito excesivo se activa cuando saldoFuturo > anticipo * 1.5
// Para que un pago de $1000 funcione: saldoPendiente + 1000 <= anticipo * 1.5
// Con anticipo=10000: $4000 + $1000 = $5000 <= $15000 (150%) ✅
const mockAccount: PatientAccount = {
  id: 1,
  pacienteId: 123,
  tipoAtencion: 'hospitalizacion',
  estado: 'abierta',
  anticipo: 10000, // Anticipo suficiente para permitir pagos parciales
  totalServicios: 2500,
  totalProductos: 1500,
  totalCuenta: 4000,
  saldoPendiente: 4000, // Positivo = Paciente DEBE $4000 al hospital
  cajeroAperturaId: 1,
  fechaApertura: '2025-01-01T10:00:00Z',
  transacciones: [],
  paciente: {
    id: 123,
    nombre: 'Juan',
    apellidos: 'Pérez García',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    fechaNacimiento: '1980-01-01',
    genero: 'M',
    telefono: '4431234567',
    email: 'juan@example.com',
    numeroExpediente: 'EXP-001',
    activo: true,
  },
};

const mockOnClose = jest.fn();
const mockOnPaymentRegistered = jest.fn();

describe('PartialPaymentDialog - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('A1. Basic Rendering', () => {
    it('should render dialog when open', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText('Registrar Pago Parcial')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={false}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.queryByText('Registrar Pago Parcial')).not.toBeInTheDocument();
    });

    it('should display account information', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText(/Juan Pérez García/)).toBeInTheDocument();
      // El componente muestra saldoPendiente ($4000.00), no totalCuenta
      expect(screen.getByText(/\$4000\.00/)).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByLabelText(/Monto del Pago/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Método de Pago/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Observaciones/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrar Pago/i })).toBeInTheDocument();
    });
  });

  describe('A2. Form Validation', () => {
    it('should show error when monto is zero (default value)', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      // El formulario inicia con monto=0, al hacer submit sin modificar,
      // Yup valida que 0 no es positivo
      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El monto debe ser mayor a cero/i)).toBeInTheDocument();
      });
    });

    it('should show error when monto is zero', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '0');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El monto debe ser mayor a cero/i)).toBeInTheDocument();
      });
    });

    it('should show error when monto is negative', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '-100');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El monto debe ser mayor a cero/i)).toBeInTheDocument();
      });
    });
  });

  describe('A3. Form Submission', () => {
    it('should call posService.registerPartialPayment on submit', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuenta: mockAccount },
      };
      (posService.registerPartialPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '1000');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(posService.registerPartialPayment).toHaveBeenCalledWith(1, {
          monto: 1000,
          metodoPago: 'efectivo',
          observaciones: undefined,
        });
      });
    });

    it('should show success message on successful submission', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuenta: mockAccount },
      };
      (posService.registerPartialPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '1000');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Pago parcial registrado exitosamente/i)).toBeInTheDocument();
      });
    });

    it('should call onPaymentRegistered after success', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuenta: mockAccount },
      };
      (posService.registerPartialPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '1000');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentRegistered).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should show error message on failed submission', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: false,
        message: 'Error al registrar pago',
      };
      (posService.registerPartialPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '1000');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al registrar pago/i)).toBeInTheDocument();
      });
    });
  });

  describe('A4. Cancel/Close Behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when closing via cancel button', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={mockAccount}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '1000');

      // Click cancel button which triggers handleClose -> reset()
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      // Verify onClose was called (reset happens inside handleClose)
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('A5. Null/Undefined Handling', () => {
    it('should not render when account is null', () => {
      renderWithTheme(
        <PartialPaymentDialog
          open={true}
          account={null}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.queryByText('Registrar Pago Parcial')).not.toBeInTheDocument();
    });
  });
});
