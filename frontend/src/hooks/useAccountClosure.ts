// ABOUTME: Custom hook para gestión de cierre de cuentas POS
// ABOUTME: Centraliza cálculos, validaciones y estado del diálogo de cierre

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import posService from '@/services/posService';
import { useAuth } from '@/hooks/useAuth';

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

interface AccountDetails {
  transacciones?: any[];
  pagos?: any[];
  paciente?: any;
  [key: string]: any;
}

interface BalanceTotals {
  totalServices: number;
  totalProducts: number;
  totalAdvances: number;
  totalPartialPayments: number;
  totalCharges: number;
  finalBalance: number;
}

interface UseAccountClosureProps {
  open: boolean;
  account: any | null;
  onSuccess: () => void;
  onClose: () => void;
}

export interface UseAccountClosureReturn {
  // Auth
  user: any;
  isAdmin: boolean;

  // Estado principal
  loading: boolean;
  processingPayment: boolean;
  accountDetails: AccountDetails | null;

  // Pagos
  paymentMethod: PaymentMethod;
  amountReceived: string;
  cashAmount: string;
  cardAmount: string;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountReceived: (amount: string) => void;
  setCashAmount: (amount: string) => void;
  setCardAmount: (amount: string) => void;
  handlePaymentMethodChange: (method: PaymentMethod) => void;
  handleQuickAmount: (amount: number) => void;

  // CPC (Cuenta Por Cobrar)
  authorizeCPC: boolean;
  motivoCPC: string;
  setAuthorizeCPC: (value: boolean) => void;
  setMotivoCPC: (value: string) => void;

  // Totales
  totals: BalanceTotals;
  changeAmount: number;
  isRefund: boolean;

  // Diálogo de éxito
  showSuccessDialog: boolean;
  transactionData: any;
  setShowSuccessDialog: (show: boolean) => void;
  handleSuccessDialogClose: () => void;

  // Acciones
  handleCloseAccount: () => Promise<void>;
  validatePayment: () => boolean;
}

