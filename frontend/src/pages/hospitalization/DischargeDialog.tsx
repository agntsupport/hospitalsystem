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
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ExitToApp as ExitToAppIcon,
  Assignment as AssignmentIcon,
  LocalPharmacy as LocalPharmacyIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Event as EventIcon,
  Print as PrintIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '@/hooks/useAuth';
import hospitalizationService from '@/services/hospitalizationService';
import { toast } from 'react-toastify';
import { HospitalAdmission, DischargeType, HospitalDischargeForm } from '@/types/hospitalization.types';
import dayjs, { Dayjs } from 'dayjs';
import { dischargeFormSchema, DischargeFormValues } from '@/schemas/hospitalization.schemas';

interface DischargeDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
  onSuccess: () => void;
}

// Default values matching the schema
const defaultValues: DischargeFormValues = {
  tipoAlta: 'alta_medica',
  diagnosticoFinal: '',
  resumenEstancia: '',
  condicionAlta: 'estable',
  planSeguimiento: '',
  medicamentosAlta: '',
  recomendaciones: '',
  citaControl: '',
  requiereCirugia: false,
  requiereRehabilitacion: false,
};

const tiposAlta = [
  { value: 'alta_medica', label: 'Alta Médica', color: 'success' },
  { value: 'alta_voluntaria', label: 'Alta Voluntaria', color: 'warning' },
  { value: 'traslado', label: 'Traslado', color: 'info' },
  { value: 'defuncion', label: 'Defunción', color: 'error' },
];

const condicionesAlta = [
  { value: 'estable', label: 'Estable', color: 'success' },
  { value: 'delicado', label: 'Delicado', color: 'warning' },
  { value: 'grave', label: 'Grave', color: 'error' },
  { value: 'fallecido', label: 'Fallecido', color: 'error' },
];

const especialidadesControl = [
  'Medicina Interna',
  'Cardiología',
  'Neurología',
  'Endocrinología',
  'Gastroenterología',
  'Oncología',
  'Cirugía General',
  'Traumatología',
  'Urología',
  'Ginecología',
  'Pediatría',
  'Consulta Externa',
];

const viasAdministracion = [
  'Oral',
  'Sublingual',
  'Intramuscular',
  'Intravenosa',
  'Subcutánea',
  'Tópica',
  'Inhalatoria',
  'Rectal',
  'Vaginal',
  'Oftálmica',
  'Ótica',
];

