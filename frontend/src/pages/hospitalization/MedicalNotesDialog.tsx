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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
import { medicalNoteSchema, MedicalNoteFormValues } from '@/schemas/hospitalization.schemas';

interface MedicalNotesDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
  onSuccess: () => void;
}

// Default values matching the schema
const defaultValues: MedicalNoteFormValues = {
  subjetivo: '',
  objetivo: '',
  analisis: '',
  plan: '',
  tipoNota: 'evolucion',
  signos_vitales: {
    temperatura: undefined,
    presion_sistolica: undefined,
    presion_diastolica: undefined,
    frecuencia_cardiaca: undefined,
    frecuencia_respiratoria: undefined,
    saturacion_oxigeno: undefined,
  },
};

const tiposNota = [
  { value: 'evolucion', label: 'Evolución Médica', icon: <MedicalServicesIcon />, color: 'primary' },
  { value: 'interconsulta', label: 'Interconsulta', icon: <PsychologyIcon />, color: 'secondary' },
  { value: 'procedimiento', label: 'Procedimiento', icon: <AssignmentIcon />, color: 'info' },
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
  const [loading, setLoading] = useState(false);
  const [existingNotes, setExistingNotes] = useState<MedicalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MedicalNoteFormValues>({
    resolver: yupResolver(medicalNoteSchema),
    defaultValues,
  });

  const watchedValues = watch();

  // Cargar notas existentes cuando se abre el diálogo
  useEffect(() => {
    if (open && admission) {
      loadExistingNotes();
      // Reset form with default values
      reset(defaultValues);
    }
  }, [open, admission, reset]);

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




  const onSubmit = async (data: MedicalNoteFormValues) => {
    if (!admission) return;

    setLoading(true);
    try {
      const response = await hospitalizationService.createMedicalNote(admission.id, {
        tipo: data.tipoNota as 'evolucion' | 'interconsulta' | 'procedimiento' | 'enfermeria' | 'alta',
        subjetivo: data.subjetivo,
        objetivo: data.objetivo,
        analisis: data.analisis,
        plan: data.plan,
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
    reset();
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
      closeAfterTransition={false}
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
                {admission.paciente.nombre} • {admission.numeroIngreso} • Habitación {admission.habitacion?.numero ?? 'N/A'}
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
                      <Typography><strong>Días de estancia:</strong> {admission.diasEstancia ?? hospitalizationService.calculateStayDays(admission.fechaIngreso, admission.fechaAlta)}</Typography>
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
              <Controller
                name="tipoNota"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth required error={!!fieldState.error}>
                    <InputLabel>Tipo de Nota</InputLabel>
                    <Select
                      {...field}
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
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Signos Vitales */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Signos Vitales (Opcional)
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Controller
                    name="signos_vitales.temperatura"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        size="small"
                        type="number"
                        label="Temp (°C)"
                        inputProps={{ step: 0.1, min: 30, max: 45 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="signos_vitales.frecuencia_cardiaca"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        size="small"
                        type="number"
                        label="FC (lpm)"
                        inputProps={{ min: 30, max: 250 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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
                  <Controller
                    name="subjetivo"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        multiline
                        rows={4}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || `${field.value?.length || 0} caracteres`}
                        placeholder="Ej: Paciente refiere dolor abdominal tipo cólico de 6/10, náuseas ocasionales, niega vómito..."
                      />
                    )}
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
                  <Controller
                    name="objetivo"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        multiline
                        rows={4}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || `${field.value?.length || 0} caracteres`}
                        placeholder="Ej: TA: 120/80, FC: 78, FR: 18, Temp: 36.5°C. Abdomen blando, doloroso a la palpación en FID..."
                      />
                    )}
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
                  <Controller
                    name="analisis"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        multiline
                        rows={4}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || `${field.value?.length || 0} caracteres`}
                        placeholder="Ej: Probable apendicitis aguda. Paciente estable hemodinámicamente, requiere valoración quirúrgica..."
                      />
                    )}
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
                  <Controller
                    name="plan"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        multiline
                        rows={4}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || `${field.value?.length || 0} caracteres`}
                        placeholder="Ej: 1. Ayuno absoluto 2. Solucion Hartmann 1000ml c/8hrs 3. Interconsulta a cirugía general..."
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Signos Vitales Adicionales */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Signos Vitales Detallados (Opcional)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Controller
                    name="signos_vitales.presion_sistolica"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        type="number"
                        label="Presión Sistólica"
                        inputProps={{ min: 50, max: 250 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Controller
                    name="signos_vitales.presion_diastolica"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        type="number"
                        label="Presión Diastólica"
                        inputProps={{ min: 30, max: 150 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Controller
                    name="signos_vitales.frecuencia_respiratoria"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        type="number"
                        label="FR (rpm)"
                        inputProps={{ min: 8, max: 60 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Controller
                    name="signos_vitales.saturacion_oxigeno"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        type="number"
                        label="SatO2 (%)"
                        inputProps={{ min: 50, max: 100 }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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
              onClick={handleSubmit(onSubmit)}
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