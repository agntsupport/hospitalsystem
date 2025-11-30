// ABOUTME: Componente de tabla de ocupación en tiempo real del hospital - muestra consultorios, habitaciones y quirófanos con polling automático

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Hotel as BedIcon,
  MedicalServices as SurgeryIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ocupacionService } from '../../services/ocupacionService';
import type {
  OcupacionResponse,
  ConsultorioOcupacion,
  HabitacionOcupacion,
  QuirofanoOcupacion,
} from '../../types/ocupacion.types';

const POLLING_INTERVAL = 30000; // 30 segundos

export const OcupacionTable = () => {
  const [ocupacion, setOcupacion] = useState<OcupacionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchOcupacion = useCallback(async () => {
    try {
      const data = await ocupacionService.getOcupacion();
      setOcupacion(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error al obtener ocupación:', err);
      setError(err?.response?.data?.error || 'Error al cargar ocupación del hospital');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cargar inicial
    fetchOcupacion();

    // Polling cada 30 segundos
    const intervalId = setInterval(fetchOcupacion, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [fetchOcupacion]);

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'disponible':
        return 'success';
      case 'ocupado':
      case 'ocupada':
        return 'error';
      case 'mantenimiento':
        return 'warning';
      case 'programada':
      case 'programado':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDiasHospitalizado = (dias: number | undefined) => {
    if (dias === undefined || dias === null) return '-';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  };

  const formatTiempoTranscurrido = (minutos: number | null) => {
    if (!minutos) return '-';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
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

  if (!ocupacion) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay datos de ocupación disponibles
      </Alert>
    );
  }

  return (
    <Box data-testid="ocupacion-table">
      {/* Header con resumen general */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="ocupacion-header">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" color="white" fontWeight="bold" gutterBottom>
                📊 Ocupación del Hospital en Tiempo Real
              </Typography>
              <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                Última actualización: {lastUpdate.toLocaleTimeString('es-MX')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="right">
                <Typography variant="h3" color="white" fontWeight="bold">
                  {ocupacion.resumen.porcentajeOcupacion.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                  Ocupación Global
                </Typography>
                <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                  {ocupacion.resumen.ocupadosTotal} de {ocupacion.resumen.capacidadTotal} espacios
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen de capacidades */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card data-testid="consultorios-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    🏥 Consultorios
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {ocupacion.consultorios.ocupados}/{ocupacion.consultorios.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ocupacion.consultorios.disponibles} disponibles
                  </Typography>
                </Box>
                <HospitalIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card data-testid="habitaciones-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    🛏️ Habitaciones
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {ocupacion.habitaciones.ocupadas}/{ocupacion.habitaciones.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ocupacion.habitaciones.disponibles} disponibles
                  </Typography>
                </Box>
                <BedIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card data-testid="quirofanos-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    🏥 Quirófanos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {ocupacion.quirofanos.ocupados}/{ocupacion.quirofanos.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ocupacion.quirofanos.programados} programados hoy
                  </Typography>
                </Box>
                <SurgeryIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Consultorios */}
      {ocupacion.consultorios.detalle.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              🏥 Consultorios
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Paciente</strong></TableCell>
                    <TableCell><strong>Médico</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ocupacion.consultorios.detalle.map((consultorio: ConsultorioOcupacion) => (
                    <TableRow key={consultorio.numero} hover>
                      <TableCell>{consultorio.numero}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {consultorio.tipoConsultorio.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={consultorio.estado}
                          size="small"
                          color={getEstadoColor(consultorio.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        {consultorio.pacienteActual ? (
                          <Tooltip title={consultorio.pacienteActual.expediente ? `Exp: ${consultorio.pacienteActual.expediente}` : consultorio.pacienteActual.nombre}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" noWrap maxWidth={200}>
                                {consultorio.pacienteActual.nombre}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {consultorio.medicoAsignado ? (
                          <Typography variant="body2" noWrap maxWidth={200}>
                            {consultorio.medicoAsignado.nombre}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Habitaciones */}
      {ocupacion.habitaciones.detalle.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              🛏️ Habitaciones
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Paciente</strong></TableCell>
                    <TableCell><strong>Días</strong></TableCell>
                    <TableCell><strong>Médico</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ocupacion.habitaciones.detalle.map((habitacion: HabitacionOcupacion) => (
                    <TableRow key={habitacion.numero} hover>
                      <TableCell>{habitacion.numero}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {habitacion.tipoHabitacion.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={habitacion.estado}
                          size="small"
                          color={getEstadoColor(habitacion.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        {habitacion.pacienteActual ? (
                          <Tooltip title={habitacion.pacienteActual.expediente ? `Exp: ${habitacion.pacienteActual.expediente}` : habitacion.pacienteActual.nombre}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" noWrap maxWidth={200}>
                                {habitacion.pacienteActual.nombre}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {habitacion.pacienteActual ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDiasHospitalizado(habitacion.pacienteActual.diasHospitalizado)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {habitacion.medicoAsignado ? (
                          <Typography variant="body2" noWrap maxWidth={200}>
                            {habitacion.medicoAsignado.nombre}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Quirófanos (solo mostrar primeros 10 para no saturar) */}
      {ocupacion.quirofanos.detalle.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              🏥 Quirófanos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Cirugía Actual</strong></TableCell>
                    <TableCell><strong>Tiempo</strong></TableCell>
                    <TableCell><strong>Próxima Cirugía</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ocupacion.quirofanos.detalle.slice(0, 10).map((quirofano: QuirofanoOcupacion) => (
                    <TableRow key={quirofano.numero} hover>
                      <TableCell>{quirofano.numero}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap maxWidth={150}>
                          {quirofano.tipoQuirofano.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={quirofano.estado}
                          size="small"
                          color={getEstadoColor(quirofano.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        {quirofano.cirugiaActual ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold" noWrap maxWidth={200}>
                              {quirofano.cirugiaActual.tipo}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {quirofano.cirugiaActual.paciente.nombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {quirofano.cirugiaActual ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatTiempoTranscurrido(quirofano.cirugiaActual.tiempoTranscurrido)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {quirofano.proximaCirugia ? (
                          <Box>
                            <Typography variant="body2" noWrap maxWidth={150}>
                              {quirofano.proximaCirugia.tipo}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(quirofano.proximaCirugia.horaProgramada).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {ocupacion.quirofanos.detalle.length > 10 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Mostrando 10 de {ocupacion.quirofanos.detalle.length} quirófanos
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer con indicador de actualización automática */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
        <RefreshIcon fontSize="small" color="action" sx={{ animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
        <Typography variant="caption" color="textSecondary">
          Actualización automática cada 30 segundos
        </Typography>
      </Box>
    </Box>
  );
};

export default OcupacionTable;
