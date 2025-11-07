// ABOUTME: Componente que muestra el historial completo de hospitalizaciones de un paciente
// Incluye hospitalizaciones activas y dadas de alta con detalles de fechas, diagnóstico y estado

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  Person as DoctorIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';
import hospitalizationService from '@/services/hospitalizationService';
import { HospitalAdmission } from '@/types/hospitalization.types';

interface PatientHospitalizationHistoryProps {
  pacienteId: number;
}

const PatientHospitalizationHistory: React.FC<PatientHospitalizationHistoryProps> = ({ pacienteId }) => {
  const [hospitalizations, setHospitalizations] = useState<HospitalAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHospitalizations();
  }, [pacienteId]);

  const loadHospitalizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hospitalizationService.getPatientHospitalizations(pacienteId);

      if (response.success && response.data) {
        setHospitalizations(response.data.items || []);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading hospitalizations:', error);
      setError(error?.message || 'Error al cargar el historial de hospitalizaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusChip = (admission: HospitalAdmission) => {
    if (admission.fechaAlta) {
      return (
        <Chip
          icon={<CheckIcon />}
          label="Alta Médica"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    }

    // Hospitalizaciones activas
    const statusColors: Record<string, 'default' | 'warning' | 'info' | 'error'> = {
      en_observacion: 'warning',
      estable: 'info',
      critico: 'error',
      delicado: 'warning'
    };

    const statusLabels: Record<string, string> = {
      en_observacion: 'En Observación',
      estable: 'Estable',
      critico: 'Crítico',
      delicado: 'Delicado'
    };

    return (
      <Chip
        icon={<ClockIcon />}
        label={statusLabels[admission.estado] || admission.estado}
        color={statusColors[admission.estado] || 'default'}
        size="small"
      />
    );
  };

  const getDaysOfStay = (fechaIngreso: string, fechaAlta?: string) => {
    const ingreso = new Date(fechaIngreso);
    const alta = fechaAlta ? new Date(fechaAlta) : new Date();
    const diffTime = Math.abs(alta.getTime() - ingreso.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (hospitalizations.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay registros de hospitalizaciones para este paciente
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HospitalIcon color="primary" />
        Historial de Hospitalizaciones ({hospitalizations.length})
      </Typography>

      <Stack spacing={2}>
        {hospitalizations.map((admission) => (
          <Card key={admission.id} variant="outlined" sx={{ borderLeft: admission.fechaAlta ? '4px solid #4caf50' : '4px solid #2196f3' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      Ingreso: {formatDate(admission.fechaIngreso)}
                    </Typography>
                  </Box>
                  {admission.fechaAlta && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="medium">
                        Alta: {formatDate(admission.fechaAlta)}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Estancia: {getDaysOfStay(admission.fechaIngreso, admission.fechaAlta || undefined)} día(s)
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    {getStatusChip(admission)}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                    Ingreso #{admission.id}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <HospitalIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Diagnóstico de Ingreso
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {admission.diagnosticoIngreso}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {admission.medicoTratante && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DoctorIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Médico Tratante: <strong>{admission.medicoTratante.username}</strong>
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {admission.habitacion && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Habitación: <strong>{admission.habitacion.numero}</strong> ({admission.habitacion.tipo})
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default PatientHospitalizationHistory;
