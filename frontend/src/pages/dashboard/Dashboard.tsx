// ABOUTME: Dashboard principal del sistema con métricas personalizadas por rol de usuario
// ABOUTME: Incluye tabla de ocupación en tiempo real, KPIs ejecutivos, y métricas operativas

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import {
  People,
  LocalHospital,
  TrendingUp,
  Hotel,
  Refresh,
  AttachMoney,
  Business,
  Assignment,
  Inventory,
  ShoppingCart,
  Warning,
  MedicalServices,
  EventNote,
  Notifications,
  LocalShipping,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/utils/constants';
import dashboardService, { DashboardMetrics } from '@/services/dashboardService';
import { OcupacionTable, MetricCard } from '@/components/dashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Estados para métricas del dashboard
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getMetrics();
      if (response.success) {
        setMetrics(response.data);
        setLastUpdate(new Date().toLocaleTimeString('es-MX'));
      } else {
        setError('Error al cargar métricas del dashboard');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardMetrics();

    // Auto-refresh cada 60 segundos
    const interval = setInterval(loadDashboardMetrics, 60000);
    return () => clearInterval(interval);
  }, [loadDashboardMetrics]);

  const refreshStats = useCallback(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Renderizar métricas específicas según el rol
  const renderRoleSpecificMetrics = () => {
    if (!metrics || !user) return null;

    const role = user.rol;

    // Métricas para Administrador y Socio
    if (['administrador', 'socio'].includes(role) && metrics.financiero && metrics.operativo) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" />
            Resumen Ejecutivo - Este Mes
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Ingresos del Mes"
                value={metrics.financiero.ingresosMes}
                icon={<AttachMoney />}
                color="#4caf50"
                format="currency"
                subtitle="Ventas + Servicios"
                trend={metrics.financiero.crecimientoMensual !== 0 ? {
                  value: Math.abs(metrics.financiero.crecimientoMensual),
                  isPositive: metrics.financiero.crecimientoMensual > 0,
                  label: 'vs mes anterior'
                } : undefined}
                tooltipInfo={`Mes anterior: ${dashboardService.formatCurrency(metrics.financiero.ingresosMesAnterior)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cuentas Abiertas"
                value={metrics.financiero.cuentasAbiertas}
                icon={<Assignment />}
                color="#2196f3"
                subtitle="Pacientes activos en POS"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cuentas por Cobrar"
                value={metrics.financiero.cuentasPorCobrar.monto}
                icon={<TrendingUp />}
                color="#ff9800"
                format="currency"
                subtitle={`${metrics.financiero.cuentasPorCobrar.cantidad} cuentas pendientes`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Pacientes Hospitalizados"
                value={metrics.operativo.pacientesHospitalizados}
                icon={<LocalHospital />}
                color="#9c27b0"
                subtitle={`${metrics.operativo.totalPacientes} pacientes totales`}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Recursos del Hospital</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Total Empleados"
                value={metrics.operativo.totalEmpleados}
                icon={<People />}
                color="#1976d2"
                subtitle="Empleados activos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Ocupacion General"
                value={Number(metrics.ocupacion.general.porcentajeOcupacion)}
                icon={<Hotel />}
                color="#00bcd4"
                format="percentage"
                subtitle={`${metrics.ocupacion.general.ocupadosTotal}/${metrics.ocupacion.general.capacidadTotal} espacios ocupados`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Total Pacientes"
                value={metrics.operativo.totalPacientes}
                icon={<People />}
                color="#607d8b"
                subtitle="Registrados en el sistema"
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    // Métricas para Cajero
    if (role === 'cajero' && metrics.cuentasAbiertas !== undefined) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart color="primary" />
            Panel de Cajero - Hoy
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Cuentas Abiertas"
                value={metrics.cuentasAbiertas}
                icon={<Assignment />}
                color="#2196f3"
                subtitle="Pacientes con cuenta activa"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Ventas de Hoy"
                value={metrics.ventasHoy?.monto || 0}
                icon={<AttachMoney />}
                color="#4caf50"
                format="currency"
                subtitle={`${metrics.ventasHoy?.cantidad || 0} transacciones`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Cobros Pendientes"
                value={metrics.cobrosPendientes || 0}
                icon={<Warning />}
                color="#ff9800"
                subtitle="Cuentas con saldo negativo"
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    // Métricas para Enfermero
    if (role === 'enfermero' && metrics.pacientesActivos !== undefined) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalServices color="primary" />
            Panel de Enfermeria
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Pacientes Activos"
                value={metrics.pacientesActivos}
                icon={<LocalHospital />}
                color="#4caf50"
                subtitle="Hospitalizados actualmente"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Solicitudes Pendientes"
                value={metrics.solicitudesPendientes || 0}
                icon={<Inventory />}
                color="#ff9800"
                subtitle="Esperando productos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Notificaciones"
                value={metrics.notificacionesSinLeer || 0}
                icon={<Notifications />}
                color="#f44336"
                subtitle="Sin leer"
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    // Métricas para Almacenista
    if (role === 'almacenista' && metrics.productosStockBajo !== undefined) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="primary" />
            Panel de Almacen
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Stock Bajo"
                value={metrics.productosStockBajo}
                icon={<Warning />}
                color={metrics.productosStockBajo > 0 ? '#f44336' : '#4caf50'}
                subtitle="Productos bajo minimo"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Solicitudes Pendientes"
                value={metrics.solicitudesPendientes || 0}
                icon={<LocalShipping />}
                color="#ff9800"
                subtitle="Por surtir"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Movimientos Hoy"
                value={metrics.movimientosHoy || 0}
                icon={<Assignment />}
                color="#2196f3"
                subtitle="Entradas y salidas"
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    // Métricas para Médicos
    if (['medico_residente', 'medico_especialista'].includes(role) && metrics.pacientesAsignados !== undefined) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalServices color="primary" />
            Panel Medico
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Pacientes Asignados"
                value={metrics.pacientesAsignados}
                icon={<People />}
                color="#4caf50"
                subtitle="Bajo su cuidado"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Cirugias Programadas"
                value={metrics.cirugiasProgramadas || 0}
                icon={<LocalHospital />}
                color="#9c27b0"
                subtitle="Para hoy"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Notas Medicas"
                value={metrics.notasHoy || 0}
                icon={<EventNote />}
                color="#2196f3"
                subtitle="Escritas hoy"
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    return null;
  };

  // Renderizar métricas de ocupación para todos los roles
  const renderOccupancyMetrics = () => {
    if (!metrics) return null;

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Resumen de Ocupacion</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Habitaciones"
              value={metrics.ocupacion.habitaciones.ocupadas}
              icon={<Hotel />}
              color="#1976d2"
              subtitle={`${metrics.ocupacion.habitaciones.disponibles} disponibles de ${metrics.ocupacion.habitaciones.total}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Quirofanos"
              value={metrics.ocupacion.quirofanos.ocupados}
              icon={<LocalHospital />}
              color="#f57c00"
              subtitle={`${metrics.ocupacion.quirofanos.disponibles} disponibles de ${metrics.ocupacion.quirofanos.total}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Consultorios"
              value={metrics.ocupacion.consultorios.ocupados}
              icon={<MedicalServices />}
              color="#388e3c"
              subtitle={`${metrics.ocupacion.consultorios.disponibles} disponibles de ${metrics.ocupacion.consultorios.total}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Ocupacion Total"
              value={Number(metrics.ocupacion.general.porcentajeOcupacion)}
              icon={<Business />}
              color="#7b1fa2"
              format="percentage"
              subtitle={`${metrics.ocupacion.general.ocupadosTotal} de ${metrics.ocupacion.general.capacidadTotal}`}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {getWelcomeMessage()}, {user?.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={user ? ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS] : ''}
                color="primary"
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Sistema de Gestion Hospitalaria
                {lastUpdate && ` - Ultima actualizacion: ${lastUpdate}`}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Actualizar datos">
            <span>
              <IconButton onClick={refreshStats} disabled={loading} aria-label="Actualizar datos del dashboard">
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Métricas específicas del rol */}
      {renderRoleSpecificMetrics()}

      {/* Tabla de Ocupación en Tiempo Real */}
      <OcupacionTable />

      {/* Resumen de ocupación (métricas rápidas) */}
      {renderOccupancyMetrics()}
    </Box>
  );
};

export default Dashboard;
