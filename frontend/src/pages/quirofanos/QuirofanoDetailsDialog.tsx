import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper
} from '@mui/material';
import {
  MedicalServices as MedicalIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Build as EquipmentIcon,
  Event as EventIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import quirofanosService, { Quirofano } from '@/services/quirofanosService';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  quirofanoId: number | null;
  onEdit?: (quirofano: Quirofano) => void;
}

interface QuirofanoDetailed extends Quirofano {
  citasRecientes?: Array<{
    id: number;
    fechaCita: string;
    estado: string;
    paciente: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    empleado?: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      especialidad: string;
    };
  }>;
  cirugiasRecientes?: Array<{
    id: number;
    fechaInicio: string;
    fechaFin?: string;
    estado: string;
    tipoIntervencion: string;
  }>;
}

const QuirofanoDetailsDialog: React.FC<Props> = ({
  open,
  onClose,
  quirofanoId,
  onEdit
}) => {
  const { user } = useAuth();
  const [quirofano, setQuirofano] = useState<QuirofanoDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && quirofanoId) {
      loadQuirofano();
    }
  }, [open, quirofanoId]);

  const loadQuirofano = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await quirofanosService.getQuirofanoById(quirofanoId!);
      setQuirofano(response.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getEstadoColor = (estado: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (estado) {
      case 'disponible': return 'success';
      case 'ocupado': return 'error';
      case 'mantenimiento': return 'warning';
      default: return 'info';
    }
  };

  const getEstadoLabel = (estado: string) => {
    const estados: Record<string, string> = {
      disponible: 'Disponible',
      ocupado: 'Ocupado',
      mantenimiento: 'Mantenimiento',
      limpieza: 'En Limpieza',
      preparacion: 'En Preparación'
    };
    return estados[estado] || estado;
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      cirugia_general: 'Cirugía General',
      cirugia_cardiaca: 'Cirugía Cardíaca',
      cirugia_neurologica: 'Neurocirugía',
      cirugia_ortopedica: 'Cirugía Ortopédica',
      cirugia_ambulatoria: 'Cirugía Ambulatoria'
    };
    return tipos[tipo] || tipo;
  };

  const canEdit = user?.rol === 'administrador';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5">
          🏥 Detalles del Quirófano
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {quirofano && (
          <Box>
            {/* Información Principal */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <MedicalIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      Número
                    </Typography>
                    <Typography variant="h4">
                      {quirofano.numero}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography color="textSecondary" gutterBottom>
                        Estado
                      </Typography>
                      <Chip
                        label={getEstadoLabel(quirofano.estado)}
                        color={getEstadoColor(quirofano.estado) as any}
                        size="medium"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PeopleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      Capacidad
                    </Typography>
                    <Typography variant="h4">
                      {quirofano.capacidadEquipo}
                    </Typography>
                    <Typography variant="caption">
                      personas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      Precio/Hora
                    </Typography>
                    <Typography variant="h5">
                      {quirofano.precioHora 
                        ? `$${quirofano.precioHora.toLocaleString()}`
                        : 'N/A'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Información Detallada */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📋 Información General
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Tipo de Quirófano
                      </Typography>
                      <Typography variant="body1">
                        {getTipoLabel(quirofano.tipo)}
                      </Typography>
                    </Box>

                    {quirofano.especialidad && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Especialidad
                        </Typography>
                        <Typography variant="body1">
                          {quirofano.especialidad}
                        </Typography>
                      </Box>
                    )}

                    {quirofano.descripcion && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Descripción
                        </Typography>
                        <Typography variant="body1">
                          {quirofano.descripcion}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔧 Equipamiento
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {quirofano.equipamiento ? (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {quirofano.equipamiento}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary" fontStyle="italic">
                        No se ha especificado equipamiento
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Actividad Reciente */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📅 Actividad Reciente
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {quirofano.citasRecientes && quirofano.citasRecientes.length > 0 ? (
                      <Box mb={3}>
                        <Typography variant="subtitle1" gutterBottom>
                          Citas Programadas
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Paciente</TableCell>
                                <TableCell>Médico</TableCell>
                                <TableCell>Estado</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {quirofano.citasRecientes.map((cita) => (
                                <TableRow key={cita.id}>
                                  <TableCell>{formatDateTime(cita.fechaCita)}</TableCell>
                                  <TableCell>
                                    {`${cita.paciente.nombre} ${cita.paciente.apellidoPaterno} ${cita.paciente.apellidoMaterno}`}
                                  </TableCell>
                                  <TableCell>
                                    {cita.empleado 
                                      ? `Dr. ${cita.empleado.nombre} ${cita.empleado.apellidoPaterno}`
                                      : 'N/A'
                                    }
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={cita.estado} size="small" />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary" fontStyle="italic">
                        No hay citas programadas recientemente
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {canEdit && quirofano && onEdit && (
          <Button 
            variant="outlined" 
            onClick={() => onEdit(quirofano)}
            color="primary"
          >
            Editar
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuirofanoDetailsDialog;