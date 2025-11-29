// ABOUTME: Página de Gestión de Pacientes del sistema hospitalario
// ABOUTME: CRUD de pacientes con búsqueda avanzada y estadísticas

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Grid,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  TrendingUp as StatsIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import { patientsService } from '@/services/patientsService';
import { PatientStats } from '@/types/patients.types';
import PageHeader from '@/components/common/PageHeader';
import { FullPageLoader } from '@/components/common/LoadingState';

// Import components we'll create
import PatientsTab from './PatientsTab';
import PatientStatsCard from './PatientStatsCard';
import PatientFormDialog from './PatientFormDialog';
import AdvancedSearchTab from './AdvancedSearchTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patients-tabpanel-${index}`}
      aria-labelledby={`patients-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const PatientsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientsService.getPatientStats();

      if (response.success) {
        setPatientStats(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading patient stats:', error);
      console.error('Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      });
      const errorMessage = error?.message || error?.error || 'Error al cargar las estadísticas de pacientes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshStats = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenPatientForm = () => {
    setFormDialogOpen(true);
  };

  const handleClosePatientForm = () => {
    setFormDialogOpen(false);
  };

  const handlePatientCreated = () => {
    refreshStats();
    handleClosePatientForm();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <FullPageLoader message="Cargando pacientes..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Gestión de Pacientes"
        subtitle="Administra el registro de pacientes y sus responsables"
        icon={<PeopleIcon />}
        iconColor="primary"
        actions={[
          {
            label: 'Nuevo Paciente',
            icon: <PersonAddIcon />,
            onClick: handleOpenPatientForm,
            variant: 'contained',
          }
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <PatientStatsCard 
            stats={patientStats} 
            loading={loading} 
            onRefresh={refreshStats}
          />
        </Grid>
      </Grid>

      {/* Main Content with Tabs */}
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ px: 3, pt: 2 }}
          >
            <Tab
              label="Lista de Pacientes"
              icon={<PeopleIcon />}
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 80 : 48 }}
            />
            <Tab
              label="Búsqueda Avanzada"
              icon={<SearchIcon />}
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 80 : 48 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <PatientsTab onStatsChange={refreshStats} onPatientCreated={refreshStats} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdvancedSearchTab onStatsChange={refreshStats} onPatientCreated={refreshStats} />
        </TabPanel>
      </Paper>

      {/* Floating Action Button for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="agregar paciente"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenPatientForm}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Patient Form Dialog */}
      <PatientFormDialog
        open={formDialogOpen}
        onClose={handleClosePatientForm}
        onPatientCreated={handlePatientCreated}
      />
    </Box>
  );
};

export default PatientsPage;