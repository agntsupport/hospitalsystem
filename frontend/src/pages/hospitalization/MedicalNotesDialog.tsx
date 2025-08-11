import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  FormHelperText,
  Card,
  CardContent,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  MedicalServices as MedicalServicesIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import hospitalizationService from '@/services/hospitalizationService';
import { toast } from 'react-toastify';
import { HospitalAdmission, MedicalNote } from '@/types/hospitalization.types';

interface MedicalNotesDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
  onSuccess: () => void;
}

interface SOAPFormData {
  tipo: 'evolucion' | 'interconsulta' | 'procedimiento' | 'enfermeria' | 'alta';
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  especialidad?: string;
  diagnosticos: string[];
  seguimiento?: string;
  proximaRevision?: string;
}

const initialFormData: SOAPFormData = {
  tipo: 'evolucion',
  subjetivo: '',
  objetivo: '',
  analisis: '',
  plan: '',
  especialidad: '',
  diagnosticos: [],
  seguimiento: '',
  proximaRevision: '',
};

const tiposNota = [
  { value: 'evolucion', label: 'Evolución Médica', icon: <MedicalServicesIcon />, color: 'primary' },
  { value: 'interconsulta', label: 'Interconsulta', icon: <PsychologyIcon />, color: 'secondary' },
  { value: 'procedimiento', label: 'Procedimiento', icon: <AssignmentIcon />, color: 'info' },
  { value: 'enfermeria', label: 'Nota de Enfermería', icon: <PersonIcon />, color: 'success' },
  { value: 'alta', label: 'Nota de Alta', icon: <ScheduleIcon />, color: 'warning' },
];

