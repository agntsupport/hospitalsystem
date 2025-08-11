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
import { HospitalAdmission } from '@/types/hospitalization.types';
import dayjs, { Dayjs } from 'dayjs';

interface DischargeDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
  onSuccess: () => void;
}

interface MedicamentoAlta {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
  viaAdministracion: string;
}

interface CitaControl {
  especialidad: string;
  fechaSugerida: string;
  urgencia: 'rutina' | 'urgente' | 'muy_urgente';
  motivo: string;
  indicaciones: string;
}

interface Incapacidad {
  dias: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  tipo: 'enfermedad_general' | 'accidente_trabajo' | 'maternidad' | 'riesgo_embarazo';
}

interface DischargeFormData {
  // Información básica del alta
  tipoAlta: 'medica' | 'voluntaria' | 'traslado' | 'defuncion' | 'fuga';
  estadoAlta: 'mejorado' | 'curado' | 'igual' | 'empeorado';
  fechaAlta: Dayjs | null;
  horaAlta: string;
  
  // Diagnósticos
  diagnosticoEgreso: string;
  diagnosticosSecundarios: string[];
  procedimientosRealizados: string[];
  
  // Resumen médico
  resumenEstancia: string;
  complicaciones: string[];
  evolucionClinica: string;
  
  // Medicamentos al alta
  medicamentosAlta: MedicamentoAlta[];
  
  // Recomendaciones y cuidados
  recomendacionesGenerales: string;
  cuidadosDomiciliarios: string[];
  signosAlarma: string[];
  actividadFisica: string;
  dietaRecomendada: string;
  
  // Citas de control
  citaControl?: CitaControl;
  requiereCitaControl: boolean;
  
  // Incapacidad
  incapacidad?: Incapacidad;
  requiereIncapacidad: boolean;
  
  // Observaciones finales
  observacionesAlta: string;
  medicoAlta: string;
}

const initialFormData: DischargeFormData = {
  tipoAlta: 'medica',
  estadoAlta: 'mejorado',
  fechaAlta: dayjs(),
  horaAlta: dayjs().format('HH:mm'),
  diagnosticoEgreso: '',
  diagnosticosSecundarios: [],
  procedimientosRealizados: [],
  resumenEstancia: '',
  complicaciones: [],
  evolucionClinica: '',
  medicamentosAlta: [],
  recomendacionesGenerales: '',
  cuidadosDomiciliarios: [],
  signosAlarma: [],
  actividadFisica: '',
  dietaRecomendada: '',
  requiereCitaControl: false,
  requiereIncapacidad: false,
  observacionesAlta: '',
  medicoAlta: '',
};

