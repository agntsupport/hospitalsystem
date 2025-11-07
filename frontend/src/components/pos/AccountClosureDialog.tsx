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
  CircularProgress
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
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import posService from '@/services/posService';

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
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  
  // Cálculos de saldo
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [totalCharges, setTotalCharges] = useState(0);
  const [finalBalance, setFinalBalance] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  useEffect(() => {
    if (account && account.transacciones) {
      calculateBalance();
    }
  }, [account]);

  useEffect(() => {
    calculateChange();
  }, [amountReceived, cashAmount, cardAmount, paymentMethod, finalBalance]);

  const calculateBalance = () => {
    let services = 0;
    let products = 0;
    let advances = 0;

    account.transacciones.forEach((t: any) => {
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

    const charges = services + products;
    const balance = charges - advances; // Positivo = cobrar, Negativo = devolver

    setTotalServices(services);
    setTotalProducts(products);
    setTotalAdvances(advances);
    setTotalCharges(charges);
    setFinalBalance(balance);

    // Si hay saldo a devolver, preestablecerlo
    if (balance < 0) {
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

    const change = totalReceived - Math.max(0, finalBalance);
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
    if (finalBalance > 0) {
      // Hay saldo a cobrar
      if (paymentMethod === 'mixto') {
        const totalReceived = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
        if (totalReceived < finalBalance) {
          toast.error(`Monto insuficiente. Faltan $${(finalBalance - totalReceived).toFixed(2)}`);
          return false;
        }
      } else {
        const received = parseFloat(amountReceived || '0');
        if (received < finalBalance) {
          toast.error(`Monto insuficiente. Faltan $${(finalBalance - received).toFixed(2)}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleCloseAccount = async () => {
    if (!validatePayment()) {
      return;
    }

    setProcessingPayment(true);
    try {
      let finalAmount = 0;
      if (paymentMethod === 'mixto') {
        finalAmount = parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');
      } else {
        finalAmount = parseFloat(amountReceived || '0');
      }

      const response = await posService.closeAccount(account.id, {
        montoRecibido: finalBalance > 0 ? finalAmount : 0,
        metodoPago: paymentMethod
      });

      if (response.success) {
        toast.success('Cuenta cerrada exitosamente');

        // Si hay cambio, mostrarlo
        if (changeAmount > 0) {
          toast.info(`Cambio a entregar: $${changeAmount.toFixed(2)}`, {
            autoClose: 10000,
            closeButton: true
          });
        }

        // Si hay devolución (saldo negativo)
        if (finalBalance < 0) {
          toast.warning(`Devolver al paciente: $${Math.abs(finalBalance).toFixed(2)}`, {
            autoClose: 10000,
            closeButton: true
          });
        }

        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Error al cerrar la cuenta');
      }
    } catch (error: any) {
      console.error('Error completo:', error);

      // Intentar extraer el mensaje de error del backend
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Error al procesar el cierre de cuenta';

      // Si hay una acción requerida, mostrarla también
      const requiredAction = error?.response?.data?.requiredAction;

      toast.error(errorMessage, {
        autoClose: requiredAction ? false : 5000,
        closeButton: true
      });

      if (requiredAction) {
        toast.warning(requiredAction, {
          autoClose: false,
          closeButton: true
        });
      }
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

  if (!account) return null;

  const patient = account.paciente;
  const isRefund = finalBalance < 0;

  return (
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

          {/* Detalle de Transacciones */}
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
                  {account.transacciones.map((trans: any) => (
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

          {/* Resumen de Totales */}
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

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6" color={isRefund ? 'error.main' : 'primary'}>
                    {isRefund ? 'Saldo a Devolver:' : 'Total a Cobrar:'}
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="h6" color={isRefund ? 'error.main' : 'primary'}>
                    ${Math.abs(finalBalance).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Sección de Pago (solo si hay saldo a cobrar) */}
          {finalBalance > 0 && (
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
                    onClick={() => handleQuickAmount(finalBalance)}
                  >
                    Exacto (${finalBalance.toFixed(2)})
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
          {isRefund && (
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
          color={isRefund ? 'warning' : 'primary'}
        >
          {processingPayment ? 'Procesando...' : 
           isRefund ? 'Procesar Devolución' : 'Cobrar y Cerrar Cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountClosureDialog;