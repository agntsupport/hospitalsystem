import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';

import { billingService } from '@/services/billingService';
import { posService } from '@/services/posService';
import { CreateInvoiceRequest, PAYMENT_TERMS } from '@/types/billing.types';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closedAccounts, setClosedAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    cuentaPacienteId: 0,
    fechaVencimiento: '',
    terminosPago: '30 días',
    observaciones: '',
    descuentoGlobal: 0
  });

  const loadClosedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await posService.getPatientAccounts({ estado: 'cerrada' });
      
      if (response.success && response.data) {
        const accountsWithoutInvoice = response.data.accounts.filter(account => !account.facturada);
        setClosedAccounts(accountsWithoutInvoice);
      } else {
        setClosedAccounts([]);
      }
    } catch (err) {
      console.error('Error loading closed accounts:', err);
      setClosedAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadClosedAccounts();
      setFormData({
        cuentaPacienteId: 0,
        fechaVencimiento: '',
        terminosPago: '30 días',
        observaciones: '',
        descuentoGlobal: 0
      });
      setSelectedAccount(null);
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    setFormData({
      cuentaPacienteId: 0,
      fechaVencimiento: '',
      terminosPago: '30 días',
      observaciones: '',
      descuentoGlobal: 0
    });
    setSelectedAccount(null);
    setError(null);
    onClose();
  };

  const handleAccountSelect = (accountId: number) => {
    const account = closedAccounts.find(acc => acc.id === accountId);
    setSelectedAccount(account);
    setFormData(prev => ({
      ...prev,
      cuentaPacienteId: accountId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      setError('Debe seleccionar una cuenta POS');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validar datos
      const validation = billingService.validateInvoiceData(formData);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      const response = await billingService.createInvoice(formData);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Error al crear factura');
      }
    } catch (err: any) {
      setError('Error al crear factura');
      console.error('Error creating invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof CreateInvoiceRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDueDate = (terms: string) => {
    const today = new Date();
    const days = PAYMENT_TERMS.find(t => t.label === terms)?.days || 30;
    today.setDate(today.getDate() + days);
    return today.toISOString().split('T')[0];
  };

  const handleTermsChange = (terms: string) => {
    handleFieldChange('terminosPago', terms);
    if (!formData.fechaVencimiento) {
      handleFieldChange('fechaVencimiento', calculateDueDate(terms));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InvoiceIcon color="primary" />
        Crear Nueva Factura
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Selección de Cuenta POS */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Seleccionar Cuenta POS
              </Typography>

              {loadingAccounts ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>Cargando cuentas cerradas...</Typography>
                </Box>
              ) : closedAccounts.length === 0 ? (
                <Alert severity="info">
                  No hay cuentas POS cerradas disponibles para facturar
                </Alert>
              ) : (
                <FormControl fullWidth required>
                  <InputLabel>Cuenta POS</InputLabel>
                  <Select
                    value={formData.cuentaPacienteId}
                    label="Cuenta POS"
                    onChange={(e) => handleAccountSelect(Number(e.target.value))}
                  >
                    {closedAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        #{account.id} - {account.paciente.nombre} {account.paciente.apellidoPaterno} 
                        ({billingService.formatCurrency(account.total)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Detalles de la cuenta seleccionada */}
              {selectedAccount && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountIcon fontSize="small" />
                      Cuenta #{selectedAccount.id}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Paciente:</Typography>
                        <Typography variant="body1">
                          {selectedAccount.paciente.nombre} {selectedAccount.paciente.apellidoPaterno}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                        <Typography variant="body1">
                          {billingService.formatDate(selectedAccount.fechaCierre)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total:</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {billingService.formatCurrency(selectedAccount.total)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Transacciones ({selectedAccount.transacciones?.length || 0})
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Concepto</TableCell>
                            <TableCell align="center">Cant.</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedAccount.transacciones || []).slice(0, 3).map((trans: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2">{trans.concepto}</Typography>
                                <Chip label={trans.tipo} size="small" />
                              </TableCell>
                              <TableCell align="center">{trans.cantidad}</TableCell>
                              <TableCell align="right">
                                {billingService.formatCurrency(trans.subtotal)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(selectedAccount.transacciones || []).length > 3 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                <Typography variant="caption" color="text.secondary">
                                  ... y {selectedAccount.transacciones.length - 3} transacciones más
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Datos de la Factura */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Datos de la Factura
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Términos de Pago</InputLabel>
                    <Select
                      value={formData.terminosPago}
                      label="Términos de Pago"
                      onChange={(e) => handleTermsChange(e.target.value)}
                    >
                      {PAYMENT_TERMS.map((term) => (
                        <MenuItem key={term.value} value={term.label}>
                          {term.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento"
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => handleFieldChange('fechaVencimiento', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Dejar vacío para calcular automáticamente según términos de pago"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descuento Global (%)"
                    type="number"
                    value={formData.descuentoGlobal}
                    onChange={(e) => handleFieldChange('descuentoGlobal', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    helperText="Descuento adicional sobre el total de la cuenta"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => handleFieldChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales para la factura..."
                  />
                </Grid>
              </Grid>

              {/* Resumen de totales */}
              {selectedAccount && (
                <Card sx={{ mt: 2, bgcolor: 'primary.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Resumen de Facturación
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">
                          {billingService.formatCurrency(selectedAccount.total)}
                        </Typography>
                      </Grid>
                      {formData.descuentoGlobal > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2">Descuento ({formData.descuentoGlobal}%):</Typography>
                          </Grid>
                          <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="success.main">
                              -{billingService.formatCurrency(selectedAccount.total * formData.descuentoGlobal / 100)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="body2">IVA (16%):</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">
                          {billingService.formatCurrency(
                            (selectedAccount.total * (1 - formData.descuentoGlobal / 100)) * 0.16
                          )}
                        </Typography>
                      </Grid>
                      <Divider sx={{ width: '100%', my: 1 }} />
                      <Grid item xs={6}>
                        <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                          {billingService.formatCurrency(
                            (selectedAccount.total * (1 - formData.descuentoGlobal / 100)) * 1.16
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !selectedAccount}
            startIcon={<InvoiceIcon />}
          >
            {loading ? 'Creando...' : 'Crear Factura'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateInvoiceDialog;