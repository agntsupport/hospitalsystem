// ABOUTME: Diálogo de confirmación de pago exitoso con resumen de transacción e impresión de ticket
// Muestra el resumen completo del cobro realizado y permite imprimir el ticket de compra

import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  Paper,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from './PrintableReceipt';

interface PaymentSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  transactionData: {
    paciente: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    cuentaId: number;
    totalCargos: number;
    totalAdeudado: number;
    montoRecibido: number;
    cambio: number;
    metodoPago: string;
    cajero: string;
    fecha: Date;
    tipoTransaccion: 'cobro' | 'devolucion' | 'cpc';
    motivoCPC?: string;
  };
}

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onClose,
  transactionData
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Ticket_Cuenta_${transactionData.cuentaId}_${new Date().getTime()}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `
  });

  const getPaymentMethodIcon = () => {
    switch (transactionData.metodoPago) {
      case 'efectivo':
        return <MoneyIcon />;
      case 'tarjeta':
        return <CardIcon />;
      case 'transferencia':
        return <CardIcon />;
      case 'mixto':
        return <CardIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getTransactionTypeColor = () => {
    switch (transactionData.tipoTransaccion) {
      case 'cobro':
        return 'success';
      case 'devolucion':
        return 'warning';
      case 'cpc':
        return 'info';
      default:
        return 'success';
    }
  };

  const getTransactionTypeText = () => {
    switch (transactionData.tipoTransaccion) {
      case 'cobro':
        return 'Pago Recibido Exitosamente';
      case 'devolucion':
        return 'Devolución Procesada';
      case 'cpc':
        return 'Cuenta Por Cobrar Autorizada';
      default:
        return 'Transacción Exitosa';
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <SuccessIcon color={getTransactionTypeColor()} sx={{ fontSize: 32 }} />
              <Typography variant="h6" color={`${getTransactionTypeColor()}.main`}>
                {getTransactionTypeText()}
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
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    PACIENTE
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {transactionData.paciente.nombre} {transactionData.paciente.apellidoPaterno} {transactionData.paciente.apellidoMaterno}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cuenta #{transactionData.cuentaId}
                </Typography>
              </Paper>
            </Grid>

            {/* Resumen Financiero */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  RESUMEN DE TRANSACCIÓN
                </Typography>
                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    Total Cargos:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${transactionData.totalCargos.toFixed(2)}
                  </Typography>
                </Box>

                {transactionData.tipoTransaccion === 'cobro' && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="error.main">
                        Total Adeudado:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        ${transactionData.totalAdeudado.toFixed(2)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1" fontWeight="bold">
                        Monto Recibido:
                      </Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        ${transactionData.montoRecibido.toFixed(2)}
                      </Typography>
                    </Box>

                    {transactionData.cambio > 0 && (
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Typography variant="h6" color="primary.main">
                          CAMBIO:
                        </Typography>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                          ${transactionData.cambio.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {transactionData.tipoTransaccion === 'devolucion' && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="h6" color="warning.main">
                      DEVOLVER AL PACIENTE:
                    </Typography>
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      ${Math.abs(transactionData.totalAdeudado).toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {transactionData.tipoTransaccion === 'cpc' && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="h6" color="info.main">
                        SALDO POR COBRAR:
                      </Typography>
                      <Typography variant="h5" color="info.main" fontWeight="bold">
                        ${Math.abs(transactionData.totalAdeudado).toFixed(2)}
                      </Typography>
                    </Box>
                    {transactionData.motivoCPC && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="caption" display="block">
                          <strong>Motivo CPC:</strong>
                        </Typography>
                        <Typography variant="body2">
                          {transactionData.motivoCPC}
                        </Typography>
                      </Alert>
                    )}
                  </>
                )}
              </Paper>
            </Grid>

            {/* Detalles de Pago */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getPaymentMethodIcon()}
                    <Typography variant="body2" color="text.secondary">
                      Forma de Pago:
                    </Typography>
                  </Box>
                  <Chip
                    label={transactionData.metodoPago.toUpperCase()}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Fecha y Hora:
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(transactionData.fecha).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Cajero:
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {transactionData.cajero}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Mensaje de éxito */}
            <Grid item xs={12}>
              <Alert severity={getTransactionTypeColor()} icon={<SuccessIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  {transactionData.tipoTransaccion === 'cobro' && 'La cuenta ha sido cerrada exitosamente. El pago ha sido registrado en el sistema.'}
                  {transactionData.tipoTransaccion === 'devolucion' && 'La devolución ha sido procesada. Entregue el monto indicado al paciente.'}
                  {transactionData.tipoTransaccion === 'cpc' && 'La cuenta por cobrar ha sido autorizada y registrada en el sistema.'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            size="large"
          >
            Imprimir Ticket
          </Button>
          <Button
            variant="contained"
            onClick={onClose}
            size="large"
            color={getTransactionTypeColor()}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Componente de ticket imprimible (oculto) */}
      <div style={{ display: 'none' }}>
        <PrintableReceipt
          ref={receiptRef}
          transactionData={transactionData}
        />
      </div>
    </>
  );
};

export default PaymentSuccessDialog;
