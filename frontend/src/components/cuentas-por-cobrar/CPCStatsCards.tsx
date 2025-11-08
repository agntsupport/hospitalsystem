// ABOUTME: Tarjetas de estadísticas para el dashboard de Cuentas por Cobrar
// Muestra métricas clave: CPC activas, monto pendiente, recuperado, porcentaje de recuperación
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

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
  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statCards = [
    {
      title: 'CPC Activas',
      value: stats.totalCPCActivas,
      subtitle: 'Cuentas pendientes de pago',
      icon: <AccountIcon fontSize="large" />,
      color: 'error.main',
      bgColor: 'error.light',
    },
    {
      title: 'Monto Pendiente',
      value: formatCurrency(stats.montoPendienteTotal),
      subtitle: 'Total por recuperar',
      icon: <MoneyIcon fontSize="large" />,
      color: 'warning.main',
      bgColor: 'warning.light',
    },
    {
      title: 'Monto Recuperado',
      value: formatCurrency(stats.montoRecuperadoTotal),
      subtitle: 'Total cobrado',
      icon: <TrendingIcon fontSize="large" />,
      color: 'success.main',
      bgColor: 'success.light',
    },
    {
      title: 'Tasa de Recuperación',
      value: `${stats.porcentajeRecuperacion.toFixed(1)}%`,
      subtitle: 'Porcentaje cobrado',
      icon: <AssessmentIcon fontSize="large" />,
      color: 'info.main',
      bgColor: 'info.light',
    },
  ];

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: stat.bgColor,
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
