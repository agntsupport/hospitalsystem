// ABOUTME: Tests unitarios para CPCPaymentDialog - Diálogo de pagos contra cuentas por cobrar
// ABOUTME: Cubre validación dinámica, límites de monto, y actualización de estado CPC

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CPCPaymentDialog from '../CPCPaymentDialog';
import { posService } from '@/services/posService';
import { CuentaPorCobrar } from '@/types/pos.types';

// Mock posService
jest.mock('@/services/posService', () => ({
  posService: {
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

const mockCPC: CuentaPorCobrar = {
  id: 1,
  cuentaPacienteId: 123,
  montoOriginal: 5000,
  saldoPendiente: 3000,
  montoPagado: 2000,
  estado: 'pagado_parcial',
  autorizadoPorId: 1,
  motivoAutorizacion: 'Paciente sin recursos',
  fechaCreacion: '2025-01-01T10:00:00Z',
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

describe('CPCPaymentDialog - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('A1. Basic Rendering', () => {
    it('should render dialog when open', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText('Registrar Pago contra CPC')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={false}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.queryByText('Registrar Pago contra CPC')).not.toBeInTheDocument();
    });

    it('should display CPC information', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText(/Juan Pérez García/)).toBeInTheDocument();
      expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument(); // monto original
      expect(screen.getByText(/\$2,000\.00/)).toBeInTheDocument(); // monto pagado
      expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument(); // saldo pendiente
    });

    it('should display percentage paid', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      // (2000 / 5000) * 100 = 40%
      expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByLabelText(/Monto del Pago/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Método de Pago/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Observaciones/)).toBeInTheDocument();
    });

    it('should show maximum amount in helper text', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText(/Máximo: \$3,000\.00/)).toBeInTheDocument();
    });
  });

  describe('A2. Form Validation', () => {
    it('should show error when monto exceeds saldo pendiente', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '4000'); // Más del saldo pendiente (3000)

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El monto no puede ser mayor al saldo pendiente/i)).toBeInTheDocument();
      });
    });

    it('should show error when monto is zero', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
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

    it('should allow monto equal to saldo pendiente', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuentaPorCobrar: { ...mockCPC, estado: 'pagado_total' } },
      };
      (posService.registerCPCPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const montoInput = screen.getByLabelText(/Monto del Pago/);
      await user.clear(montoInput);
      await user.type(montoInput, '3000'); // Exactamente el saldo pendiente

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      // No debería mostrar error de validación
      await waitFor(() => {
        expect(posService.registerCPCPayment).toHaveBeenCalled();
      });
    });
  });

  describe('A3. Form Submission', () => {
    it('should call posService.registerCPCPayment on submit', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuentaPorCobrar: mockCPC },
      };
      (posService.registerCPCPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
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
        expect(posService.registerCPCPayment).toHaveBeenCalledWith(1, {
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
        data: { pago: {}, cuentaPorCobrar: mockCPC },
      };
      (posService.registerCPCPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
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
        expect(screen.getByText(/Pago registrado exitosamente/i)).toBeInTheDocument();
      });
    });

    it('should call onPaymentRegistered after success', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: { pago: {}, cuentaPorCobrar: mockCPC },
      };
      (posService.registerCPCPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
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
      (posService.registerCPCPayment as jest.Mock).mockResolvedValue(mockResponse);

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
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
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={mockCPC}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('A5. Null/Undefined Handling', () => {
    it('should not render when cuentaPorCobrar is null', () => {
      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={null}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.queryByText('Registrar Pago contra CPC')).not.toBeInTheDocument();
    });
  });

  describe('A6. Edge Cases', () => {
    it('should calculate percentage correctly with decimals', () => {
      const cpcWithDecimals: CuentaPorCobrar = {
        ...mockCPC,
        montoOriginal: 5555.55,
        montoPagado: 2222.22,
        saldoPendiente: 3333.33,
      };

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={cpcWithDecimals}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      // (2222.22 / 5555.55) * 100 ≈ 40.0%
      expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
    });

    it('should handle 100% paid scenario', () => {
      const cpcFullyPaid: CuentaPorCobrar = {
        ...mockCPC,
        montoOriginal: 5000,
        montoPagado: 5000,
        saldoPendiente: 0,
        estado: 'pagado_total',
      };

      renderWithTheme(
        <CPCPaymentDialog
          open={true}
          cuentaPorCobrar={cpcFullyPaid}
          onClose={mockOnClose}
          onPaymentRegistered={mockOnPaymentRegistered}
        />
      );

      expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument(); // saldo pendiente
    });
  });
});
