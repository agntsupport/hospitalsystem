// ABOUTME: Página de Reportes Administrativos del sistema hospitalario
// ABOUTME: Dashboard ejecutivo, reportes financieros, operativos y gerenciales

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  LocalHospital as DoctorIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { FullPageLoader } from '@/components/common/LoadingState';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ReportFilters, REPORT_PERIODS, PERIOD_LABELS } from '@/types/reports.types';
import reportsService from '@/services/reportsService';

// Importar las pestañas de reportes
import FinancialReportsTab from './FinancialReportsTab';
import OperationalReportsTab from './OperationalReportsTab';
import ExecutiveDashboardTab from './ExecutiveDashboardTab';
import ManagerialReportsTab from './ManagerialReportsTab';
import CommissionsReportTab from '../../components/comisiones/CommissionsReportTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reports-tab-${index}`,
    'aria-controls': `reports-tabpanel-${index}`,
  };
}

const ReportsPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Filtros globales para todos los reportes
  const [filters, setFilters] = useState<ReportFilters>({
    periodo: 'mes',
    fechaInicio: '',
    fechaFin: '',
    formato: 'resumido'
  });

  useEffect(() => {
    // Establecer fechas por defecto basadas en el período seleccionado
    if (filters.periodo && filters.periodo !== 'personalizado') {
      const dateRange = reportsService.getDateRangeForPeriod(filters.periodo);
      setFilters(prev => ({
        ...prev,
        fechaInicio: dateRange.fechaInicio,
        fechaFin: dateRange.fechaFin
      }));
    }
  }, [filters.periodo]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString('es-MX'));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    setLastUpdate(new Date().toLocaleString('es-MX'));
    // Los componentes hijos se actualizarán automáticamente cuando cambien los filtros
  };

  const validateAccess = (requiredRoles: string[]) => {
    return user && requiredRoles.includes(user.rol);
  };

  // Verificar permisos de acceso
  const canViewFinancial = validateAccess(['administrador', 'socio']);
  const canViewOperational = validateAccess(['administrador', 'socio', 'almacenista']);
  const canViewExecutive = validateAccess(['administrador', 'socio']);
  const canViewManagerial = validateAccess(['administrador', 'socio']);
  const canViewCommissions = validateAccess(['administrador']); // Solo admin puede ver comisiones

  if (!canViewFinancial && !canViewOperational && !canViewExecutive) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No tiene permisos para acceder a los reportes administrativos.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Reportes Administrativos"
        subtitle="Análisis financiero, operativo y gerencial del hospital con indicadores clave de rendimiento"
        icon={<AssessmentIcon />}
        iconColor="primary"
      />

      {/* Filtros globales */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3,
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: 2
          }
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
          Filtros de Reporte
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={filters.periodo || ''}
                label="Período"
                onChange={(e) => handleFilterChange('periodo', e.target.value)}
              >
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {filters.periodo === 'personalizado' && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Inicio"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Fin"
                  value={filters.fechaFin || ''}
                  onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Formato</InputLabel>
              <Select
                value={filters.formato || 'resumido'}
                label="Formato"
                onChange={(e) => handleFilterChange('formato', e.target.value)}
              >
                <MenuItem value="resumido">Resumido</MenuItem>
                <MenuItem value="detallado">Detallado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              fullWidth
            >
              Actualizar
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              Última actualización: {lastUpdate}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs de reportes */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="reportes tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {canViewExecutive && (
              <Tab
                icon={<BusinessIcon />}
                label="Dashboard Ejecutivo"
                {...a11yProps(0)}
              />
            )}
            {canViewFinancial && (
              <Tab
                icon={<TrendingUpIcon />}
                label="Reportes Financieros"
                {...a11yProps(canViewExecutive ? 1 : 0)}
              />
            )}
            {canViewOperational && (
              <Tab
                icon={<AssessmentIcon />}
                label="Reportes Operativos"
                {...a11yProps((canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0))}
              />
            )}
            {canViewManagerial && (
              <Tab
                icon={<DoctorIcon />}
                label="Reportes Gerenciales"
                {...a11yProps((canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0) + (canViewOperational ? 1 : 0))}
              />
            )}
            {canViewCommissions && (
              <Tab
                icon={<MoneyIcon />}
                label="Comisiones Médicas"
                {...a11yProps((canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0) + (canViewOperational ? 1 : 0) + (canViewManagerial ? 1 : 0))}
              />
            )}
          </Tabs>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tab Panels */}
        {canViewExecutive && (
          <TabPanel value={tabValue} index={0}>
            <ExecutiveDashboardTab 
              filters={filters}
              onError={setError}
              onLoading={setLoading}
            />
          </TabPanel>
        )}

        {canViewFinancial && (
          <TabPanel value={tabValue} index={canViewExecutive ? 1 : 0}>
            <FinancialReportsTab 
              filters={filters}
              onError={setError}
              onLoading={setLoading}
            />
          </TabPanel>
        )}

        {canViewOperational && (
          <TabPanel value={tabValue} index={(canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0)}>
            <OperationalReportsTab
              filters={filters}
              onError={setError}
              onLoading={setLoading}
            />
          </TabPanel>
        )}

        {canViewManagerial && (
          <TabPanel value={tabValue} index={(canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0) + (canViewOperational ? 1 : 0)}>
            <ManagerialReportsTab
              filters={filters}
              onError={setError}
              onLoading={setLoading}
            />
          </TabPanel>
        )}

        {canViewCommissions && (
          <TabPanel value={tabValue} index={(canViewExecutive ? 1 : 0) + (canViewFinancial ? 1 : 0) + (canViewOperational ? 1 : 0) + (canViewManagerial ? 1 : 0)}>
            <CommissionsReportTab />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
};

export default ReportsPage;