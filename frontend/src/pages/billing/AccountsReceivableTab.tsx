import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  AccountBalanceWallet as AccountsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { billingService } from '@/services/billingService';
import { AccountsReceivable } from '@/types/billing.types';

interface AccountsReceivableTabProps {
  onDataChange: () => void;
}

const AccountsReceivableTab: React.FC<AccountsReceivableTabProps> = ({ onDataChange }) => {
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccountsReceivable = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await billingService.getAccountsReceivable();
      if (response.success && response.data) {
        setAccountsReceivable(response.data);
      } else {
        setError(response.message || 'Error al cargar cuentas por cobrar');
      }
    } catch (err) {
      setError('Error al cargar cuentas por cobrar');
      console.error('Error loading accounts receivable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsReceivable();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando cuentas por cobrar...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!accountsReceivable) {
    return (
      <Alert severity="info">
        No se pudieron cargar los datos de cuentas por cobrar
      </Alert>
    );
  }

  const cobranzaRate = accountsReceivable.totalFacturado > 0 
    ? (accountsReceivable.totalCobrado / accountsReceivable.totalFacturado) * 100 
    : 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountsIcon color="primary" />
        Cuentas por Cobrar
      </Typography>

      <Grid container spacing={3}>
        {/* Resumen General */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Resumen General
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Facturado:</Typography>
                  <Typography variant="h6" color="primary">
                    {billingService.formatCurrency(accountsReceivable.totalFacturado)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Cobrado:</Typography>
                  <Typography variant="h6" color="success.main">
                    {billingService.formatCurrency(accountsReceivable.totalCobrado)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Saldo Pendiente:</Typography>
                  <Typography variant="h6" color="warning.main">
                    {billingService.formatCurrency(accountsReceivable.saldoPendiente)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tasa de Cobranza:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {cobranzaRate.toFixed(1)}%
                    </Typography>
                    <Chip 
                      label={cobranzaRate >= 85 ? 'Excelente' : cobranzaRate >= 70 ? 'Buena' : 'Requiere Atención'}
                      color={cobranzaRate >= 85 ? 'success' : cobranzaRate >= 70 ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de Facturas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Estado de Facturas
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Facturas Pendientes:</Typography>
                  <Typography variant="h6" color="warning.main">
                    {accountsReceivable.facturasPendientes}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Facturas Vencidas:</Typography>
                  <Typography variant="h6" color="error.main">
                    {accountsReceivable.facturasVencidas}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Promedio de Cobranza:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="h6">
                      {accountsReceivable.promedioCobranza} días
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Antigüedad de Saldos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Antigüedad de Saldos
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Corriente (0-30 días)</Typography>
                    <Typography variant="h6" color="success.main">
                      {billingService.formatCurrency(accountsReceivable.vencimiento.corriente)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">31-60 días</Typography>
                    <Typography variant="h6" color="warning.main">
                      {billingService.formatCurrency(accountsReceivable.vencimiento.vencido30)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">61-90 días</Typography>
                    <Typography variant="h6" color="error.main">
                      {billingService.formatCurrency(accountsReceivable.vencimiento.vencido60)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.100', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Más de 90 días</Typography>
                    <Typography variant="h6" color="error.dark">
                      {billingService.formatCurrency(accountsReceivable.vencimiento.vencido90)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Métodos de Pago */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución por Método de Pago
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Efectivo</Typography>
                    <Typography variant="h6" color="primary.main">
                      {billingService.formatCurrency(accountsReceivable.porMetodoPago.cash)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Tarjeta</Typography>
                    <Typography variant="h6" color="info.main">
                      {billingService.formatCurrency(accountsReceivable.porMetodoPago.card)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Transferencia</Typography>
                    <Typography variant="h6" color="secondary.main">
                      {billingService.formatCurrency(accountsReceivable.porMetodoPago.transfer)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Cheque</Typography>
                    <Typography variant="h6" color="warning.main">
                      {billingService.formatCurrency(accountsReceivable.porMetodoPago.check)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Seguro</Typography>
                    <Typography variant="h6" color="success.main">
                      {billingService.formatCurrency(accountsReceivable.porMetodoPago.insurance)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountsReceivableTab;