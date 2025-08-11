import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  PendingActions as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { BillingStats } from '@/types/billing.types';
import { billingService } from '@/services/billingService';

interface BillingStatsCardsProps {
  stats: BillingStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const BillingStatsCards: React.FC<BillingStatsCardsProps> = ({
  stats,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Cargando...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No se pudieron cargar las estadísticas
          </Typography>
          <IconButton onClick={onRefresh} sx={{ mt: 1 }}>
            <RefreshIcon />
          </IconButton>
        </CardContent>
      </Card>
    );
  }

  const cobranzaRate = (stats?.totalFacturado || 0) > 0 
    ? ((stats?.totalCobrado || 0) / (stats?.totalFacturado || 0)) * 100 
    : 0;

  const saldoPendiente = (stats?.totalFacturado || 0) - (stats?.totalCobrado || 0);

  return (
    <Grid container spacing={3}>
      {/* Total Facturado */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Total Facturado
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {billingService.formatCurrency(stats?.totalFacturado || 0)}
              </Typography>
              <Typography variant="caption">
                Monto total facturado en el período. Crecimiento: {(stats?.crecimientoMensual || 0).toFixed(1)}% mensual
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
                cursor: 'help'
              }
            }}
          >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Total Facturado
                </Typography>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color="primary"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {billingService.formatCurrency(stats?.totalFacturado || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon 
                    color={(stats?.crecimientoMensual || 0) >= 0 ? 'success' : 'error'} 
                    fontSize="small" 
                  />
                  <Typography 
                    variant="body2" 
                    color={(stats?.crecimientoMensual || 0) >= 0 ? 'success.main' : 'error.main'}
                    sx={{ 
                      ml: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {(stats?.crecimientoMensual || 0) >= 0 ? '+' : ''}{(stats?.crecimientoMensual || 0).toFixed(1)}% mensual
                  </Typography>
                </Box>
              </Box>
              <InvoiceIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
        </Tooltip>
      </Grid>

      {/* Total Cobrado */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Total Cobrado
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {billingService.formatCurrency(stats?.totalCobrado || 0)}
              </Typography>
              <Typography variant="caption">
                Monto total cobrado. Tasa de cobranza: {cobranzaRate.toFixed(1)}%
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
                cursor: 'help'
              }
            }}
          >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Total Cobrado
                </Typography>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color="success.main"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {billingService.formatCurrency(stats?.totalCobrado || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={`${cobranzaRate.toFixed(1)}% de cobranza`}
                    color={cobranzaRate >= 85 ? 'success' : cobranzaRate >= 70 ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
              <PaymentIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
        </Tooltip>
      </Grid>

      {/* Saldo Pendiente */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Saldo Pendiente
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {billingService.formatCurrency(saldoPendiente)}
              </Typography>
              <Typography variant="caption">
                Facturas pendientes de cobro: {stats?.facturasPendientes || 0}
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
                cursor: 'help'
              }
            }}
          >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Saldo Pendiente
                </Typography>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color="warning.main"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {billingService.formatCurrency(saldoPendiente)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.facturasPendientes || 0} facturas pendientes
                  </Typography>
                </Box>
              </Box>
              <PendingIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
        </Tooltip>
      </Grid>

      {/* Promedio por Factura */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Promedio por Factura
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {billingService.formatCurrency(stats?.promedioFactura || 0)}
              </Typography>
              <Typography variant="caption">
                Valor promedio de cada factura emitida
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
                cursor: 'help'
              }
            }}
          >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Promedio/Factura
                </Typography>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color="info.main"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {billingService.formatCurrency(stats?.promedioFactura || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Tooltip title="Refrescar estadísticas">
                    <IconButton onClick={onRefresh} size="small">
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <InvoiceIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default BillingStatsCards;