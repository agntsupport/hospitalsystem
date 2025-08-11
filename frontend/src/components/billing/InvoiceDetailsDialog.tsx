import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

import { Invoice, INVOICE_STATUSES } from '@/types/billing.types';
import { billingService } from '@/services/billingService';

interface InvoiceDetailsDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

const InvoiceDetailsDialog: React.FC<InvoiceDetailsDialogProps> = ({
  open,
  invoice,
  onClose
}) => {
  if (!invoice) return null;

  const getStatusColor = () => {
    return billingService.getInvoiceStatusColor(invoice.estado);
  };

  const isOverdue = () => {
    return billingService.isInvoiceOverdue(invoice);
  };

  const getPaymentProgress = () => {
    return billingService.getPaymentProgress(invoice);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InvoiceIcon color="primary" />
        Detalles de Factura - {invoice.folio}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información Principal */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InvoiceIcon fontSize="small" />
                  Información General
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Folio:</Typography>
                    <Typography variant="body1" fontWeight="medium">{invoice.folio}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Estado:</Typography>
                    <Chip
                      label={INVOICE_STATUSES[invoice.estado]}
                      color={getStatusColor()}
                      size="small"
                    />
                    {isOverdue() && (
                      <Chip label="Vencida" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Fecha Emisión:</Typography>
                    <Typography variant="body1">{billingService.formatDate(invoice.fechaEmision)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Fecha Vencimiento:</Typography>
                    <Typography 
                      variant="body1"
                      color={isOverdue() ? 'error' : 'text.primary'}
                    >
                      {billingService.formatDate(invoice.fechaVencimiento)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Términos de Pago:</Typography>
                    <Typography variant="body1">{invoice.terminosPago}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Creado por:</Typography>
                    <Typography variant="body1">{invoice.creadoPor.nombre}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Información del Paciente */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  Información del Paciente
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.paciente.nombre} {invoice.paciente.apellidoPaterno} {invoice.paciente.apellidoMaterno}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Expediente:</Typography>
                    <Typography variant="body1">{invoice.paciente.numeroExpediente}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Totales */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen Financiero
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="h6">{billingService.formatCurrency(invoice.subtotal)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Descuento</Typography>
                      <Typography variant="h6" color="success.main">
                        -{billingService.formatCurrency(invoice.descuento)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Impuestos</Typography>
                      <Typography variant="h6" color="info.main">
                        {billingService.formatCurrency(invoice.impuestos)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {billingService.formatCurrency(invoice.total)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total Pagado</Typography>
                      <Typography variant="h6" color="success.main">
                        {billingService.formatCurrency(invoice.total - invoice.saldoPendiente)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getPaymentProgress()}% completado
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Saldo Pendiente</Typography>
                      <Typography variant="h6" color="warning.main">
                        {billingService.formatCurrency(invoice.saldoPendiente)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Conceptos Facturados */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conceptos Facturados ({invoice.conceptos.length})
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Concepto</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Descuento</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.conceptos.map((concepto) => (
                        <TableRow key={concepto.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {concepto.concepto}
                              </Typography>
                              <Chip 
                                label={concepto.tipo} 
                                size="small" 
                                color={
                                  concepto.tipo === 'servicio' ? 'primary' :
                                  concepto.tipo === 'producto' ? 'success' : 'info'
                                }
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {concepto.descripcion || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{concepto.cantidad}</TableCell>
                          <TableCell align="right">
                            {billingService.formatCurrency(concepto.precioUnitario)}
                          </TableCell>
                          <TableCell align="right">
                            {concepto.descuento > 0 ? (
                              <Typography color="success.main">
                                -{billingService.formatCurrency(concepto.descuento)}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              {billingService.formatCurrency(concepto.subtotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Historial de Pagos */}
          {invoice.pagos.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon fontSize="small" />
                    Historial de Pagos ({invoice.pagos.length})
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Folio</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Método</TableCell>
                          <TableCell align="right">Monto</TableCell>
                          <TableCell>Registrado por</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.pagos.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>{pago.folioPago}</TableCell>
                            <TableCell>{billingService.formatDate(pago.fechaPago)}</TableCell>
                            <TableCell>
                              <Chip
                                label={pago.metodoPago}
                                color={billingService.getPaymentMethodColor(pago.metodoPago)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium" color="success.main">
                                {billingService.formatCurrency(pago.monto)}
                              </Typography>
                            </TableCell>
                            <TableCell>{pago.registradoPor.nombre}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Observaciones */}
          {invoice.observaciones && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Observaciones
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {invoice.observaciones}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDetailsDialog;