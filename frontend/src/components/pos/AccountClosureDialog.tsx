// ABOUTME: Componente de diálogo para cierre de cuentas POS
// ABOUTME: Maneja cobro final, devoluciones y cuentas por cobrar

import React, { memo } from 'react';
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
  InputAdornment,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  MonetizationOn as MoneyIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  AttachMoney as AttachMoneyIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import useAccountClosure from '@/hooks/useAccountClosure';
import PaymentSuccessDialog from './PaymentSuccessDialog';

interface AccountClosureDialogProps {
  open: boolean;
  onClose: () => void;
  account: any;
  onSuccess: () => void;
}

const AccountClosureDialog: React.FC<AccountClosureDialogProps> = ({
  open,
  onClose,
  account,
  onSuccess
}) => {
  const {
    isAdmin,
    loading,
    processingPayment,
    accountDetails,
    paymentMethod,
    amountReceived,
    cashAmount,
    cardAmount,
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
    handleSuccessDialogClose,
    handleCloseAccount
  } = useAccountClosure({ open, account, onSuccess, onClose });

  if (!account) return null;

  const patient = account.paciente || accountDetails?.paciente;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon color="primary" />
              <Typography variant="h6">Cobro Final - Cierre de Cuenta</Typography>
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

            {/* Loading */}
            {loading && (
              <Grid item xs={12} textAlign="center">
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Cargando detalles de la cuenta...
                </Typography>
              </Grid>
            )}

            {/* Tabla de Transacciones */}
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
                              color={trans.tipo === 'anticipo' ? 'success' : trans.tipo === 'servicio' ? 'primary' : 'default'}
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
                              <Typography>${parseFloat(trans.subtotal || 0).toFixed(2)}</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Tabla de Pagos Parciales */}
            {!loading && accountDetails?.pagos?.some((p: any) => p.tipoPago === 'parcial') && (
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
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>
                              <Chip label={pago.metodoPago} size="small" color="primary" variant="outlined" />
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
                      <Typography variant="body2" color="text.secondary">Total Servicios:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2">${totals.totalServices.toFixed(2)}</Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Productos:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2">${totals.totalProducts.toFixed(2)}</Typography>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">Subtotal Cargos:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2" fontWeight="bold">${totals.totalCharges.toFixed(2)}</Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">Anticipo Aplicado:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        -${totals.totalAdvances.toFixed(2)}
                      </Typography>
                    </Grid>

                    {totals.totalPartialPayments > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="success.main" fontWeight="bold">Pagos Parciales:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            -${totals.totalPartialPayments.toFixed(2)}
                          </Typography>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={6}>
                      <Typography
                        variant="h6"
                        color={isRefund ? 'success.main' : totals.finalBalance < 0 ? 'error.main' : 'primary'}
                      >
                        {isRefund ? 'Devolver al Paciente:' : totals.finalBalance < 0 ? 'Total a Cobrar:' : 'Saldo:'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography
                        variant="h6"
                        color={isRefund ? 'success.main' : totals.finalBalance < 0 ? 'error.main' : 'primary'}
                      >
                        ${Math.abs(totals.finalBalance).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Sección CPC para Administradores */}
            {!loading && totals.finalBalance < 0 && isAdmin && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    El paciente debe: ${Math.abs(totals.finalBalance).toFixed(2)}
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

            {/* Mensaje para cajeros */}
            {!loading && totals.finalBalance < 0 && !isAdmin && (
              <Grid item xs={12}>
                <Alert severity="error" icon={<WarningIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    El paciente debe: ${Math.abs(totals.finalBalance).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    Debe recibir el pago completo o solicitar autorización de un administrador para cuenta por cobrar.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Sección de Pago */}
            {!loading && totals.finalBalance < 0 && !authorizeCPC && (
              <>
                <Grid item xs={12}>
                  <Divider><Chip label="FORMA DE PAGO" size="small" /></Divider>
                </Grid>

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

                {paymentMethod === 'mixto' ? (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Monto en Efectivo"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        type="number"
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Monto en Tarjeta"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                        type="number"
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
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
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      sx={{ '& input': { fontSize: '1.5rem', fontWeight: 'bold' } }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                    {[20, 50, 100, 200, 500, 1000].map(amount => (
                      <Button key={amount} variant="outlined" size="small" onClick={() => handleQuickAmount(amount)}>
                        ${amount}
                      </Button>
                    ))}
                    <Button
                      variant="outlined"
                      size="small"
                      color="success"
                      onClick={() => handleQuickAmount(Math.abs(totals.finalBalance))}
                    >
                      Exacto (${Math.abs(totals.finalBalance).toFixed(2)})
                    </Button>
                  </Box>
                </Grid>

                {changeAmount > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<AttachMoneyIcon />}>
                      <Typography variant="h6">Cambio: ${changeAmount.toFixed(2)}</Typography>
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
                    Devolver al paciente: ${Math.abs(totals.finalBalance).toFixed(2)}
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
          <Button onClick={onClose} disabled={processingPayment}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCloseAccount}
            disabled={processingPayment || loading}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <CheckIcon />}
            color={authorizeCPC ? 'warning' : totals.finalBalance > 0 ? 'success' : 'primary'}
          >
            {processingPayment ? 'Procesando...' :
             authorizeCPC ? 'Autorizar CPC y Cerrar Cuenta' :
             totals.finalBalance > 0 ? 'Procesar Devolución y Cerrar' :
             totals.finalBalance < 0 ? 'Cobrar y Cerrar Cuenta' :
             'Cerrar Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default memo(AccountClosureDialog);
