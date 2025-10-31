import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Schedule as ScheduleIcon,
  Group as TeamIcon,
  Description as NotesIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import quirofanosService, { CirugiaQuirofano } from '@/services/quirofanosService';
import auditService from '@/services/auditService';

interface CirugiaDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  cirugiaId: number | null;
}

const CirugiaDetailsDialog: React.FC<CirugiaDetailsDialogProps> = ({
  open,
  onClose,
  cirugiaId
}) => {
  const [cirugia, setCirugia] = useState<CirugiaQuirofano | null>(null);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (open && cirugiaId) {
      loadCirugiaDetails();
    }
  }, [open, cirugiaId]);

  const loadCirugiaDetails = async () => {
    if (!cirugiaId) return;

    try {
      setLoading(true);
      setError(null);
      
      const [cirugiaData, auditData] = await Promise.all([
        quirofanosService.getCirugiaById(cirugiaId),
        auditService.getAuditTrail('cirugia', cirugiaId)
      ]);

      setCirugia(cirugiaData.data);
      setAuditoria((auditData as any).data || auditData || []);
    } catch (error: any) {
      setError(error.message || 'Error al cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string): any => {
    switch (estado) {
      case 'programada':
        return 'info';
      case 'en_progreso':
        return 'warning';
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'error';
      case 'reprogramada':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <EventIcon />;
      case 'en_progreso':
        return <StartIcon />;
      case 'completada':
        return <CompleteIcon />;
      case 'cancelada':
        return <CancelIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !cirugia) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">
            {error || 'No se pudieron cargar los detalles de la cirugía'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            🏥 Detalles de Cirugía
          </Typography>
          <Chip
            icon={getStatusIcon(cirugia.estado)}
            label={cirugia.estado.replace('_', ' ').toUpperCase()}
            color={getStatusColor(cirugia.estado)}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información del Quirófano */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <HospitalIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Quirófano</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Número
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Quirófano {cirugia.quirofano?.numero}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1">
                    {cirugia.quirofano?.tipo?.replace('_', ' ')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Información del Paciente */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Paciente</Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold">
                {cirugia.paciente?.nombre} {cirugia.paciente?.apellidoPaterno} {cirugia.paciente?.apellidoMaterno}
              </Typography>
              {cirugia.paciente?.telefono && (
                <Typography variant="body2" color="textSecondary">
                  📞 {cirugia.paciente.telefono}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Información del Médico */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <MedicalIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Médico Principal</Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold">
                Dr. {cirugia.medico?.nombre} {cirugia.medico?.apellidoPaterno}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {cirugia.medico?.especialidad}
              </Typography>
              {cirugia.medico?.telefono && (
                <Typography variant="body2" color="textSecondary">
                  📞 {cirugia.medico.telefono}
                </Typography>
              )}
              {cirugia.medico?.email && (
                <Typography variant="body2" color="textSecondary">
                  ✉️ {cirugia.medico.email}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Detalles de la Intervención */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <MedicalIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Detalles de la Intervención</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Tipo de Intervención
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {cirugia.tipoIntervencion}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Fecha y Hora de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(cirugia.fechaInicio), "dd 'de' MMMM yyyy", { locale: es })}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {format(new Date(cirugia.fechaInicio), 'HH:mm')} hrs
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Fecha y Hora de Fin {cirugia.fechaFin ? '' : '(Estimada)'}
                  </Typography>
                  {cirugia.fechaFin && (
                    <>
                      <Typography variant="body1">
                        {format(new Date(cirugia.fechaFin), "dd 'de' MMMM yyyy", { locale: es })}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {format(new Date(cirugia.fechaFin), 'HH:mm')} hrs
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
              
              {/* Duración */}
              {cirugia.fechaFin && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Duración
                  </Typography>
                  <Typography variant="body1">
                    {Math.round(
                      (new Date(cirugia.fechaFin).getTime() - new Date(cirugia.fechaInicio).getTime()) / (1000 * 60)
                    )} minutos
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Equipo Médico */}
          {cirugia.equipoMedicoDetalle && cirugia.equipoMedicoDetalle.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <TeamIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Equipo Médico</Typography>
                </Box>
                <List dense>
                  {cirugia.equipoMedicoDetalle.map((miembro: any) => (
                    <ListItem key={miembro.id}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${miembro.nombre} ${miembro.apellidoPaterno}`}
                        secondary={`${miembro.cargo} - ${miembro.especialidad || 'Sin especialidad'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Observaciones */}
          {cirugia.observaciones && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <NotesIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Observaciones</Typography>
                </Box>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {cirugia.observaciones}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Historial de Auditoría */}
          {auditoria.length > 0 && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <Button
                  variant="text"
                  onClick={() => setShowAudit(!showAudit)}
                  startIcon={<ScheduleIcon />}
                >
                  {showAudit ? 'Ocultar' : 'Mostrar'} Historial de Cambios ({auditoria.length})
                </Button>
              </Box>
              
              {showAudit && (
                <Paper sx={{ p: 2 }}>
                  <Timeline position="alternate">
                    {auditoria.map((evento, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="textSecondary">
                          {format(new Date(evento.fechaOperacion), 'dd/MM/yyyy HH:mm')}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={
                            evento.tipoOperacion.includes('DELETE') ? 'error' :
                            evento.tipoOperacion.includes('POST') ? 'success' :
                            evento.tipoOperacion.includes('PUT') ? 'warning' : 'grey'
                          }>
                            {evento.tipoOperacion.includes('DELETE') ? <CancelIcon /> :
                             evento.tipoOperacion.includes('POST') ? <CompleteIcon /> :
                             <StartIcon />}
                          </TimelineDot>
                          {index < auditoria.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2" fontWeight="bold">
                            {evento.tipoOperacion.split(' ')[0]}
                          </Typography>
                          <Typography variant="caption">
                            Por: {evento.usuarioNombre} ({evento.rolUsuario})
                          </Typography>
                          {evento.motivo && (
                            <Typography variant="caption" display="block">
                              Motivo: {evento.motivo}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Paper>
              )}
            </Grid>
          )}

          {/* Información de Registro */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" px={1}>
              <Typography variant="caption" color="textSecondary">
                Registrado: {format(new Date(cirugia.createdAt), 'dd/MM/yyyy HH:mm')}
              </Typography>
              {cirugia.updatedAt !== cirugia.createdAt && (
                <Typography variant="caption" color="textSecondary">
                  Última actualización: {format(new Date(cirugia.updatedAt), 'dd/MM/yyyy HH:mm')}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CirugiaDetailsDialog;