const tiposAlta = [
  { value: 'medica', label: 'Alta médica (mejorado)', color: 'success' },
  { value: 'voluntaria', label: 'Alta voluntaria', color: 'warning' },
  { value: 'traslado', label: 'Traslado', color: 'info' },
  { value: 'defuncion', label: 'Defunción', color: 'error' },
  { value: 'fuga', label: 'Fuga', color: 'warning' },
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
  const [formData, setFormData] = useState<DischargeFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDiagnosticoSecundario, setNewDiagnosticoSecundario] = useState('');
  const [newProcedimiento, setNewProcedimiento] = useState('');
  const [newComplicacion, setNewComplicacion] = useState('');
  const [newCuidadoDomiciliario, setNewCuidadoDomiciliario] = useState('');
  const [newSignoAlarma, setNewSignoAlarma] = useState('');
  const [newMedicamento, setNewMedicamento] = useState<Partial<MedicamentoAlta>>({
    nombre: '',
    dosis: '',
    frecuencia: '',
    duracion: '',
    indicaciones: '',
    viaAdministracion: 'Oral',
  });

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
      label: 'Medicamentos al Alta',
      icon: <LocalPharmacyIcon />,
    },
    {
      label: 'Recomendaciones y Cuidados',
      icon: <HomeIcon />,
    },
    {
      label: 'Citas e Incapacidades',
      icon: <ScheduleIcon />,
    },
  ];

  useEffect(() => {
    if (open && admission && user) {
      // Pre-cargar datos
      setFormData(prev => ({
        ...prev,
        diagnosticoEgreso: admission.diagnosticoIngreso,
        medicoAlta: user.username,
        fechaAlta: dayjs(),
        horaAlta: dayjs().format('HH:mm'),
      }));
    }
  }, [open, admission, user]);

  const handleInputChange = (field: keyof DischargeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (activeStep) {
      case 0: // Información básica
        if (!formData.tipoAlta) {
          newErrors.tipoAlta = 'El tipo de alta es requerido';
        }
        if (!formData.estadoAlta) {
          newErrors.estadoAlta = 'El estado al alta es requerido';
        }
        if (!formData.fechaAlta) {
          newErrors.fechaAlta = 'La fecha de alta es requerida';
        }
        if (!formData.horaAlta) {
          newErrors.horaAlta = 'La hora de alta es requerida';
        }
        break;

      case 1: // Diagnósticos y resumen
        if (!formData.diagnosticoEgreso.trim()) {
          newErrors.diagnosticoEgreso = 'El diagnóstico de egreso es requerido';
        }
        if (!formData.resumenEstancia.trim() || formData.resumenEstancia.length < 50) {
          newErrors.resumenEstancia = 'El resumen debe tener al menos 50 caracteres';
        }
        if (!formData.evolucionClinica.trim() || formData.evolucionClinica.length < 30) {
          newErrors.evolucionClinica = 'La evolución clínica debe tener al menos 30 caracteres';
        }
        break;

      case 2: // Medicamentos
        // Los medicamentos son opcionales, pero si se agregan deben estar completos
        formData.medicamentosAlta.forEach((med, index) => {
          if (!med.nombre || !med.dosis || !med.frecuencia || !med.duracion) {
            newErrors[`medicamento_${index}`] = `El medicamento ${index + 1} tiene campos faltantes`;
          }
        });
        break;

      case 3: // Recomendaciones
        if (!formData.recomendacionesGenerales.trim() || formData.recomendacionesGenerales.length < 20) {
          newErrors.recomendacionesGenerales = 'Las recomendaciones deben tener al menos 20 caracteres';
        }
        if (formData.cuidadosDomiciliarios.length === 0) {
          newErrors.cuidadosDomiciliarios = 'Debe agregar al menos un cuidado domiciliario';
        }
        if (formData.signosAlarma.length === 0) {
          newErrors.signosAlarma = 'Debe agregar al menos un signo de alarma';
        }
        break;

      case 4: // Citas e incapacidades
        if (formData.requiereCitaControl && formData.citaControl) {
          if (!formData.citaControl.especialidad || !formData.citaControl.fechaSugerida || !formData.citaControl.motivo) {
            newErrors.citaControl = 'Los datos de la cita de control están incompletos';
          }
        }
        if (formData.requiereIncapacidad && formData.incapacidad) {
          if (!formData.incapacidad.dias || !formData.incapacidad.motivo || !formData.incapacidad.fechaInicio) {
            newErrors.incapacidad = 'Los datos de incapacidad están incompletos';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDiagnosticoSecundario = () => {
    if (newDiagnosticoSecundario.trim()) {
      setFormData(prev => ({
        ...prev,
        diagnosticosSecundarios: [...prev.diagnosticosSecundarios, newDiagnosticoSecundario.trim()]
      }));
      setNewDiagnosticoSecundario('');
    }
  };

  const handleRemoveDiagnosticoSecundario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosticosSecundarios: prev.diagnosticosSecundarios.filter((_, i) => i !== index)
    }));
  };

  const handleAddProcedimiento = () => {
    if (newProcedimiento.trim()) {
      setFormData(prev => ({
        ...prev,
        procedimientosRealizados: [...prev.procedimientosRealizados, newProcedimiento.trim()]
      }));
      setNewProcedimiento('');
    }
  };

  const handleRemoveProcedimiento = (index: number) => {
    setFormData(prev => ({
      ...prev,
      procedimientosRealizados: prev.procedimientosRealizados.filter((_, i) => i !== index)
    }));
  };

  const handleAddComplicacion = () => {
    if (newComplicacion.trim()) {
      setFormData(prev => ({
        ...prev,
        complicaciones: [...prev.complicaciones, newComplicacion.trim()]
      }));
      setNewComplicacion('');
    }
  };

  const handleRemoveComplicacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      complicaciones: prev.complicaciones.filter((_, i) => i !== index)
    }));
  };

  const handleAddCuidadoDomiciliario = () => {
    if (newCuidadoDomiciliario.trim()) {
      setFormData(prev => ({
        ...prev,
        cuidadosDomiciliarios: [...prev.cuidadosDomiciliarios, newCuidadoDomiciliario.trim()]
      }));
      setNewCuidadoDomiciliario('');
    }
  };

  const handleRemoveCuidadoDomiciliario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cuidadosDomiciliarios: prev.cuidadosDomiciliarios.filter((_, i) => i !== index)
    }));
  };

  const handleAddSignoAlarma = () => {
    if (newSignoAlarma.trim()) {
      setFormData(prev => ({
        ...prev,
        signosAlarma: [...prev.signosAlarma, newSignoAlarma.trim()]
      }));
      setNewSignoAlarma('');
    }
  };

  const handleRemoveSignoAlarma = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signosAlarma: prev.signosAlarma.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedicamento = () => {
    if (newMedicamento.nombre && newMedicamento.dosis && newMedicamento.frecuencia && newMedicamento.duracion) {
      const medicamento: MedicamentoAlta = {
        id: Date.now().toString(),
        nombre: newMedicamento.nombre!,
        dosis: newMedicamento.dosis!,
        frecuencia: newMedicamento.frecuencia!,
        duracion: newMedicamento.duracion!,
        indicaciones: newMedicamento.indicaciones || '',
        viaAdministracion: newMedicamento.viaAdministracion || 'Oral',
      };
      
      setFormData(prev => ({
        ...prev,
        medicamentosAlta: [...prev.medicamentosAlta, medicamento]
      }));
      
      setNewMedicamento({
        nombre: '',
        dosis: '',
        frecuencia: '',
        duracion: '',
        indicaciones: '',
        viaAdministracion: 'Oral',
      });
    }
  };

  const handleRemoveMedicamento = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicamentosAlta: prev.medicamentosAlta.filter(med => med.id !== id)
    }));
  };

  const handleSubmit = async () => {
    if (!admission) return;

    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    try {
      const dischargeData = {
        tipoAlta: formData.tipoAlta,
        estadoAlta: formData.estadoAlta,
        diagnosticoEgreso: formData.diagnosticoEgreso,
        diagnosticosSecundarios: formData.diagnosticosSecundarios,
        procedimientosRealizados: formData.procedimientosRealizados,
        resumenEstancia: formData.resumenEstancia,
        complicaciones: formData.complicaciones,
        medicamentosAlta: formData.medicamentosAlta.map(med => ({
          nombre: med.nombre,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          duracion: med.duracion,
          indicaciones: med.indicaciones,
        })),
        recomendacionesGenerales: formData.recomendacionesGenerales,
        cuidadosDomiciliarios: formData.cuidadosDomiciliarios,
        signosAlarma: formData.signosAlarma,
        citaControl: formData.requiereCitaControl && formData.citaControl ? {
          especialidad: formData.citaControl.especialidad,
          fechaSugerida: formData.citaControl.fechaSugerida,
          urgencia: formData.citaControl.urgencia,
          observaciones: `${formData.citaControl.motivo}. ${formData.citaControl.indicaciones}`.trim(),
        } : undefined,
        incapacidad: formData.requiereIncapacidad && formData.incapacidad ? {
          dias: formData.incapacidad.dias,
          motivo: formData.incapacidad.motivo,
          fechaInicio: formData.incapacidad.fechaInicio,
          fechaFin: formData.incapacidad.fechaFin,
        } : undefined,
      };

      const response = await hospitalizationService.createDischarge(admission.id, dischargeData);
      
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
    setFormData(initialFormData);
    setActiveStep(0);
    setErrors({});
    setNewDiagnosticoSecundario('');
    setNewProcedimiento('');
    setNewComplicacion('');
    setNewCuidadoDomiciliario('');
    setNewSignoAlarma('');
    setNewMedicamento({
      nombre: '',
      dosis: '',
      frecuencia: '',
      duracion: '',
      indicaciones: '',
      viaAdministracion: 'Oral',
    });
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
                          <strong> Días de estancia:</strong> {admission.diasEstancia} • 
                          <strong> Diagnóstico de ingreso:</strong> {admission.diagnosticoIngreso}
                        </Typography>
                      </Alert>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required error={!!errors.tipoAlta}>
                        <InputLabel>Tipo de Alta</InputLabel>
                        <Select
                          value={formData.tipoAlta}
                          onChange={(e) => handleInputChange('tipoAlta', e.target.value)}
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
                        {errors.tipoAlta && (
                          <FormHelperText>{errors.tipoAlta}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required error={!!errors.estadoAlta}>
                        <InputLabel>Estado al Alta</InputLabel>
                        <Select
                          value={formData.estadoAlta}
                          onChange={(e) => handleInputChange('estadoAlta', e.target.value)}
                          label="Estado al Alta"
                        >
                          <MenuItem value="curado">Curado</MenuItem>
                          <MenuItem value="mejorado">Mejorado</MenuItem>
                          <MenuItem value="igual">Sin cambios</MenuItem>
                          <MenuItem value="empeorado">Empeorado</MenuItem>
                        </Select>
                        {errors.estadoAlta && (
                          <FormHelperText>{errors.estadoAlta}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Fecha de Alta"
                        value={formData.fechaAlta}
                        onChange={(newValue) => handleInputChange('fechaAlta', newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.fechaAlta,
                            helperText: errors.fechaAlta,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="time"
                        label="Hora de Alta"
                        value={formData.horaAlta}
                        onChange={(e) => handleInputChange('horaAlta', e.target.value)}
                        error={!!errors.horaAlta}
                        helperText={errors.horaAlta}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Médico que da de Alta"
                        value={formData.medicoAlta}
                        onChange={(e) => handleInputChange('medicoAlta', e.target.value)}
                        placeholder="Nombre del médico responsable del alta"
                      />
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
                      <TextField
                        fullWidth
                        required
                        label="Diagnóstico Principal de Egreso"
                        multiline
                        rows={2}
                        value={formData.diagnosticoEgreso}
                        onChange={(e) => handleInputChange('diagnosticoEgreso', e.target.value)}
                        error={!!errors.diagnosticoEgreso}
                        helperText={errors.diagnosticoEgreso}
                      />
                    </Grid>

                    {/* Diagnósticos secundarios */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Diagnósticos Secundarios</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Agregar diagnóstico secundario"
                          value={newDiagnosticoSecundario}
                          onChange={(e) => setNewDiagnosticoSecundario(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDiagnosticoSecundario();
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddDiagnosticoSecundario}
                          startIcon={<AddIcon />}
                          sx={{ minWidth: 120 }}
                        >
                          Agregar
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.diagnosticosSecundarios.map((diagnostico, index) => (
                          <Chip
                            key={index}
                            label={diagnostico}
                            onDelete={() => handleRemoveDiagnosticoSecundario(index)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* Procedimientos realizados */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Procedimientos Realizados</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Agregar procedimiento"
                          value={newProcedimiento}
                          onChange={(e) => setNewProcedimiento(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddProcedimiento();
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddProcedimiento}
                          startIcon={<AddIcon />}
                          sx={{ minWidth: 120 }}
                        >
                          Agregar
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.procedimientosRealizados.map((procedimiento, index) => (
                          <Chip
                            key={index}
                            label={procedimiento}
                            onDelete={() => handleRemoveProcedimiento(index)}
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Resumen de Estancia"
                        multiline
                        rows={4}
                        value={formData.resumenEstancia}
                        onChange={(e) => handleInputChange('resumenEstancia', e.target.value)}
                        error={!!errors.resumenEstancia}
                        helperText={errors.resumenEstancia || `${formData.resumenEstancia.length} caracteres (mínimo 50)`}
                        placeholder="Descripción detallada de la evolución del paciente durante su estancia hospitalaria..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Evolución Clínica"
                        multiline
                        rows={3}
                        value={formData.evolucionClinica}
                        onChange={(e) => handleInputChange('evolucionClinica', e.target.value)}
                        error={!!errors.evolucionClinica}
                        helperText={errors.evolucionClinica || `${formData.evolucionClinica.length} caracteres (mínimo 30)`}
                        placeholder="Descripción de la evolución clínica del paciente..."
                      />
                    </Grid>

                    {/* Complicaciones */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Complicaciones (si las hubo)</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Agregar complicación"
                          value={newComplicacion}
                          onChange={(e) => setNewComplicacion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComplicacion();
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddComplicacion}
                          startIcon={<AddIcon />}
                          sx={{ minWidth: 120 }}
                        >
                          Agregar
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.complicaciones.map((complicacion, index) => (
                          <Chip
                            key={index}
                            label={complicacion}
                            onDelete={() => handleRemoveComplicacion(index)}
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Paso 3: Medicamentos al Alta */}
            {activeStep === 2 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalPharmacyIcon color="primary" />
                    Medicamentos al Alta y Recetas
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Formulario para agregar medicamento */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Agregar Medicamento</Typography>
                      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Nombre del Medicamento"
                              value={newMedicamento.nombre}
                              onChange={(e) => setNewMedicamento(prev => ({...prev, nombre: e.target.value}))}
                              placeholder="Ej: Paracetamol"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Dosis"
                              value={newMedicamento.dosis}
                              onChange={(e) => setNewMedicamento(prev => ({...prev, dosis: e.target.value}))}
                              placeholder="Ej: 500mg"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Frecuencia</InputLabel>
                              <Select
                                value={newMedicamento.frecuencia}
                                onChange={(e) => setNewMedicamento(prev => ({...prev, frecuencia: e.target.value}))}
                                label="Frecuencia"
                              >
                                {frecuenciasMedicamentos.map((freq) => (
                                  <MenuItem key={freq} value={freq}>
                                    {freq}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Duración"
                              value={newMedicamento.duracion}
                              onChange={(e) => setNewMedicamento(prev => ({...prev, duracion: e.target.value}))}
                              placeholder="Ej: 7 días, 2 semanas"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Vía de Administración</InputLabel>
                              <Select
                                value={newMedicamento.viaAdministracion}
                                onChange={(e) => setNewMedicamento(prev => ({...prev, viaAdministracion: e.target.value}))}
                                label="Vía de Administración"
                              >
                                {viasAdministracion.map((via) => (
                                  <MenuItem key={via} value={via}>
                                    {via}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Indicaciones Especiales"
                              value={newMedicamento.indicaciones}
                              onChange={(e) => setNewMedicamento(prev => ({...prev, indicaciones: e.target.value}))}
                              placeholder="Ej: Tomar con alimentos"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              onClick={handleAddMedicamento}
                              startIcon={<AddIcon />}
                              disabled={!newMedicamento.nombre || !newMedicamento.dosis || !newMedicamento.frecuencia || !newMedicamento.duracion}
                            >
                              Agregar Medicamento
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>

                    {/* Lista de medicamentos agregados */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Medicamentos al Alta ({formData.medicamentosAlta.length})
                      </Typography>
                      {formData.medicamentosAlta.length === 0 ? (
                        <Alert severity="info">
                          No se han agregado medicamentos al alta. El paciente puede ser dado de alta sin medicamentos.
                        </Alert>
                      ) : (
                        <List>
                          {formData.medicamentosAlta.map((medicamento, index) => (
                            <ListItem key={medicamento.id} divider>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <LocalPharmacyIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle1">
                                      {medicamento.nombre} - {medicamento.dosis}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                      <strong>Frecuencia:</strong> {medicamento.frecuencia} • 
                                      <strong> Duración:</strong> {medicamento.duracion} • 
                                      <strong> Vía:</strong> {medicamento.viaAdministracion}
                                    </Typography>
                                    {medicamento.indicaciones && (
                                      <Typography variant="body2" color="textSecondary">
                                        <strong>Indicaciones:</strong> {medicamento.indicaciones}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title="Eliminar medicamento">
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleRemoveMedicamento(medicamento.id)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>

                    {formData.medicamentosAlta.length > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="warning" icon={<PrintIcon />}>
                          <Typography variant="body2">
                            <strong>Nota:</strong> Se generará una receta médica con todos los medicamentos listados.
                            Asegúrese de que las dosis y frecuencias sean correctas.
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Paso 4: Recomendaciones y Cuidados */}
            {activeStep === 3 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon color="primary" />
                    Recomendaciones y Cuidados Domiciliarios
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Recomendaciones Generales"
                        multiline
                        rows={4}
                        value={formData.recomendacionesGenerales}
                        onChange={(e) => handleInputChange('recomendacionesGenerales', e.target.value)}
                        error={!!errors.recomendacionesGenerales}
                        helperText={errors.recomendacionesGenerales || `${formData.recomendacionesGenerales.length} caracteres (mínimo 20)`}
                        placeholder="Recomendaciones generales para el paciente al alta..."
                      />
                    </Grid>

                    {/* Cuidados domiciliarios */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Cuidados Domiciliarios</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Agregar cuidado domiciliario"
                          value={newCuidadoDomiciliario}
                          onChange={(e) => setNewCuidadoDomiciliario(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCuidadoDomiciliario();
                            }
                          }}
                          error={!!errors.cuidadosDomiciliarios}
                          helperText={errors.cuidadosDomiciliarios}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddCuidadoDomiciliario}
                          startIcon={<AddIcon />}
                          sx={{ minWidth: 120 }}
                        >
                          Agregar
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.cuidadosDomiciliarios.map((cuidado, index) => (
                          <Chip
                            key={index}
                            label={cuidado}
                            onDelete={() => handleRemoveCuidadoDomiciliario(index)}
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* Signos de alarma */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Signos de Alarma</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Agregar signo de alarma"
                          value={newSignoAlarma}
                          onChange={(e) => setNewSignoAlarma(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSignoAlarma();
                            }
                          }}
                          error={!!errors.signosAlarma}
                          helperText={errors.signosAlarma}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddSignoAlarma}
                          startIcon={<WarningIcon />}
                          sx={{ minWidth: 120 }}
                        >
                          Agregar
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.signosAlarma.map((signo, index) => (
                          <Chip
                            key={index}
                            label={signo}
                            onDelete={() => handleRemoveSignoAlarma(index)}
                            color="warning"
                            variant="outlined"
                            icon={<WarningIcon />}
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Actividad Física Recomendada"
                        multiline
                        rows={3}
                        value={formData.actividadFisica}
                        onChange={(e) => handleInputChange('actividadFisica', e.target.value)}
                        placeholder="Recomendaciones sobre actividad física, reposo, ejercicio..."
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Dieta Recomendada"
                        multiline
                        rows={3}
                        value={formData.dietaRecomendada}
                        onChange={(e) => handleInputChange('dietaRecomendada', e.target.value)}
                        placeholder="Recomendaciones dietéticas, restricciones alimentarias..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Paso 5: Citas e Incapacidades */}
            {activeStep === 4 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="primary" />
                    Citas de Control e Incapacidades
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Cita de control */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.requiereCitaControl}
                            onChange={(e) => {
                              handleInputChange('requiereCitaControl', e.target.checked);
                              if (e.target.checked && !formData.citaControl) {
                                handleInputChange('citaControl', {
                                  especialidad: '',
                                  fechaSugerida: dayjs().add(7, 'days').format('YYYY-MM-DD'),
                                  urgencia: 'rutina',
                                  motivo: '',
                                  indicaciones: '',
                                });
                              }
                            }}
                          />
                        }
                        label="Requiere Cita de Control"
                      />
                    </Grid>

                    {formData.requiereCitaControl && (
                      <>
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon /> Cita de Control
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required error={!!errors.citaControl}>
                                  <InputLabel>Especialidad</InputLabel>
                                  <Select
                                    value={formData.citaControl?.especialidad || ''}
                                    onChange={(e) => handleInputChange('citaControl', {
                                      ...formData.citaControl,
                                      especialidad: e.target.value
                                    })}
                                    label="Especialidad"
                                  >
                                    {especialidadesControl.map((esp) => (
                                      <MenuItem key={esp} value={esp}>
                                        {esp}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  required
                                  type="date"
                                  label="Fecha Sugerida"
                                  value={formData.citaControl?.fechaSugerida || ''}
                                  onChange={(e) => handleInputChange('citaControl', {
                                    ...formData.citaControl,
                                    fechaSugerida: e.target.value
                                  })}
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                  <InputLabel>Urgencia</InputLabel>
                                  <Select
                                    value={formData.citaControl?.urgencia || 'rutina'}
                                    onChange={(e) => handleInputChange('citaControl', {
                                      ...formData.citaControl,
                                      urgencia: e.target.value
                                    })}
                                    label="Urgencia"
                                  >
                                    <MenuItem value="rutina">Rutina</MenuItem>
                                    <MenuItem value="urgente">Urgente</MenuItem>
                                    <MenuItem value="muy_urgente">Muy Urgente</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  required
                                  label="Motivo de la Cita"
                                  value={formData.citaControl?.motivo || ''}
                                  onChange={(e) => handleInputChange('citaControl', {
                                    ...formData.citaControl,
                                    motivo: e.target.value
                                  })}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="Indicaciones para la Cita"
                                  value={formData.citaControl?.indicaciones || ''}
                                  onChange={(e) => handleInputChange('citaControl', {
                                    ...formData.citaControl,
                                    indicaciones: e.target.value
                                  })}
                                  placeholder="Estudios previos, preparación especial..."
                                />
                              </Grid>
                            </Grid>
                          </Card>
                        </Grid>
                      </>
                    )}

                    {/* Incapacidad */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.requiereIncapacidad}
                            onChange={(e) => {
                              handleInputChange('requiereIncapacidad', e.target.checked);
                              if (e.target.checked && !formData.incapacidad) {
                                const fechaInicio = dayjs().format('YYYY-MM-DD');
                                handleInputChange('incapacidad', {
                                  dias: 3,
                                  fechaInicio,
                                  fechaFin: dayjs().add(3, 'days').format('YYYY-MM-DD'),
                                  motivo: '',
                                  tipo: 'enfermedad_general',
                                });
                              }
                            }}
                          />
                        }
                        label="Requiere Incapacidad Laboral"
                      />
                    </Grid>

                    {formData.requiereIncapacidad && (
                      <>
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AssignmentIcon /> Incapacidad Laboral
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  required
                                  type="number"
                                  label="Días de Incapacidad"
                                  value={formData.incapacidad?.dias || ''}
                                  onChange={(e) => {
                                    const dias = parseInt(e.target.value) || 0;
                                    const fechaFin = dayjs(formData.incapacidad?.fechaInicio).add(dias, 'days').format('YYYY-MM-DD');
                                    handleInputChange('incapacidad', {
                                      ...formData.incapacidad,
                                      dias,
                                      fechaFin
                                    });
                                  }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">días</InputAdornment>,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                  <InputLabel>Tipo</InputLabel>
                                  <Select
                                    value={formData.incapacidad?.tipo || 'enfermedad_general'}
                                    onChange={(e) => handleInputChange('incapacidad', {
                                      ...formData.incapacidad,
                                      tipo: e.target.value
                                    })}
                                    label="Tipo"
                                  >
                                    <MenuItem value="enfermedad_general">Enfermedad General</MenuItem>
                                    <MenuItem value="accidente_trabajo">Accidente de Trabajo</MenuItem>
                                    <MenuItem value="maternidad">Maternidad</MenuItem>
                                    <MenuItem value="riesgo_embarazo">Riesgo en Embarazo</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  required
                                  type="date"
                                  label="Fecha de Inicio"
                                  value={formData.incapacidad?.fechaInicio || ''}
                                  onChange={(e) => {
                                    const dias = formData.incapacidad?.dias || 0;
                                    const fechaFin = dayjs(e.target.value).add(dias, 'days').format('YYYY-MM-DD');
                                    handleInputChange('incapacidad', {
                                      ...formData.incapacidad,
                                      fechaInicio: e.target.value,
                                      fechaFin
                                    });
                                  }}
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  required
                                  type="date"
                                  label="Fecha de Fin"
                                  value={formData.incapacidad?.fechaFin || ''}
                                  onChange={(e) => handleInputChange('incapacidad', {
                                    ...formData.incapacidad,
                                    fechaFin: e.target.value
                                  })}
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  required
                                  label="Motivo de la Incapacidad"
                                  value={formData.incapacidad?.motivo || ''}
                                  onChange={(e) => handleInputChange('incapacidad', {
                                    ...formData.incapacidad,
                                    motivo: e.target.value
                                  })}
                                />
                              </Grid>
                            </Grid>
                          </Card>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observaciones Finales del Alta"
                        multiline
                        rows={3}
                        value={formData.observacionesAlta}
                        onChange={(e) => handleInputChange('observacionesAlta', e.target.value)}
                        placeholder="Observaciones adicionales, comentarios especiales..."
                      />
                    </Grid>

                    {(formData.requiereCitaControl || formData.requiereIncapacidad) && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          {formData.requiereCitaControl && (
                            <Typography variant="body2">
                              • Se generará una solicitud de cita para {formData.citaControl?.especialidad} 
                              el {formData.citaControl?.fechaSugerida}
                            </Typography>
                          )}
                          {formData.requiereIncapacidad && (
                            <Typography variant="body2">
                              • Se generará certificado de incapacidad por {formData.incapacidad?.dias} días
                              ({formData.incapacidad?.fechaInicio} al {formData.incapacidad?.fechaFin})
                            </Typography>
                          )}
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
            onClick={handleSubmit}
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