const frecuenciasMedicamentos = [
  'Cada 4 horas',
  'Cada 6 horas',
  'Cada 8 horas',
  'Cada 12 horas',
  'Cada 24 horas',
  'Dos veces al día',
  'Tres veces al día',
  'Una vez al día',
  'Según necesidad',
  'En ayunas',
  'Con alimentos',
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
      id={`discharge-tabpanel-${index}`}
      aria-labelledby={`discharge-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const DischargeDialog: React.FC<DischargeDialogProps> = ({
  open,
  onClose,
  admission,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<DischargeFormValues>({
    resolver: yupResolver(dischargeFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = watch();

  const steps = [
    {
      label: 'Información Básica del Alta',
      icon: <ExitToAppIcon />,
    },
    {
      label: 'Diagnósticos y Resumen',
      icon: <AssignmentIcon />,
    },
    {
      label: 'Medicamentos y Recomendaciones',
      icon: <LocalPharmacyIcon />,
    },
  ];

  useEffect(() => {
    if (open && admission) {
      // Pre-cargar datos del ingreso
      reset({
        ...defaultValues,
        diagnosticoFinal: admission.diagnosticoIngreso,
      });
    }
  }, [open, admission, reset]);


  const handleNext = async () => {
    // Validar solo los campos del paso actual
    let fieldsToValidate: (keyof DischargeFormValues)[] = [];

    if (activeStep === 0) {
      // Paso 1: Información Básica
      fieldsToValidate = ['tipoAlta', 'condicionAlta'];
    } else if (activeStep === 1) {
      // Paso 2: Diagnósticos y Resumen
      fieldsToValidate = ['diagnosticoFinal', 'resumenEstancia'];
    }
    // Paso 3 no necesita validación parcial (submit final valida todo)

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };



  const onSubmit = async (data: DischargeFormValues) => {
    if (!admission) return;

    setLoading(true);
    try {
      const response = await hospitalizationService.createDischarge(admission.id, {
        tipoAlta: data.tipoAlta as DischargeType,
        estadoAlta: data.condicionAlta as 'mejorado' | 'curado' | 'igual' | 'empeorado',
        diagnosticoEgreso: data.diagnosticoFinal || '',
        diagnosticosSecundarios: [],
        procedimientosRealizados: [],
        resumenEstancia: data.resumenEstancia || '',
        medicamentosAlta: [],
        recomendacionesGenerales: data.recomendaciones || '',
        cuidadosDomiciliarios: [],
        signosAlarma: []
      } as HospitalDischargeForm);
      
      if (response.success) {
        toast.success('Alta hospitalaria procesada exitosamente');
        onSuccess();
        handleClose();
      } else {
        toast.error(response.message || 'Error al procesar alta hospitalaria');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar alta hospitalaria');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setActiveStep(0);
    onClose();
  };

  if (!admission) return null;

  const getTipoAltaInfo = (tipo: string) => {
    return tiposAlta.find(t => t.value === tipo) || tiposAlta[0];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xl" 
      fullWidth
      closeAfterTransition={false}
      PaperProps={{
        sx: { height: '95vh', maxHeight: '95vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ExitToAppIcon color="primary" />
            <Box>
              <Typography variant="h6">Alta Hospitalaria</Typography>
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
        <Box sx={{ p: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel icon={step.icon}>
                  <Typography variant="caption">{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box>
            {/* Paso 1: Información Básica del Alta */}
            {activeStep === 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExitToAppIcon color="primary" />
                    Información Básica del Alta
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Información del paciente */}
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>Paciente:</strong> {admission.paciente.nombre} • 
                          <strong> Días de estancia:</strong> {admission.diasEstancia ?? hospitalizationService.calculateStayDays(admission.fechaIngreso, admission.fechaAlta)} • 
                          <strong> Diagnóstico de ingreso:</strong> {admission.diagnosticoIngreso}
                        </Typography>
                      </Alert>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="tipoAlta"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormControl fullWidth required error={!!fieldState.error}>
                            <InputLabel>Tipo de Alta</InputLabel>
                            <Select
                              {...field}
                              label="Tipo de Alta"
                            >
                              {tiposAlta.map((tipo) => (
                                <MenuItem key={tipo.value} value={tipo.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Chip 
                                      label={tipo.label} 
                                      size="small" 
                                      color={tipo.color as any}
                                    />
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

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="condicionAlta"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormControl fullWidth required error={!!fieldState.error}>
                            <InputLabel>Condición al Alta</InputLabel>
                            <Select
                              {...field}
                              label="Condición al Alta"
                            >
                              {condicionesAlta.map((condicion) => (
                                <MenuItem key={condicion.value} value={condicion.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Chip 
                                      label={condicion.label} 
                                      size="small" 
                                      color={condicion.color as any}
                                    />
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

                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          El alta será procesada el día de hoy a las {dayjs().format('HH:mm')} hrs.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Diagnósticos y Resumen */}
            {activeStep === 1 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    Diagnósticos y Resumen de Estancia
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Controller
                        name="diagnosticoFinal"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            required
                            label="Diagnóstico Final"
                            multiline
                            rows={2}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>


                    <Grid item xs={12}>
                      <Controller
                        name="resumenEstancia"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            required
                            label="Resumen de Estancia"
                            multiline
                            rows={4}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message || `${field.value?.length || 0} caracteres (mínimo 20)`}
                            placeholder="Descripción detallada de la evolución del paciente durante su estancia hospitalaria..."
                          />
                        )}
                      />
                    </Grid>

                    {(watchedValues.tipoAlta === 'alta_medica' || watchedValues.tipoAlta === 'alta_voluntaria') && (
                      <Grid item xs={12}>
                        <Controller
                          name="planSeguimiento"
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              fullWidth
                              required
                              label="Plan de Seguimiento"
                              multiline
                              rows={3}
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              placeholder="Plan de seguimiento para el paciente tras el alta..."
                            />
                          )}
                        />
                      </Grid>
                    )}

                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Medicamentos y Recomendaciones */}
            {activeStep === 2 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalPharmacyIcon color="primary" />
                    Medicamentos y Recomendaciones al Alta
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Controller
                        name="medicamentosAlta"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Medicamentos al Alta"
                            multiline
                            rows={4}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            placeholder="Lista de medicamentos, dosis, frecuencia y duración del tratamiento...&#10;&#10;Ej:&#10;1. Paracetamol 500mg cada 8 horas por 5 días&#10;2. Omeprazol 20mg cada 12 horas por 10 días"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="recomendaciones"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Recomendaciones Generales"
                            multiline
                            rows={4}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            placeholder="Recomendaciones para el cuidado domiciliario del paciente...&#10;&#10;Ej:&#10;- Reposo relativo por 48 horas&#10;- Dieta blanda por 3 días&#10;- Signos de alarma: fiebre, dolor intenso, vómito persistente"
                          />
                        )}
                      />
                    </Grid>

                    {watchedValues.tipoAlta === 'alta_medica' && (
                      <Grid item xs={12}>
                        <Controller
                          name="citaControl"
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              fullWidth
                              required
                              label="Cita de Control"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message || 'Fecha de cita de control (debe ser en el futuro)'}
                            />
                          )}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Indicaciones Especiales</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name="requiereCirugia"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    {...field}
                                    checked={field.value}
                                  />
                                }
                                label="Requiere Cirugía Posterior"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name="requiereRehabilitacion"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    {...field}
                                    checked={field.value}
                                  />
                                }
                                label="Requiere Rehabilitación"
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    {(watchedValues.requiereCirugia || watchedValues.requiereRehabilitacion) && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            {watchedValues.requiereCirugia && '• Se programará cirugía posterior según disponibilidad.'}
                            {watchedValues.requiereRehabilitacion && '• Se referirá a rehabilitación para seguimiento.'}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}


          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Anterior
        </Button>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={loading}
            startIcon={<CheckIcon />}
          >
            {loading ? 'Procesando Alta...' : 'Procesar Alta Hospitalaria'}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DischargeDialog;