export const useAccountClosure = ({
  open,
  account,
  onSuccess,
  onClose
}: UseAccountClosureProps): UseAccountClosureReturn => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('administrador');

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

  // Estados de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  // Estados CPC
  const [authorizeCPC, setAuthorizeCPC] = useState(false);
  const [motivoCPC, setMotivoCPC] = useState('');

  // Diálogo de éxito
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // Totales calculados
  const [totals, setTotals] = useState<BalanceTotals>({
    totalServices: 0,
    totalProducts: 0,
    totalAdvances: 0,
    totalPartialPayments: 0,
    totalCharges: 0,
    finalBalance: 0
  });
  const [changeAmount, setChangeAmount] = useState(0);

  const isRefund = totals.finalBalance > 0;

  // Cargar detalles de cuenta
  const loadAccountDetails = useCallback(async () => {
    if (!account?.id) return;

    setLoading(true);
    try {
      const response = await posService.getPatientAccountById(account.id);
      if (response.success && response.data) {
        setAccountDetails(response.data.account);
      }
    } catch (error) {
      toast.error('Error al cargar detalles de la cuenta');
    } finally {
      setLoading(false);
    }
  }, [account?.id]);

  useEffect(() => {
    if (open && account?.id) {
      loadAccountDetails();
    }
  }, [open, account?.id, loadAccountDetails]);

  // Calcular balance
  const calculateBalance = useCallback(() => {
    if (!accountDetails?.transacciones) return;

    let services = 0;
    let products = 0;
    let advances = 0;
    let partialPayments = 0;

    accountDetails.transacciones.forEach((t: any) => {
      const amount = parseFloat(t.subtotal || t.precioUnitario || 0);
      switch (t.tipo) {
        case 'servicio':
          services += amount;
          break;
        case 'producto':
          products += amount;
          break;
        case 'anticipo':
          advances += amount;
          break;
      }
    });

    if (accountDetails.pagos && Array.isArray(accountDetails.pagos)) {
      accountDetails.pagos.forEach((p: any) => {
        if (p.tipoPago === 'parcial') {
          partialPayments += parseFloat(p.monto || 0);
        }
      });
    }

    const charges = services + products;
    const balance = (advances + partialPayments) - charges;

    setTotals({
      totalServices: services,
      totalProducts: products,
      totalAdvances: advances,
      totalPartialPayments: partialPayments,
      totalCharges: charges,
      finalBalance: balance
    });

    if (balance > 0) {
      setAmountReceived('0');
    }
  }, [accountDetails]);

  useEffect(() => {
    if (accountDetails?.transacciones) {
      calculateBalance();
    }
  }, [accountDetails, calculateBalance]);

  // Calcular cambio
  const calculateChange = useCallback(() => {
    let totalReceived = 0;

    if (paymentMethod === 'mixto') {
      totalReceived = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
    } else {
      totalReceived = parseFloat(amountReceived || '0');
    }

    const change = totals.finalBalance < 0
      ? totalReceived - Math.abs(totals.finalBalance)
      : 0;
    setChangeAmount(Math.max(0, change));
  }, [amountReceived, cashAmount, cardAmount, paymentMethod, totals.finalBalance]);

  useEffect(() => {
    calculateChange();
  }, [calculateChange]);

  // Handlers
  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    setAmountReceived('');
    setCashAmount('');
    setCardAmount('');
  }, []);

  const handleQuickAmount = useCallback((amount: number) => {
    if (paymentMethod === 'mixto') {
      setCashAmount(amount.toString());
    } else {
      setAmountReceived(amount.toString());
    }
  }, [paymentMethod]);

  const validatePayment = useCallback((): boolean => {
    if (totals.finalBalance < 0) {
      const deuda = Math.abs(totals.finalBalance);

      if (authorizeCPC) {
        if (!isAdmin) {
          toast.error('Solo administradores pueden autorizar cuentas por cobrar');
          return false;
        }
        if (!motivoCPC.trim()) {
          toast.error('Debe proporcionar un motivo para autorizar la cuenta por cobrar');
          return false;
        }
        return true;
      }

      let totalReceived = 0;
      if (paymentMethod === 'mixto') {
        totalReceived = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
      } else {
        totalReceived = parseFloat(amountReceived || '0');
      }

      if (totalReceived < deuda) {
        toast.error(`Monto insuficiente. El paciente debe $${deuda.toFixed(2)}. ${isAdmin ? 'O autorice cuenta por cobrar.' : ''}`);
        return false;
      }
    }

    return true;
  }, [totals.finalBalance, authorizeCPC, isAdmin, motivoCPC, paymentMethod, cashAmount, cardAmount, amountReceived]);

  const handleCloseAccount = useCallback(async () => {
    if (!validatePayment()) return;

    setProcessingPayment(true);
    try {
      let finalAmount = 0;
      if (paymentMethod === 'mixto') {
        finalAmount = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
      } else {
        finalAmount = parseFloat(amountReceived || '0');
      }

      const closeData: any = { metodoPago: paymentMethod };

      if (totals.finalBalance < 0 && !authorizeCPC) {
        closeData.montoPagado = finalAmount;
      }

      if (authorizeCPC && totals.finalBalance < 0) {
        closeData.cuentaPorCobrar = true;
        closeData.motivoCuentaPorCobrar = motivoCPC;
      }

      const response = await posService.closeAccount(account.id, closeData);

      if (response.success) {
        let tipoTransaccion: 'cobro' | 'devolucion' | 'cpc' = 'cobro';
        if (authorizeCPC) {
          tipoTransaccion = 'cpc';
        } else if (totals.finalBalance > 0) {
          tipoTransaccion = 'devolucion';
        }

        const patient = account.paciente || accountDetails?.paciente;
        const transactionInfo = {
          paciente: {
            nombre: patient?.nombre || '',
            apellidoPaterno: patient?.apellidoPaterno || '',
            apellidoMaterno: patient?.apellidoMaterno || '',
            telefono: patient?.telefono,
            email: patient?.email,
            direccion: patient?.direccion
          },
          cuentaId: account.id,
          totalCargos: totals.totalCharges,
          totalAdeudado: Math.abs(totals.finalBalance),
          montoRecibido: finalAmount,
          cambio: changeAmount,
          metodoPago: paymentMethod,
          cajero: user?.nombre ? `${user.nombre} ${user.apellidos || ''}` : 'Sistema',
          fecha: new Date(),
          tipoTransaccion,
          motivoCPC: authorizeCPC ? motivoCPC : undefined,
          tipoAtencion: account.tipoAtencion || 'consulta_general',
          fechaIngreso: account.fechaApertura || new Date().toISOString(),
          medicoTratante: account.medicoTratante ? {
            nombre: account.medicoTratante.nombre,
            apellidoPaterno: account.medicoTratante.apellidoPaterno,
            especialidad: account.medicoTratante.especialidad
          } : undefined,
          transacciones: accountDetails?.transacciones || [],
          totales: {
            anticipo: totals.totalAdvances,
            totalServicios: totals.totalServices,
            totalProductos: totals.totalProducts,
            totalCuenta: totals.totalCharges,
            saldoPendiente: totals.finalBalance
          }
        };

        setTransactionData(transactionInfo);
        setShowSuccessDialog(true);
      } else {
        toast.error(response.message || 'Error al cerrar la cuenta');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Error al procesar el cierre de cuenta';
      toast.error(errorMessage, { autoClose: 5000, closeButton: true });
    } finally {
      setProcessingPayment(false);
    }
  }, [
    validatePayment, paymentMethod, cashAmount, cardAmount, amountReceived,
    totals, authorizeCPC, motivoCPC, account, accountDetails, user, changeAmount
  ]);

  const handleSuccessDialogClose = useCallback(() => {
    setShowSuccessDialog(false);
    setTransactionData(null);
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  return {
    user,
    isAdmin,
    loading,
    processingPayment,
    accountDetails,
    paymentMethod,
    amountReceived,
    cashAmount,
    cardAmount,
    setPaymentMethod,
    setAmountReceived,
    setCashAmount,
    setCardAmount,
    handlePaymentMethodChange,
    handleQuickAmount,
    authorizeCPC,
    motivoCPC,
    setAuthorizeCPC,
    setMotivoCPC,
    totals,
    changeAmount,
    isRefund,
    showSuccessDialog,
    transactionData,
    setShowSuccessDialog,
    handleSuccessDialogClose,
    handleCloseAccount,
    validatePayment
  };
};

export default useAccountClosure;
