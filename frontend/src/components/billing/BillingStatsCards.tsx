// ABOUTME: Tarjetas de estadísticas para el módulo de Facturación
// ABOUTME: Usa StatCard unificado del Design System para consistencia visual
import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  PendingActions as PendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { BillingStats } from '@/types/billing.types';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';

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
    <Box sx={{ position: 'relative' }}>
      {/* Botón de refresh */}
      <Box sx={{ position: 'absolute', top: -8, right: 0, zIndex: 1 }}>
        <Tooltip title="Refrescar estadísticas">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <StatCardsGrid>
        <StatCard
          title="Total Facturado"
          value={stats?.totalFacturado || 0}
          subtitle="Monto total facturado"
          icon={<InvoiceIcon />}
          color="primary"
          format="currency"
          trend={stats?.crecimientoMensual !== undefined && stats.crecimientoMensual !== 0 ? {
            value: Math.abs(stats.crecimientoMensual),
            direction: stats.crecimientoMensual >= 0 ? 'up' : 'down',
            label: 'vs mes anterior'
          } : undefined}
        />
        <StatCard
          title="Total Cobrado"
          value={stats?.totalCobrado || 0}
          subtitle={`${cobranzaRate.toFixed(1)}% de cobranza`}
          icon={<PaymentIcon />}
          color="success"
          format="currency"
        />
        <StatCard
          title="Saldo Pendiente"
          value={saldoPendiente}
          subtitle={`${stats?.facturasPendientes || 0} facturas pendientes`}
          icon={<PendingIcon />}
          color="warning"
          format="currency"
        />
        <StatCard
          title="Promedio/Factura"
          value={stats?.promedioFactura || 0}
          subtitle="Valor promedio por factura"
          icon={<InvoiceIcon />}
          color="info"
          format="currency"
        />
      </StatCardsGrid>
    </Box>
  );
};

export default BillingStatsCards;
