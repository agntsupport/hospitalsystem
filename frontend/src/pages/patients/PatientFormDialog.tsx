import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  Person as PersonIcon,
  ContactPhone as ContactIcon,
  MedicalServices as MedicalIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

import { patientsService } from '@/services/patientsService';
import { Patient, CreatePatientRequest, GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPES, RELATIONSHIP_OPTIONS, RELATIONSHIP_LABELS } from '@/types/patients.types';
import { patientFormSchema, PatientFormValues } from '@/schemas/patients.schemas';
import { toast } from 'react-toastify';
import PostalCodeAutocomplete from '@/components/common/PostalCodeAutocomplete';

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onPatientCreated: () => void;
  editingPatient?: Patient | null;
}

const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  onClose,
  onPatientCreated,
  editingPatient,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAddressAutocomplete, setUseAddressAutocomplete] = useState(true);

  // Default form values
  const defaultValues: PatientFormValues = {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    genero: 'M',
    tipoSangre: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    ocupacion: '',
    estadoCivil: 'soltero',
    religion: '',
    alergias: '',
    medicamentosActuales: '',
    antecedentesPatologicos: '',
    antecedentesFamiliares: '',
    contactoEmergencia: {
      nombre: '',
      relacion: 'padre',
      telefono: ''
    },
    seguroMedico: {
      aseguradora: '',
      numeroPoliza: '',
      vigencia: ''
    }
  };

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<PatientFormValues>({
    resolver: yupResolver(patientFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const watchedValues = watch();

  const steps = [
    'Datos Personales',
    'Información de Contacto',
    'Información Médica'
  ];

  useEffect(() => {
    if (open) {
      if (editingPatient) {
        // Llenar formulario con datos del paciente a editar
        const editingData: PatientFormValues = {
          nombre: editingPatient.nombre || '',
          apellidoPaterno: editingPatient.apellidoPaterno || '',
          apellidoMaterno: editingPatient.apellidoMaterno || '',
          fechaNacimiento: editingPatient.fechaNacimiento 
            ? new Date(editingPatient.fechaNacimiento).toISOString().split('T')[0] 
            : '',
          genero: editingPatient.genero || 'M',
          tipoSangre: editingPatient.tipoSangre || '',
          telefono: editingPatient.telefono || '',
          email: editingPatient.email || '',
          direccion: editingPatient.direccion || '',
          ciudad: editingPatient.ciudad || '',
          estado: editingPatient.estado || '',
          codigoPostal: editingPatient.codigoPostal || '',
          ocupacion: editingPatient.ocupacion || '',
          estadoCivil: editingPatient.estadoCivil || 'soltero',
          religion: editingPatient.religion || '',
          alergias: editingPatient.alergias || '',
          medicamentosActuales: editingPatient.medicamentosActuales || '',
          antecedentesPatologicos: editingPatient.antecedentesPatologicos || '',
          antecedentesFamiliares: editingPatient.antecedentesFamiliares || '',
          contactoEmergencia: editingPatient.contactoEmergencia || {
            nombre: '',
            relacion: 'padre',
            telefono: ''
          },
          seguroMedico: editingPatient.seguroMedico || {
            aseguradora: '',
            numeroPoliza: '',
            vigencia: ''
          }
        };
        
        reset(editingData);
        // Si hay código postal, no usar autocompletado por defecto para permitir edición manual
        setUseAddressAutocomplete(false);
      } else {
        resetForm();
      }
    }
  }, [open, editingPatient, reset]);

  const resetForm = () => {
    setActiveStep(0);
    setError(null);
    setUseAddressAutocomplete(true);
    reset(defaultValues);
  };

  const handleAddressSelected = (addressInfo: {
    codigoPostal: string;
    estado: string;
    ciudad: string;
    municipio: string;
    colonia?: string;
  }) => {
    setValue('codigoPostal', addressInfo.codigoPostal);
    setValue('estado', addressInfo.estado);
    setValue('ciudad', addressInfo.ciudad);
    
    // Si hay colonia seleccionada, incluirla en la dirección
    if (addressInfo.colonia) {
      const currentDireccion = watchedValues.direccion;
      setValue('direccion', `${addressInfo.colonia}, ${addressInfo.municipio}`);
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(step);
    const result = await trigger(fieldsToValidate);
    return result;
  };

  const getFieldsForStep = (step: number): (keyof PatientFormValues)[] => {
    switch (step) {
      case 0:
        return ['nombre', 'apellidoPaterno', 'fechaNacimiento', 'genero'];
      case 1:
        return []; // Todos los campos de contacto son opcionales
      case 2:
        return []; // Todos los campos médicos son opcionales
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(activeStep);
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    } else {
      setError('Por favor complete los campos requeridos y corrija los errores');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const onFormSubmit = async (data: PatientFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Clean up empty fields
      const cleanFormData = { ...data };
      
      // Remove empty contact emergency if no data
      if (!cleanFormData.contactoEmergencia?.nombre) {
        delete cleanFormData.contactoEmergencia;
      }
      
      // Remove empty insurance if no data
      if (!cleanFormData.seguroMedico?.aseguradora) {
        delete cleanFormData.seguroMedico;
      }

      let response;
      if (editingPatient) {
        // Actualizar paciente existente
        response = await patientsService.updatePatient(editingPatient.id, cleanFormData);
      } else {
        // Crear nuevo paciente
        response = await patientsService.createPatient(cleanFormData);
      }

      if (response.success) {
        toast.success(editingPatient ? 'Paciente actualizado exitosamente' : 'Paciente creado exitosamente');
        onPatientCreated();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error(`Error ${editingPatient ? 'updating' : 'creating'} patient:`, error);
      const errorMessage = error?.message || error?.error || `Error al ${editingPatient ? 'actualizar' : 'crear'} paciente`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Datos Personales
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre *"
                    required
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="apellidoPaterno"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Apellido Paterno *"
                    required
                    error={!!errors.apellidoPaterno}
                    helperText={errors.apellidoPaterno?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="apellidoMaterno"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Apellido Materno"
                    error={!!errors.apellidoMaterno}
                    helperText={errors.apellidoMaterno?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="fechaNacimiento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fecha de Nacimiento *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    required
                    error={!!errors.fechaNacimiento}
                    helperText={errors.fechaNacimiento?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="genero"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.genero}>
                    <InputLabel>Género *</InputLabel>
                    <Select
                      {...field}
                      label="Género *"
                    >
                      {Object.entries(GENDER_OPTIONS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.genero && (
                      <FormHelperText>{errors.genero.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="tipoSangre"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.tipoSangre}>
                    <InputLabel>Tipo de Sangre</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Sangre"
                    >
                      <MenuItem value="">No especificado</MenuItem>
                      {BLOOD_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.tipoSangre && (
                      <FormHelperText>{errors.tipoSangre.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="estadoCivil"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.estadoCivil}>
                    <InputLabel>Estado Civil</InputLabel>
                    <Select
                      {...field}
                      label="Estado Civil"
                    >
                      {Object.entries(CIVIL_STATUS_OPTIONS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.estadoCivil && (
                      <FormHelperText>{errors.estadoCivil.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="ocupacion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ocupación"
                    error={!!errors.ocupacion}
                    helperText={errors.ocupacion?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="religion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Religión"
                    error={!!errors.religion}
                    helperText={errors.religion?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactIcon />
                Información de Contacto
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono"
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Sección de Dirección con Autocompletado */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon />
                  Dirección y Ubicación
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setUseAddressAutocomplete(!useAddressAutocomplete)}
                >
                  {useAddressAutocomplete ? 'Llenar Manual' : 'Usar Autocompletado'}
                </Button>
              </Box>
            </Grid>

            {useAddressAutocomplete ? (
              // Autocompletado de Código Postal
              <Grid item xs={12}>
                <PostalCodeAutocomplete
                  onAddressSelected={handleAddressSelected}
                  initialPostalCode={watchedValues.codigoPostal}
                  disabled={loading}
                />
              </Grid>
            ) : (
              // Campos manuales
              <>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="codigoPostal"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Código Postal"
                        placeholder="5 dígitos"
                        inputProps={{ maxLength: 5 }}
                        error={!!errors.codigoPostal}
                        helperText={errors.codigoPostal?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="ciudad"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Ciudad"
                        error={!!errors.ciudad}
                        helperText={errors.ciudad?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Estado"
                        error={!!errors.estado}
                        helperText={errors.estado?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección Completa"
                    placeholder="Calle, número, colonia..."
                    multiline
                    rows={2}
                    error={!!errors.direccion}
                    helperText={
                      errors.direccion?.message ||
                      (useAddressAutocomplete 
                        ? "La colonia se completará automáticamente. Agrega calle y número."
                        : "Ingresa la dirección completa: calle, número, colonia"
                      )
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Contacto de Emergencia
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactoEmergencia.nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Contacto"
                    error={!!errors.contactoEmergencia?.nombre}
                    helperText={errors.contactoEmergencia?.nombre?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactoEmergencia.telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono del Contacto"
                    error={!!errors.contactoEmergencia?.telefono}
                    helperText={errors.contactoEmergencia?.telefono?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="contactoEmergencia.relacion"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.contactoEmergencia?.relacion}>
                    <InputLabel>Relación</InputLabel>
                    <Select
                      {...field}
                      label="Relación"
                    >
                      <MenuItem value="padre">Padre</MenuItem>
                      <MenuItem value="madre">Madre</MenuItem>
                      <MenuItem value="hijo">Hijo</MenuItem>
                      <MenuItem value="hija">Hija</MenuItem>
                      <MenuItem value="conyuge">Cónyuge</MenuItem>
                      <MenuItem value="hermano">Hermano</MenuItem>
                      <MenuItem value="hermana">Hermana</MenuItem>
                      <MenuItem value="abuelo">Abuelo</MenuItem>
                      <MenuItem value="abuela">Abuela</MenuItem>
                      <MenuItem value="tio">Tío</MenuItem>
                      <MenuItem value="tia">Tía</MenuItem>
                      <MenuItem value="primo">Primo</MenuItem>
                      <MenuItem value="prima">Prima</MenuItem>
                      <MenuItem value="amigo">Amigo</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                    {errors.contactoEmergencia?.relacion && (
                      <FormHelperText>{errors.contactoEmergencia.relacion.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalIcon />
                Información Médica
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="alergias"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Alergias"
                    multiline
                    rows={2}
                    placeholder="Describa las alergias conocidas..."
                    error={!!errors.alergias}
                    helperText={errors.alergias?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="medicamentosActuales"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Medicamentos Actuales"
                    multiline
                    rows={2}
                    placeholder="Liste los medicamentos que toma actualmente..."
                    error={!!errors.medicamentosActuales}
                    helperText={errors.medicamentosActuales?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="antecedentesPatologicos"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Antecedentes Patológicos"
                    multiline
                    rows={3}
                    placeholder="Enfermedades o cirugías previas..."
                    error={!!errors.antecedentesPatologicos}
                    helperText={errors.antecedentesPatologicos?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="antecedentesFamiliares"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Antecedentes Familiares"
                    multiline
                    rows={3}
                    placeholder="Enfermedades hereditarias en la familia..."
                    error={!!errors.antecedentesFamiliares}
                    helperText={errors.antecedentesFamiliares?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Seguro Médico (Opcional)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="seguroMedico.aseguradora"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Aseguradora"
                    error={!!errors.seguroMedico?.aseguradora}
                    helperText={errors.seguroMedico?.aseguradora?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="seguroMedico.numeroPoliza"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Póliza"
                    error={!!errors.seguroMedico?.numeroPoliza}
                    helperText={errors.seguroMedico?.numeroPoliza?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="seguroMedico.vigencia"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Vigencia"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.seguroMedico?.vigencia}
                    helperText={errors.seguroMedico?.vigencia?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingPatient ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          <CancelIcon sx={{ mr: 1 }} />
          Cancelar
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        {activeStep !== 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        )}
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit(onFormSubmit)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading 
              ? (editingPatient ? 'Actualizando...' : 'Guardando...') 
              : (editingPatient ? 'Actualizar Paciente' : 'Guardar Paciente')
            }
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatientFormDialog;