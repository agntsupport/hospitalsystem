import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Assessment as StatsIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import { BillingStats } from '@/types/billing.types';
import { billingService } from '@/services/billingService';

interface BillingStatsTabProps {
  stats: BillingStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const BillingStatsTab: React.FC<BillingStatsTabProps> = ({
  stats,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando estadísticas...</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Alert severity="error">
        No se pudieron cargar las estadísticas de facturación
      </Alert>
    );
  }

  const cobranzaRate = stats.totalFacturado > 0 
    ? (stats.totalCobrado / stats.totalFacturado) * 100 
    : 0;

  const saldoPendiente = stats.totalFacturado - stats.totalCobrado;

  return (
    <Box>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <StatsIcon color="primary" />
        Estadísticas de Facturación
      </Typography>

      <Grid container spacing={3}>
        {/* Métricas Principales */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Métricas Principales
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Facturado</Typography>
                    <Typography 
                      variant="h5" 
                      color="primary.main" 
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {billingService.formatCurrency(stats.totalFacturado)}
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      +{stats.crecimientoMensual.toFixed(1)}% mensual
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Cobrado</Typography>
                    <Typography 
                      variant="h5" 
                      color="success.main" 
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {billingService.formatCurrency(stats.totalCobrado)}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {cobranzaRate.toFixed(1)}% de cobranza
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Saldo Pendiente</Typography>
                    <Typography 
                      variant="h5" 
                      color="warning.main" 
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {billingService.formatCurrency(saldoPendiente)}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      {stats.facturasPendientes} facturas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Promedio/Factura</Typography>
                    <Typography 
                      variant="h5" 
                      color="info.main" 
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {billingService.formatCurrency(stats.promedioFactura)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tendencias Mensuales */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" />
                Tendencias por Mes
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell align="center">Facturas</TableCell>
                      <TableCell align="right">Monto Total</TableCell>
                      <TableCell align="right">Promedio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.facturasPorMes.map((mes) => (
                      <TableRow key={mes.mes}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(mes.mes + '-01').toLocaleDateString('es-MX', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {mes.facturas}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary.main">
                            {billingService.formatCurrency(mes.monto)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {billingService.formatCurrency(mes.facturas > 0 ? mes.monto / mes.facturas : 0)}
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

        {/* Top Pacientes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Top Pacientes
              </Typography>
              
              <Box sx={{ space: 'y-2' }}>
                {stats.topPacientes.map((paciente, index) => (
                  <Box key={paciente.paciente.id} sx={{ 
                    p: 2, 
                    bgcolor: index === 0 ? 'primary.50' : 'grey.50', 
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          #{index + 1} {paciente.paciente.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {paciente.paciente.numeroExpediente}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold" 
                          color="primary.main"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {billingService.formatCurrency(paciente.totalFacturado)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {paciente.facturas} facturas
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BillingStatsTab;