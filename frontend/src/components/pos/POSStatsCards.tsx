import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  ShoppingCart as CartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { POSStats } from '@/types/pos.types';

interface POSStatsCardsProps {
  stats: POSStats;
}

const POSStatsCards: React.FC<POSStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number | undefined | null) => {
    const value = amount || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toLocaleString();
  };

  const statsCards = [
    {
      title: 'Cuentas Abiertas',
      value: formatNumber(stats?.cuentasAbiertas),
      icon: <AccountIcon color="primary" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'primary.main',
      description: 'Cuentas activas'
    },
    {
      title: 'Ventas de Hoy',
      value: formatCurrency(stats?.totalVentasHoy),
      icon: <MoneyIcon color="success" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'success.main',
      description: 'Ingresos del día'
    },
    {
      title: 'Ventas del Mes',
      value: formatCurrency(stats?.totalVentasMes),
      icon: <TrendingIcon color="info" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'info.main',
      description: 'Ingresos mensuales'
    },
    {
      title: 'Servicios Vendidos',
      value: formatNumber(stats?.serviciosVendidos),
      icon: <ReceiptIcon color="secondary" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'secondary.main',
      description: 'Servicios facturados'
    },
    {
      title: 'Productos Vendidos',
      value: formatNumber(stats?.productosVendidos),
      icon: <CartIcon color="warning" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'warning.main',
      description: 'Medicamentos/insumos'
    },
    {
      title: 'Saldos a Favor',
      value: formatCurrency(stats?.saldosAFavor),
      icon: <AccountIcon color="success" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'success.main',
      description: 'Crédito de pacientes'
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats?.saldosPorCobrar),
      icon: <WarningIcon color="error" sx={{ fontSize: { xs: 32, sm: 40 } }} />,
      color: 'error.main',
      description: 'Deuda de pacientes'
    },
  ];

  return (
    <Grid container spacing={3}>
      {statsCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption">
                  {card.description}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, overflow: 'hidden' }}>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: card.color,
                      fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem', lg: '1.6rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    color="text.primary"
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3
                    }}
                  >
                    {card.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
};

export default POSStatsCards;