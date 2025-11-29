// ABOUTME: Tarjetas de estadísticas para el dashboard de Cuentas por Cobrar
// ABOUTME: Usa StatCard unificado del Design System para consistencia visual
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';

interface CPCStatsCardsProps {
  stats: {
    totalCPCActivas: number;
    montoPendienteTotal: number;
    montoRecuperadoTotal: number;
    porcentajeRecuperacion: number;
    distribucionPorEstado: {
      pendiente: { cantidad: number; monto: number };
      pagado_parcial: { cantidad: number; monto: number };
      pagado_total: { cantidad: number; monto: number };
      cancelado: { cantidad: number; monto: number };
    };
  };
}

const CPCStatsCards: React.FC<CPCStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number | undefined | null) => {
    const value = amount ?? 0;
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* Estadísticas principales usando StatCard unificado */}
      <StatCardsGrid sx={{ mb: 3 }}>
        <StatCard
          title="CPC Activas"
          value={stats.totalCPCActivas}
          subtitle="Cuentas pendientes de pago"
          icon={<AccountIcon />}
          color="error"
        />
        <StatCard
          title="Monto Pendiente"
          value={stats.montoPendienteTotal}
          subtitle="Total por recuperar"
          icon={<MoneyIcon />}
          color="warning"
          format="currency"
        />
        <StatCard
          title="Monto Recuperado"
          value={stats.montoRecuperadoTotal}
          subtitle="Total cobrado"
          icon={<TrendingIcon />}
          color="success"
          format="currency"
        />
        <StatCard
          title="Tasa de Recuperación"
          value={stats.porcentajeRecuperacion ?? 0}
          subtitle="Porcentaje cobrado"
          icon={<AssessmentIcon />}
          color="info"
          format="percentage"
        />
      </StatCardsGrid>

      {/* Distribución por Estado */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribución por Estado
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} bgcolor="error.light" borderRadius={1}>
                <Typography variant="caption" color="error.dark">
                  Pendiente
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="h6" color="error.dark" fontWeight="bold">
                    {stats.distribucionPorEstado.pendiente.cantidad}
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    {formatCurrency(stats.distribucionPorEstado.pendiente.monto)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} bgcolor="warning.light" borderRadius={1}>
                <Typography variant="caption" color="warning.dark">
                  Pago Parcial
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="h6" color="warning.dark" fontWeight="bold">
                    {stats.distribucionPorEstado.pagado_parcial.cantidad}
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    {formatCurrency(stats.distribucionPorEstado.pagado_parcial.monto)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} bgcolor="success.light" borderRadius={1}>
                <Typography variant="caption" color="success.dark">
                  Pagado Total
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="h6" color="success.dark" fontWeight="bold">
                    {stats.distribucionPorEstado.pagado_total.cantidad}
                  </Typography>
                  <Typography variant="body2" color="success.dark">
                    {formatCurrency(stats.distribucionPorEstado.pagado_total.monto)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} bgcolor="grey.300" borderRadius={1}>
                <Typography variant="caption" color="text.secondary">
                  Cancelado
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="h6" color="text.secondary" fontWeight="bold">
                    {stats.distribucionPorEstado.cancelado.cantidad}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(stats.distribucionPorEstado.cancelado.monto)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default CPCStatsCards;