const especialidades = [
  'Medicina Interna',
  'Cirugía General',
  'Pediatría',
  'Ginecología',
  'Traumatología',
  'Cardiología',
  'Neurología',
  'Oncología',
  'UCI',
  'Anestesiología',
  'Radiología',
  'Patología',
];

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
      id={`soap-tabpanel-${index}`}
      aria-labelledby={`soap-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalNotesDialog: React.FC<MedicalNotesDialogProps> = ({
  open,
  onClose,
  admission,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<SOAPFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingNotes, setExistingNotes] = useState<MedicalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newDiagnostico, setNewDiagnostico] = useState('');

  // Cargar notas existentes cuando se abre el diálogo
  useEffect(() => {
    if (open && admission) {
      loadExistingNotes();
      // Precargar especialidad si el usuario tiene una
      if (user?.especialidad) {
        setFormData(prev => ({
          ...prev,
          especialidad: user.especialidad
        }));
      }
    }
  }, [open, admission, user]);

  const loadExistingNotes = async () => {
    if (!admission) return;
    
    setLoadingNotes(true);
    try {
      const response = await hospitalizationService.getMedicalNotes(admission.id);
      if (response.success && response.data) {
        setExistingNotes(response.data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleInputChange = (field: keyof SOAPFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAddDiagnostico = () => {
    if (newDiagnostico.trim()) {
      setFormData(prev => ({
        ...prev,
        diagnosticos: [...prev.diagnosticos, newDiagnostico.trim()]
      }));
      setNewDiagnostico('');
    }
  };

  const handleRemoveDiagnostico = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos: prev.diagnosticos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subjetivo.trim()) {
      newErrors.subjetivo = 'El componente subjetivo es requerido';
    } else if (formData.subjetivo.length < 10) {
      newErrors.subjetivo = 'Debe tener al menos 10 caracteres';
    }

    if (!formData.objetivo.trim()) {
      newErrors.objetivo = 'El componente objetivo es requerido';
    } else if (formData.objetivo.length < 10) {
      newErrors.objetivo = 'Debe tener al menos 10 caracteres';
    }

    if (!formData.analisis.trim()) {
      newErrors.analisis = 'El análisis es requerido';
    } else if (formData.analisis.length < 10) {
      newErrors.analisis = 'Debe tener al menos 10 caracteres';
    }

    if (!formData.plan.trim()) {
      newErrors.plan = 'El plan es requerido';
    } else if (formData.plan.length < 10) {
      newErrors.plan = 'Debe tener al menos 10 caracteres';
    }

    if (formData.tipo === 'interconsulta' && !formData.especialidad) {
      newErrors.especialidad = 'La especialidad es requerida para interconsultas';
    }

    if (formData.diagnosticos.length === 0) {
      newErrors.diagnosticos = 'Debe agregar al menos un diagnóstico';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !admission) {
      return;
    }

    setLoading(true);
    try {
      const response = await hospitalizationService.createMedicalNote(admission.id, {
        tipo: formData.tipo,
        subjetivo: formData.subjetivo,
        objetivo: formData.objetivo,
        analisis: formData.analisis,
        plan: formData.plan,
        especialidad: formData.especialidad,
        diagnosticos: formData.diagnosticos,
        seguimiento: formData.seguimiento,
        proximaRevision: formData.proximaRevision,
      });

      if (response.success) {
        toast.success('Nota médica registrada exitosamente');
        onSuccess();
        handleClose();
      } else {
        toast.error(response.message || 'Error al registrar la nota médica');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar la nota médica');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setNewDiagnostico('');
    setTabValue(0);
    onClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTipoInfo = (tipo: string) => {
    return tiposNota.find(t => t.value === tipo) || tiposNota[0];
  };

  const formatDateTime = (fecha: string, hora: string) => {
    try {
      const fechaObj = new Date(`${fecha}T${hora}`);
      return fechaObj.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return `${fecha} ${hora}`;
    }
  };

  if (!admission) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentIcon color="primary" />
            <Box>
              <Typography variant="h6">Notas Médicas SOAP</Typography>
              <Typography variant="subtitle2" color="textSecondary">
                {admission.paciente.nombre} • {admission.numeroIngreso} • Habitación {admission.habitacion.numero}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Nueva Nota SOAP" />
            <Tab label={`Historial (${existingNotes.length})`} />
          </Tabs>
        </Box>

        {/* Nueva Nota SOAP */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Información del Paciente */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Información del Paciente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Nombre:</strong> {admission.paciente.nombre}</Typography>
                      <Typography><strong>Edad:</strong> {admission.paciente.edad} años</Typography>
                      <Typography><strong>Género:</strong> {admission.paciente.genero}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Días de estancia:</strong> {admission.diasEstancia}</Typography>
                      <Typography><strong>Diagnóstico de ingreso:</strong> {admission.diagnosticoIngreso}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>Estado general:</strong></Typography>
                        <Chip 
                          label={hospitalizationService.formatGeneralStatus(admission.estadoGeneral)} 
                          size="small" 
                          color={hospitalizationService.getGeneralStatusColor(admission.estadoGeneral)}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Tipo de Nota */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Nota</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  label="Tipo de Nota"
                >
                  {tiposNota.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {tipo.icon}
                        {tipo.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Especialidad */}
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                required={formData.tipo === 'interconsulta'}
                error={!!errors.especialidad}
              >
                <InputLabel>Especialidad</InputLabel>
                <Select
                  value={formData.especialidad || ''}
                  onChange={(e) => handleInputChange('especialidad', e.target.value)}
                  label="Especialidad"
                >
                  {especialidades.map((esp) => (
                    <MenuItem key={esp} value={esp}>
                      {esp}
                    </MenuItem>
                  ))}
                </Select>
                {errors.especialidad && (
                  <FormHelperText>{errors.especialidad}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Método SOAP */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesIcon color="primary" />
                Evaluación SOAP
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* S - Subjetivo */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon color="primary" />
                    Subjetivo
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Lo que refiere el paciente (síntomas, molestias, preocupaciones)
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.subjetivo}
                    onChange={(e) => handleInputChange('subjetivo', e.target.value)}
                    error={!!errors.subjetivo}
                    helperText={errors.subjetivo || `${formData.subjetivo.length} caracteres`}
                    placeholder="Ej: Paciente refiere dolor abdominal tipo cólico de 6/10, náuseas ocasionales, niega vómito..."
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* O - Objetivo */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisibilityIcon color="secondary" />
                    Objetivo
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Hallazgos físicos, signos vitales, estudios de laboratorio
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.objetivo}
                    onChange={(e) => handleInputChange('objetivo', e.target.value)}
                    error={!!errors.objetivo}
                    helperText={errors.objetivo || `${formData.objetivo.length} caracteres`}
                    placeholder="Ej: TA: 120/80, FC: 78, FR: 18, Temp: 36.5°C. Abdomen blando, doloroso a la palpación en FID..."
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* A - Análisis */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon color="info" />
                    Análisis
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Impresión diagnóstica, evaluación de la condición actual
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.analisis}
                    onChange={(e) => handleInputChange('analisis', e.target.value)}
                    error={!!errors.analisis}
                    helperText={errors.analisis || `${formData.analisis.length} caracteres`}
                    placeholder="Ej: Probable apendicitis aguda. Paciente estable hemodinámicamente, requiere valoración quirúrgica..."
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* P - Plan */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalServicesIcon color="warning" />
                    Plan
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Plan de tratamiento, medicamentos, procedimientos
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.plan}
                    onChange={(e) => handleInputChange('plan', e.target.value)}
                    error={!!errors.plan}
                    helperText={errors.plan || `${formData.plan.length} caracteres`}
                    placeholder="Ej: 1. Ayuno absoluto 2. Solucion Hartmann 1000ml c/8hrs 3. Interconsulta a cirugía general..."
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Diagnósticos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Diagnósticos</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  label="Agregar diagnóstico"
                  value={newDiagnostico}
                  onChange={(e) => setNewDiagnostico(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDiagnostico();
                    }
                  }}
                  error={!!errors.diagnosticos}
                  helperText={errors.diagnosticos}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddDiagnostico}
                  startIcon={<AddIcon />}
                  sx={{ minWidth: 120 }}
                >
                  Agregar
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.diagnosticos.map((diagnostico, index) => (
                  <Chip
                    key={index}
                    label={diagnostico}
                    onDelete={() => handleRemoveDiagnostico(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Información Adicional */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seguimiento"
                multiline
                rows={2}
                value={formData.seguimiento}
                onChange={(e) => handleInputChange('seguimiento', e.target.value)}
                placeholder="Indicaciones de seguimiento y monitoreo"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Próxima Revisión"
                value={formData.proximaRevision}
                onChange={(e) => handleInputChange('proximaRevision', e.target.value)}
                placeholder="Ej: En 8 horas, En 24 horas, etc."
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Historial de Notas */}
        <TabPanel value={tabValue} index={1}>
          {loadingNotes ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Cargando historial de notas...</Typography>
            </Box>
          ) : existingNotes.length === 0 ? (
            <Alert severity="info">
              No se han registrado notas médicas para este paciente.
            </Alert>
          ) : (
            <List>
              {existingNotes.map((note, index) => (
                <React.Fragment key={note.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                      <Box sx={{ pt: 0.5 }}>
                        {getTipoInfo(note.tipo).icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={getTipoInfo(note.tipo).label}
                            size="small"
                            color={getTipoInfo(note.tipo).color as any}
                          />
                          <Typography variant="body2" color="textSecondary">
                            {new Date(note.fechaNota).toLocaleString('es-MX')} • {note.empleado?.nombre || 'Sin autor'}
                          </Typography>
                        </Box>
                        
                        {/* SOAP Content */}
                        <Box>
                          <Typography variant="body2"><strong>S:</strong> {note.estadoGeneral}</Typography>
                          <Typography variant="body2"><strong>O:</strong> {note.examenFisico}</Typography>
                          <Typography variant="body2"><strong>A:</strong> {note.sintomas}</Typography>
                          <Typography variant="body2"><strong>P:</strong> {note.planTratamiento}</Typography>
                          {note.observaciones && (
                            <Typography variant="body2"><strong>Observaciones:</strong> {note.observaciones}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < existingNotes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {tabValue === 0 && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={<AssignmentIcon />}
            >
              {loading ? 'Guardando...' : 'Guardar Nota SOAP'}
            </Button>
          </>
        )}
        {tabValue === 1 && (
          <Button onClick={handleClose}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MedicalNotesDialog;