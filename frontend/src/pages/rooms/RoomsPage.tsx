import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Hotel as RoomIcon,
  MeetingRoom as OfficeIcon,
  TrendingUp as StatsIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';

import { roomsService } from '@/services/roomsService';
import { RoomStats, OfficeStats } from '@/types/rooms.types';

// Import components we'll create
import RoomsTab from './RoomsTab';
import OfficesTab from './OfficesTab';
import RoomsStatsCard from './RoomsStatsCard';
import OfficesStatsCard from './OfficesStatsCard';

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
      id={`rooms-tabpanel-${index}`}
      aria-labelledby={`rooms-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const RoomsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [officeStats, setOfficeStats] = useState<OfficeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [roomStatsResponse, officeStatsResponse] = await Promise.all([
        roomsService.getRoomStats(),
        roomsService.getOfficeStats(),
      ]);

      if (roomStatsResponse.success) {
        setRoomStats(roomStatsResponse.data);
      } else {
        throw new Error(roomStatsResponse.message);
      }

      if (officeStatsResponse.success) {
        setOfficeStats(officeStatsResponse.data);
      } else {
        throw new Error(officeStatsResponse.message);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      console.error('Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      });
      const errorMessage = error?.message || error?.error || 'Error al cargar las estadísticas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshStats = () => {
    loadStats();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RoomIcon color="primary" />
          Gestión de Habitaciones y Consultorios
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Administra la ocupación y disponibilidad de habitaciones y consultorios médicos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <RoomsStatsCard 
            stats={roomStats} 
            loading={loading} 
            onRefresh={refreshStats}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <OfficesStatsCard 
            stats={officeStats} 
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
              label="Habitaciones"
              icon={<RoomIcon />}
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 80 : 48 }}
            />
            <Tab
              label="Consultorios"
              icon={<OfficeIcon />}
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 80 : 48 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <RoomsTab onStatsChange={refreshStats} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <OfficesTab onStatsChange={refreshStats} />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RoomsPage;