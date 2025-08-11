import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  TrendingUp as StatsIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  ChildCare as ChildIcon,
  Accessibility as ElderlyIcon,
} from '@mui/icons-material';

import { PatientStats, GENDER_OPTIONS } from '@/types/patients.types';

interface PatientStatsCardProps {
  stats: PatientStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const PatientStatsCard: React.FC<PatientStatsCardProps> = ({ stats, loading, onRefresh }) => {
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M':
        return <MaleIcon color="info" fontSize="small" />;
      case 'F':
        return <FemaleIcon color="secondary" fontSize="small" />;
      default:
        return <PersonIcon color="action" fontSize="small" />;
    }
  };

  const getAgeGroupIcon = (ageGroup: string) => {
    if (ageGroup === '0-18') return <ChildIcon fontSize="small" />;
    if (ageGroup === '65+') return <ElderlyIcon fontSize="small" />;
    return <PersonIcon fontSize="small" />;
  };

  const getAgeGroupColor = (ageGroup: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' => {
    switch (ageGroup) {
      case '0-18': return 'primary';
      case '19-35': return 'success';
      case '36-50': return 'info';
      case '51-65': return 'warning';
      case '65+': return 'error';
      default: return 'primary';
    }
  };

  if (loading || !stats) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const activePercentage = stats.totalPatients > 0 ? (stats.activePatients / stats.totalPatients) * 100 : 0;

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatsIcon color="primary" />
            <Typography variant="h6" component="h2">
              Estadísticas de Pacientes
            </Typography>
          </Box>
          <IconButton onClick={onRefresh} size="small" title="Actualizar">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Overall Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.totalPatients}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Pacientes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.activePatients}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Activos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.inactivePatients}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inactivos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {stats.newPatientsThisMonth}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nuevos (Mes)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Active Patients Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              Pacientes Activos
            </Typography>
            <Chip
              label={`${activePercentage.toFixed(1)}%`}
              color="success"
              size="small"
              icon={<PersonAddIcon />}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={activePercentage}
            color="success"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Gender Distribution */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon fontSize="small" />
            Distribución por Género
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {stats.patientsByGender && Object.keys(stats.patientsByGender).length > 0 ? 
              Object.entries(stats.patientsByGender).map(([gender, count]) => (
                <Grid item xs={4} key={gender}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                      {getGenderIcon(gender)}
                      <Typography variant="h6" sx={{ ml: 1 }} fontWeight="bold">
                        {count}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {GENDER_OPTIONS[gender as keyof typeof GENDER_OPTIONS]}
                    </Typography>
                  </Box>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No hay datos de distribución por género
                  </Typography>
                </Grid>
              )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Age Groups */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChildIcon fontSize="small" />
            Distribución por Edad
          </Typography>
          <Box sx={{ mt: 2 }}>
            {stats.patientsByAgeGroup && Object.keys(stats.patientsByAgeGroup).length > 0 ?
              Object.entries(stats.patientsByAgeGroup).map(([ageGroup, count]) => (
                <Box key={ageGroup} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getAgeGroupIcon(ageGroup)}
                      <Typography variant="body2" fontWeight="medium">
                        {ageGroup} años
                      </Typography>
                    </Box>
                    <Chip
                      label={count}
                      size="small"
                      color={getAgeGroupColor(ageGroup)}
                      variant="outlined"
                    />
                  </Box>
                  {stats.totalPatients > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={((count as number) / stats.totalPatients) * 100}
                      color={getAgeGroupColor(ageGroup)}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  )}
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No hay datos de distribución por edad
                </Typography>
              )}
          </Box>

          {/* Average Age */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              <strong>Edad Promedio:</strong> {stats.averageAge} años
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatientStatsCard;