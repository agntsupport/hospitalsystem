import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Skeleton,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  ReportFilters,
  FinancialSummary,
  RevenueByPeriod,
  RevenueByService,
  RevenueByPaymentMethod,
  AccountsReceivableReport
} from '@/types/reports.types';
import reportsService from '@/services/reportsService';
import { BarChart, LineChart, DonutChart, MetricCard } from '@/components/reports/ReportChart';

interface FinancialReportsTabProps {
  filters: ReportFilters;
  onError: (error: string | null) => void;
  onLoading: (loading: boolean) => void;
}

const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({
  filters,
  onError,
  onLoading
}) => {
  const [loading, setLoading] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [revenueByPeriod, setRevenueByPeriod] = useState<RevenueByPeriod[]>([]);
  const [revenueByService, setRevenueByService] = useState<RevenueByService[]>([]);
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<RevenueByPaymentMethod[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivableReport | null>(null);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      onLoading(true);
      onError(null);

      // Validar filtros
      const validation = reportsService.validateFilters(filters);
      if (!validation.valid) {
        onError(validation.errors.join(', '));
        return;
      }

      // Cargar todos los datos en paralelo
      const [
        summaryResponse,
        periodResponse,
        serviceResponse,
        paymentMethodResponse,
        accountsResponse
      ] = await Promise.all([
        reportsService.getFinancialSummary(filters),
        reportsService.getRevenueByPeriod(filters),
        reportsService.getRevenueByService(filters),
        reportsService.getRevenueByPaymentMethod(filters),
        reportsService.getAccountsReceivable(filters)
      ]);

      // Procesar respuestas
      if (summaryResponse.success) {
        setFinancialSummary(summaryResponse.data);
      } else {
        console.error('Error en resumen financiero:', summaryResponse.message);
      }

      if (periodResponse.success) {
        setRevenueByPeriod(periodResponse.data?.items || []);
      } else {
        console.error('Error en ingresos por período:', periodResponse.message);
      }

      if (serviceResponse.success) {
        setRevenueByService(serviceResponse.data?.items || []);
      } else {
        console.error('Error en ingresos por servicio:', serviceResponse.message);
      }

      if (paymentMethodResponse.success) {
        setRevenueByPaymentMethod(paymentMethodResponse.data?.items || []);
      } else {
        console.error('Error en ingresos por método de pago:', paymentMethodResponse.message);
      }

      if (accountsResponse.success) {
        setAccountsReceivable(accountsResponse.data);
      } else {
        console.error('Error en cuentas por cobrar:', accountsResponse.message);
      }

    } catch (error: any) {
      console.error('Error al cargar datos financieros:', error);
      onError('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [filters]);

  const renderFinancialSummary = () => {
    if (loading || !financialSummary) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ingresos Totales"
            value={reportsService.formatCurrency(financialSummary.totalIngresos)}
            subtitle={`Período: ${reportsService.formatDateRange(
              financialSummary.periodo.fechaInicio,
              financialSummary.periodo.fechaFin
            )}`}
            trend="up"
            trendValue={financialSummary.crecimientoMensual}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Utilidad Bruta"
            value={reportsService.formatCurrency(financialSummary.utilidadBruta)}
            subtitle={`Margen: ${financialSummary.margenUtilidad.toFixed(1)}%`}
            trend={financialSummary.margenUtilidad > 30 ? 'up' : 'down'}
            trendValue={Math.abs(financialSummary.margenUtilidad - 30)}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Egresos"
            value={reportsService.formatCurrency(financialSummary.totalEgresos)}
            subtitle="Costos operativos"
            icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Crecimiento Mensual"
            value={`${financialSummary.crecimientoMensual.toFixed(1)}%`}
            subtitle="vs mes anterior"
            trend={financialSummary.crecimientoMensual > 0 ? 'up' : 'down'}
            trendValue={Math.abs(financialSummary.crecimientoMensual)}
            icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>
    );
  };

  const renderRevenueCharts = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="rectangular" width="100%" height={300} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="rectangular" width="100%" height={300} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LineChart
            title="Ingresos por Período"
            data={revenueByPeriod
              .filter(item => item && typeof item.ingresos === 'number' && !isNaN(item.ingresos))
              .map(item => ({
                label: item.periodo || 'Sin período',
                value: item.ingresos
              }))}
            height={350}
            showValues={true}
            showLegend={false}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DonutChart
            title="Ingresos por Servicio"
            data={revenueByService
              .filter(item => item && typeof item.ingresos === 'number' && !isNaN(item.ingresos) && item.ingresos > 0)
              .map(item => ({
                label: item.nombreServicio || 'Servicio desconocido',
                value: item.ingresos
              }))}
            height={350}
            innerRadius={0.5}
          />
        </Grid>
      </Grid>
    );
  };

  const renderPaymentMethodChart = () => {
    if (loading || revenueByPaymentMethod.length === 0) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }

    const methodLabels: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      cheque: 'Cheque',
      seguro: 'Seguro'
    };

    return (
      <BarChart
        title="Ingresos por Método de Pago"
        data={revenueByPaymentMethod
          .filter(item => item && typeof item.ingresos === 'number' && !isNaN(item.ingresos) && item.ingresos > 0)
          .map(item => ({
            label: methodLabels[item.metodoPago] || item.metodoPago || 'Método desconocido',
            value: item.ingresos
          }))}
        height={350}
        showValues={true}
      />
    );
  };

  const renderAccountsReceivable = () => {
    if (loading || !accountsReceivable) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item}>
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Cuentas por Cobrar
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {reportsService.formatCurrency(accountsReceivable.totalPendiente)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Pendiente
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {accountsReceivable.facturasPendientes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Facturas Pendientes
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {accountsReceivable.promedioVencimiento.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Días Promedio Vencimiento
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <DonutChart
                title="Antigüedad de Saldos"
                data={[
                  { label: 'Corriente (0-30)', value: accountsReceivable.antiguedadSaldos.corriente },
                  { label: 'Vencido 30-60', value: accountsReceivable.antiguedadSaldos.vencido30 },
                  { label: 'Vencido 60-90', value: accountsReceivable.antiguedadSaldos.vencido60 },
                  { label: 'Vencido +90', value: accountsReceivable.antiguedadSaldos.vencido90 }
                ]}
                height={200}
                showLegend={false}
                innerRadius={0.6}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Top Deudores
          </Typography>
          {accountsReceivable.topDeudores.map((deudor, index) => (
            <Box
              key={deudor.paciente.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                borderRadius: 1
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {deudor.paciente.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deudor.paciente.numeroExpediente} • {deudor.facturasPendientes} factura(s)
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight="bold" color="error.main">
                  {reportsService.formatCurrency(deudor.saldoPendiente)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deudor.diasVencimiento} días vencido
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600,
            mb: 1
          }}
        >
          <TrendingUpIcon color="primary" />
          Reportes Financieros
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis de ingresos, utilidades y cuentas por cobrar
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Resumen Financiero */}
        <Grid item xs={12}>
          {renderFinancialSummary()}
        </Grid>

        {/* Gráficos de Ingresos */}
        <Grid item xs={12}>
          {renderRevenueCharts()}
        </Grid>

        {/* Método de Pago */}
        <Grid item xs={12} md={6}>
          {renderPaymentMethodChart()}
        </Grid>

        {/* Cuentas por Cobrar */}
        <Grid item xs={12} md={6}>
          {renderAccountsReceivable()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialReportsTab;