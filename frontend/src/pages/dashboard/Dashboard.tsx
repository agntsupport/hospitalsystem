import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Divider,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  People,
  LocalHospital,
  TrendingUp,
  TrendingDown,
  Hotel,
  Refresh,
  AttachMoney,
  Assessment,
  Business,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { fetchPatientsStats } from '@/store/slices/patientsSlice';
import { ROLE_LABELS } from '@/utils/constants';
import reportsService from '@/services/reportsService';
import { OcupacionTable } from '@/components/dashboard';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  format?: 'currency' | 'percentage' | 'number';
}

interface ExecutiveSummary {
  ingresosTotales: number;
  utilidadNeta: number;
  pacientesAtendidos: number;
  ocupacionPromedio: number;
  satisfaccionGeneral: number;
}


const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, subtitle, format = 'number' }) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    const numValue = Number(val) || 0;
    
    switch (format) {
      case 'currency':
        return reportsService.formatCurrency(numValue);
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      default:
        return numValue.toLocaleString();
    }
  };

  const displayValue = formatValue(value);
  
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant="h6"
              sx={{ 
                fontSize: '0.875rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayValue}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && trend.value !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  sx={{ 
                    ml: 0.5,
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {Math.abs(trend.value).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: { xs: 40, sm: 56 },
              height: { xs: 40, sm: 56 },
              flexShrink: 0,
              ml: 1
            }}
          >
            {React.cloneElement(icon, { 
              sx: { 
                fontSize: { xs: '1.2rem', sm: '1.5rem' } 
              } 
            })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state: RootState) => state.patients);
  
  // Estados para datos ejecutivos
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [loadingExecutive, setLoadingExecutive] = useState(false);
  const [executiveError, setExecutiveError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPatientsStats() as any);
    // Solo cargar datos ejecutivos si el usuario es administrador
    if (user?.rol === 'administrador') {
      loadExecutiveData();
    }
  }, [dispatch, user?.rol]);

  const loadExecutiveData = async () => {
    try {
      setLoadingExecutive(true);
      setExecutiveError(null);
      
      const response = await reportsService.getExecutiveSummary({ periodo: 'mes' });
      if (response.success) {
        setExecutiveSummary(response.data?.resumenEjecutivo || null);
      } else {
        setExecutiveError('Error al cargar datos ejecutivos');
      }
    } catch (error) {
      setExecutiveError('Error al conectar con el servidor');
    } finally {
      setLoadingExecutive(false);
    }
  };

  const refreshStats = () => {
    dispatch(fetchPatientsStats() as any);
    // Solo refrescar datos ejecutivos si el usuario es administrador
    if (user?.rol === 'administrador') {
      loadExecutiveData();
    }
  };


  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
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
              <Typography variant="body1" color="text.secondary">
                Sistema de Gestión Hospitalaria
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Actualizar datos ejecutivos">
            <span>
              <IconButton onClick={refreshStats} disabled={loading || loadingExecutive}>
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
      </Box>

      {/* Dashboard Ejecutivo */}
      {executiveError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {executiveError}
        </Alert>
      )}

      {/* KPIs Ejecutivos Principales - Solo para Administradores */}
      {user?.rol === 'administrador' && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" />
            Resumen Ejecutivo - Último Mes
          </Typography>

          {loadingExecutive && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Ingresos Totales"
                value={executiveSummary?.ingresosTotales || 0}
                icon={<AttachMoney />}
                color="#4caf50"
                format="currency"
                subtitle="Ventas + Servicios"
                trend={{ value: 12.5, isPositive: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Utilidad Neta"
                value={executiveSummary?.utilidadNeta || 0}
                icon={<TrendingUp />}
                color="#2196f3"
                format="currency"
                subtitle={executiveSummary ? `${((executiveSummary.utilidadNeta / executiveSummary.ingresosTotales) * 100).toFixed(1)}% margen` : 'Margen de utilidad'}
                trend={{ value: 8.3, isPositive: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pacientes Atendidos"
                value={executiveSummary?.pacientesAtendidos || stats?.totalPacientes || 0}
                icon={<People />}
                color="#9c27b0"
                subtitle="Consultas y servicios"
                trend={{ value: 15.7, isPositive: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Ocupación Promedio"
                value={executiveSummary?.ocupacionPromedio || 0}
                icon={<Hotel />}
                color="#ff9800"
                format="percentage"
                subtitle="Habitaciones ocupadas"
                trend={{ value: 2.1, isPositive: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabla de Ocupación en Tiempo Real */}
      <OcupacionTable />

      {/* Estadísticas Operativas */}
      {stats && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Estadísticas Operativas</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Pacientes"
                value={stats?.totalPacientes || 0}
                icon={<People />}
                color="#1976d2"
                subtitle="En el sistema"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cuentas Hospitalización"
                value={stats?.pacientesHospitalizados || 0}
                icon={<LocalHospital />}
                color="#f57c00"
                subtitle="Pacientes hospitalizados"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cuentas Abiertas"
                value={stats?.pacientesConCuentaAbierta || 0}
                icon={<Assignment />}
                color="#388e3c"
                subtitle="POS activos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Estadística Adicional"
                value={stats?.pacientesAdultos || 0}
                icon={<Assessment />}
                color="#7b1fa2"
                subtitle="Pacientes adultos"
              />
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;