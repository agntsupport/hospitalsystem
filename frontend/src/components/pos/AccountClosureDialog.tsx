import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as CartIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import posService from '@/services/posService';
import { useAuth } from '@/hooks/useAuth';
import PaymentSuccessDialog from './PaymentSuccessDialog';

interface AccountClosureDialogProps {
  open: boolean;
  onClose: () => void;
  account: any;
  onSuccess: () => void;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

const AccountClosureDialog: React.FC<AccountClosureDialogProps> = ({
  open,
  onClose,
  account,
  onSuccess
}) => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('administrador');

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);

  // Estados para CPC (Cuenta Por Cobrar)
  const [authorizeCPC, setAuthorizeCPC] = useState(false);
  const [motivoCPC, setMotivoCPC] = useState('');

  // Estados para el diálogo de resumen de transacción
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // Cálculos de saldo
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [totalPartialPayments, setTotalPartialPayments] = useState(0);
  const [totalCharges, setTotalCharges] = useState(0);
  const [finalBalance, setFinalBalance] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  // Cargar detalles completos de la cuenta cuando se abre el diálogo
  useEffect(() => {
    if (open && account?.id) {
      loadAccountDetails();
    }
  }, [open, account?.id]);

  const loadAccountDetails = async () => {
    if (!account?.id) return;

    setLoading(true);
    try {
      const response = await posService.getPatientAccountById(account.id);
      if (response.success && response.data) {
        setAccountDetails(response.data.account);
      }
    } catch (error) {
      console.error('Error loading account details:', error);
      toast.error('Error al cargar detalles de la cuenta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountDetails && accountDetails.transacciones) {
      calculateBalance();
    }
  }, [accountDetails]);

  useEffect(() => {
    calculateChange();
  }, [amountReceived, cashAmount, cardAmount, paymentMethod, finalBalance]);

  const calculateBalance = () => {
    if (!accountDetails || !accountDetails.transacciones) return;

    let services = 0;
    let products = 0;
    let advances = 0;
    let partialPayments = 0;

    // Calcular totales de transacciones
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

    // Calcular pagos parciales si existen
    if (accountDetails.pagos && Array.isArray(accountDetails.pagos)) {
      accountDetails.pagos.forEach((p: any) => {
        if (p.tipoPago === 'parcial') {
          partialPayments += parseFloat(p.monto || 0);
        }
      });
    }

    const charges = services + products;
    const balance = (advances + partialPayments) - charges; // Positivo = devolver, Negativo = cobrar

    setTotalServices(services);
    setTotalProducts(products);
    setTotalAdvances(advances);
    setTotalPartialPayments(partialPayments);
    setTotalCharges(charges);
    setFinalBalance(balance);

    // Si hay saldo a devolver, no requiere pago adicional
    if (balance > 0) {
      setAmountReceived('0');
    }
  };

  const calculateChange = () => {
    let totalReceived = 0;

    if (paymentMethod === 'mixto') {
      totalReceived = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
    } else {
      totalReceived = parseFloat(amountReceived || '0');
    }

    // Calcular cambio correctamente:
    // Si finalBalance es negativo (debe dinero), Math.abs lo convierte a positivo
    // Si finalBalance es positivo (devolver dinero), no hay cambio porque no se recibe pago
    const change = finalBalance < 0 ? totalReceived - Math.abs(finalBalance) : 0;
    setChangeAmount(Math.max(0, change));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Limpiar montos al cambiar método
    setAmountReceived('');
    setCashAmount('');
    setCardAmount('');
  };

  const validatePayment = () => {
    // Si hay deuda (saldo negativo)
    if (finalBalance < 0) {
      const deuda = Math.abs(finalBalance);

      // Si se autoriza CPC, validar motivo
      if (authorizeCPC) {
        if (!isAdmin) {
          toast.error('Solo administradores pueden autorizar cuentas por cobrar');
          return false;
        }
        if (!motivoCPC.trim()) {
          toast.error('Debe proporcionar un motivo para autorizar la cuenta por cobrar');
          return false;
        }
        // CPC autorizado correctamente, no requiere pago
        return true;
      }

      // Si NO se autoriza CPC, validar que se haya ingresado pago
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

    // Si hay saldo a favor del paciente (positivo), no requiere validación de pago
    if (finalBalance > 0) {
      return true;
    }

    // Saldo = 0, todo correcto
    return true;
  };

  const handleCloseAccount = async () => {
    if (!validatePayment()) {
      return;
    }

    setProcessingPayment(true);
    try {
      // Calcular monto total recibido
      let finalAmount = 0;
      if (paymentMethod === 'mixto') {
        finalAmount = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
      } else {
        finalAmount = parseFloat(amountReceived || '0');
      }

      // Preparar datos de cierre
      const closeData: any = {
        metodoPago: paymentMethod
      };

      // Solo agregar montoPagado si hay deuda y se está pagando (no CPC)
      if (finalBalance < 0 && !authorizeCPC) {
        closeData.montoPagado = finalAmount;
      }

      // Agregar datos de CPC si está autorizado
      if (authorizeCPC && finalBalance < 0) {
        closeData.cuentaPorCobrar = true;
        closeData.motivoCuentaPorCobrar = motivoCPC;
      }

      const response = await posService.closeAccount(account.id, closeData);

      if (response.success) {
        // Determinar tipo de transacción
        let tipoTransaccion: 'cobro' | 'devolucion' | 'cpc' = 'cobro';
        if (authorizeCPC) {
          tipoTransaccion = 'cpc';
        } else if (finalBalance > 0) {
          tipoTransaccion = 'devolucion';
        }

        // Preparar datos de la transacción para el resumen
        const transactionInfo = {
          paciente: {
            nombre: patient?.nombre || '',
            apellidoPaterno: patient?.apellidoPaterno || '',
            apellidoMaterno: patient?.apellidoMaterno || ''
          },
          cuentaId: account.id,
          totalCargos: totalCharges,
          totalAdeudado: Math.abs(finalBalance),
          montoRecibido: finalAmount,
          cambio: changeAmount,
          metodoPago: paymentMethod,
          cajero: user?.nombre ? `${user.nombre} ${user.apellidos || ''}` : 'Sistema',
          fecha: new Date(),
          tipoTransaccion,
          motivoCPC: authorizeCPC ? motivoCPC : undefined
        };

        // Guardar datos y mostrar diálogo de resumen
        setTransactionData(transactionInfo);
        setShowSuccessDialog(true);
      } else {
        toast.error(response.message || 'Error al cerrar la cuenta');
      }
    } catch (error: any) {
      // El interceptor de axios transforma los errores a ApiError (sin .response)
      // ApiError = { success: false, message: string, error: string, status?: number }
      console.error('=== ERROR AL CERRAR CUENTA ===');
      console.error('Error completo:', error);
      console.error('Error.message:', error?.message);
      console.error('Error.error:', error?.error);
      console.error('Error.status:', error?.status);

      // Extraer mensaje del formato ApiError
      const errorMessage = error?.message
        || error?.error
        || 'Error al procesar el cierre de cuenta';

      console.error('Mensaje extraído:', errorMessage);

      toast.error(errorMessage, {
        autoClose: 5000,
        closeButton: true
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    if (paymentMethod === 'mixto') {
      // En modo mixto, agregar al efectivo
      setCashAmount(amount.toString());
    } else {
      setAmountReceived(amount.toString());
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setTransactionData(null);
    onSuccess(); // Actualizar lista de cuentas
    onClose(); // Cerrar diálogo principal
  };

  if (!account) {
    return null;
  }

  // Usar accountDetails - esperamos que esté cargado antes de mostrar contenido
  const patient = account.paciente || accountDetails?.paciente;
  const isRefund = finalBalance > 0;

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <MoneyIcon color="primary" />
            <Typography variant="h6">
              Cobro Final - Cierre de Cuenta
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información del Paciente */}
          <Grid item xs={12}>
            <Alert severity="info" icon={<HospitalIcon />}>
              <Typography variant="subtitle2">
                <strong>Paciente:</strong> {patient?.nombre} {patient?.apellidoPaterno} {patient?.apellidoMaterno}
              </Typography>
              <Typography variant="caption">
                Cuenta #{account.id} • {account.tipoAtencion === 'hospitalizacion' ? 'Hospitalización' : 'Consulta'}
                {account.habitacion && ` • Habitación ${account.habitacion.numero}`}
              </Typography>
            </Alert>
          </Grid>

          {/* Loading indicator */}
          {loading && (
            <Grid item xs={12} textAlign="center">
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Cargando detalles de la cuenta...
              </Typography>
            </Grid>
          )}

          {/* Detalle de Transacciones */}
          {!loading && accountDetails?.transacciones && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Detalle de Cargos
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">P. Unitario</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accountDetails.transacciones.map((trans: any) => (
                      <TableRow key={trans.id}>
                        <TableCell>{trans.concepto}</TableCell>
                        <TableCell>
                          <Chip
                            label={trans.tipo}
                            size="small"
                            color={
                              trans.tipo === 'anticipo' ? 'success' :
                              trans.tipo === 'servicio' ? 'primary' : 'default'
                            }
                            variant={trans.tipo === 'anticipo' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">{trans.cantidad || 1}</TableCell>
                        <TableCell align="right">
                          ${parseFloat(trans.precioUnitario || trans.subtotal || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {trans.tipo === 'anticipo' ? (
                            <Typography color="success.main" fontWeight="bold">
                              +${parseFloat(trans.subtotal || 0).toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography>
                              ${parseFloat(trans.subtotal || 0).toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Detalle de Pagos Parciales */}
          {!loading && accountDetails?.pagos && accountDetails.pagos.some((p: any) => p.tipoPago === 'parcial') && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Pagos Parciales Realizados
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell>Cajero</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accountDetails.pagos
                      .filter((pago: any) => pago.tipoPago === 'parcial')
                      .map((pago: any) => (
                        <TableRow key={pago.id}>
                          <TableCell>
                            {new Date(pago.fechaPago).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pago.metodoPago}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {pago.empleado ? `${pago.empleado.nombre} ${pago.empleado.apellidos}` : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="success.main" fontWeight="bold">
                              +${parseFloat(pago.monto || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Resumen de Totales */}
          {!loading && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Servicios:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    ${totalServices.toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Productos:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    ${totalProducts.toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Subtotal Cargos:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" fontWeight="bold">
                    ${totalCharges.toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Anticipo Aplicado:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    -${totalAdvances.toFixed(2)}
                  </Typography>
                </Grid>

                {totalPartialPayments > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Pagos Parciales:
                      </Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        -${totalPartialPayments.toFixed(2)}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6" color={isRefund ? 'success.main' : finalBalance < 0 ? 'error.main' : 'primary'}>
                    {isRefund ? 'Devolver al Paciente:' : finalBalance < 0 ? 'Total a Cobrar:' : 'Saldo:'}
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="h6" color={isRefund ? 'success.main' : finalBalance < 0 ? 'error.main' : 'primary'}>
                    ${Math.abs(finalBalance).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          )}

          {/* Sección CPC - Cuenta Por Cobrar (solo administradores, solo si hay deuda) */}
          {!loading && finalBalance < 0 && isAdmin && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  El paciente debe: ${Math.abs(finalBalance).toFixed(2)}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={authorizeCPC}
                      onChange={(e) => setAuthorizeCPC(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Autorizar Cuenta Por Cobrar (CPC)"
                />
                {authorizeCPC && (
                  <Box mt={2}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Motivo de autorización CPC"
                      value={motivoCPC}
                      onChange={(e) => setMotivoCPC(e.target.value)}
                      placeholder="Ej: Paciente sin recursos, autorización médica especial, etc."
                      required
                      error={authorizeCPC && !motivoCPC.trim()}
                      helperText={authorizeCPC && !motivoCPC.trim() ? 'El motivo es requerido' : ''}
                    />
                  </Box>
                )}
              </Alert>
            </Grid>
          )}

          {/* Mensaje informativo para cajeros cuando hay deuda */}
          {!loading && finalBalance < 0 && !isAdmin && (
            <Grid item xs={12}>
              <Alert severity="error" icon={<WarningIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  El paciente debe: ${Math.abs(finalBalance).toFixed(2)}
                </Typography>
                <Typography variant="body2" mt={1}>
                  Debe recibir el pago completo o solicitar autorización de un administrador para cuenta por cobrar.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Sección de Pago (solo si hay deuda y NO está autorizado CPC) */}
          {!loading && finalBalance < 0 && !authorizeCPC && (
            <>
              <Grid item xs={12}>
                <Divider>
                  <Chip label="FORMA DE PAGO" size="small" />
                </Divider>
              </Grid>

              {/* Selector de Método de Pago */}
              <Grid item xs={12}>
                <Box display="flex" gap={1} justifyContent="center">
                  <Button
                    variant={paymentMethod === 'efectivo' ? 'contained' : 'outlined'}
                    onClick={() => handlePaymentMethodChange('efectivo')}
                    startIcon={<AttachMoneyIcon />}
                  >
                    Efectivo
                  </Button>
                  <Button
                    variant={paymentMethod === 'tarjeta' ? 'contained' : 'outlined'}
                    onClick={() => handlePaymentMethodChange('tarjeta')}
                    startIcon={<CardIcon />}
                  >
                    Tarjeta
                  </Button>
                  <Button
                    variant={paymentMethod === 'transferencia' ? 'contained' : 'outlined'}
                    onClick={() => handlePaymentMethodChange('transferencia')}
                    startIcon={<BankIcon />}
                  >
                    Transferencia
                  </Button>
                  <Button
                    variant={paymentMethod === 'mixto' ? 'contained' : 'outlined'}
                    onClick={() => handlePaymentMethodChange('mixto')}
                  >
                    Mixto
                  </Button>
                </Box>
              </Grid>

              {/* Campos de Pago */}
              {paymentMethod === 'mixto' ? (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Monto en Efectivo"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Monto en Tarjeta"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Monto Recibido"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    type="number"
                    size="medium"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{ 
                      '& input': { 
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Grid>
              )}

              {/* Botones de Montos Rápidos */}
              <Grid item xs={12}>
                <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                  {[20, 50, 100, 200, 500, 1000].map(amount => (
                    <Button
                      key={amount}
                      variant="outlined"
                      size="small"
                      onClick={() => handleQuickAmount(amount)}
                    >
                      ${amount}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    onClick={() => handleQuickAmount(Math.abs(finalBalance))}
                  >
                    Exacto (${Math.abs(finalBalance).toFixed(2)})
                  </Button>
                </Box>
              </Grid>

              {/* Mostrar Cambio */}
              {changeAmount > 0 && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<AttachMoneyIcon />}>
                    <Typography variant="h6">
                      Cambio: ${changeAmount.toFixed(2)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </>
          )}

          {/* Mensaje de Devolución */}
          {!loading && isRefund && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<AttachMoneyIcon />}>
                <Typography variant="h6">
                  Devolver al paciente: ${Math.abs(finalBalance).toFixed(2)}
                </Typography>
                <Typography variant="caption">
                  El anticipo excede los cargos totales. Proceda con la devolución.
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={processingPayment}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleCloseAccount}
          disabled={processingPayment || loading}
          startIcon={processingPayment ? <CircularProgress size={20} /> : <CheckIcon />}
          color={authorizeCPC ? 'warning' : finalBalance > 0 ? 'success' : 'primary'}
        >
          {processingPayment ? 'Procesando...' :
           authorizeCPC ? 'Autorizar CPC y Cerrar Cuenta' :
           finalBalance > 0 ? 'Procesar Devolución y Cerrar' :
           finalBalance < 0 ? 'Cobrar y Cerrar Cuenta' :
           'Cerrar Cuenta'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Diálogo de resumen de transacción exitosa */}
    {showSuccessDialog && transactionData && (
      <PaymentSuccessDialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        transactionData={transactionData}
      />
    )}
    </>
  );
};

export default AccountClosureDialog;