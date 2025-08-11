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
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
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
  
  // Form data
  const [formData, setFormData] = useState<CreatePatientRequest>({
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
      relacion: '',
      telefono: ''
    },
    seguroMedico: {
      aseguradora: '',
      numeroPoliza: '',
      vigencia: ''
    }
  });

  const steps = [
    'Datos Personales',
    'Información de Contacto',
    'Información Médica'
  ];

  useEffect(() => {
    if (open) {
      if (editingPatient) {
        // Llenar formulario con datos del paciente a editar
        setFormData({
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
            relacion: '',
            telefono: ''
          },
          seguroMedico: editingPatient.seguroMedico || {
            aseguradora: '',
            numeroPoliza: '',
            vigencia: ''
          }
        });
        // Si hay código postal, no usar autocompletado por defecto para permitir edición manual
        setUseAddressAutocomplete(false);
      } else {
        resetForm();
      }
    }
  }, [open, editingPatient]);

  const resetForm = () => {
    setActiveStep(0);
    setError(null);
    setFormData({
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
        relacion: '',
        telefono: ''
      },
      seguroMedico: {
        aseguradora: '',
        numeroPoliza: '',
        vigencia: ''
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreatePatientRequest],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddressSelected = (addressInfo: {
    codigoPostal: string;
    estado: string;
    ciudad: string;
    municipio: string;
    colonia?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      codigoPostal: addressInfo.codigoPostal,
      estado: addressInfo.estado,
      ciudad: addressInfo.ciudad,
      // Si hay colonia seleccionada, incluirla en la dirección
      direccion: addressInfo.colonia 
        ? `${addressInfo.colonia}, ${addressInfo.municipio}`
        : prev.direccion
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.nombre && formData.apellidoPaterno && formData.fechaNacimiento && formData.genero);
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    } else {
      setError('Por favor complete los campos requeridos');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      setError('Por favor complete los campos requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean up empty fields
      const cleanFormData = { ...formData };
      
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
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Paterno *"
                value={formData.apellidoPaterno}
                onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Materno"
                value={formData.apellidoMaterno}
                onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento *"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.genero}
                  label="Género *"
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                >
                  {Object.entries(GENDER_OPTIONS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Sangre</InputLabel>
                <Select
                  value={formData.tipoSangre || ''}
                  label="Tipo de Sangre"
                  onChange={(e) => handleInputChange('tipoSangre', e.target.value)}
                >
                  <MenuItem value="">No especificado</MenuItem>
                  {BLOOD_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={formData.estadoCivil || 'soltero'}
                  label="Estado Civil"
                  onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                >
                  {Object.entries(CIVIL_STATUS_OPTIONS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ocupación"
                value={formData.ocupacion}
                onChange={(e) => handleInputChange('ocupacion', e.target.value)}
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
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                  initialPostalCode={formData.codigoPostal}
                  disabled={loading}
                />
              </Grid>
            ) : (
              // Campos manuales
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    value={formData.codigoPostal}
                    onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                    placeholder="5 dígitos"
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección Completa"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Calle, número, colonia..."
                multiline
                rows={2}
                helperText={useAddressAutocomplete 
                  ? "La colonia se completará automáticamente. Agrega calle y número."
                  : "Ingresa la dirección completa: calle, número, colonia"
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Contacto de Emergencia
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Contacto"
                value={formData.contactoEmergencia?.nombre || ''}
                onChange={(e) => handleInputChange('contactoEmergencia.nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono del Contacto"
                value={formData.contactoEmergencia?.telefono || ''}
                onChange={(e) => handleInputChange('contactoEmergencia.telefono', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relación"
                value={formData.contactoEmergencia?.relacion || ''}
                onChange={(e) => handleInputChange('contactoEmergencia.relacion', e.target.value)}
                placeholder="ej. padre, madre, cónyuge, hermano, etc."
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
              <TextField
                fullWidth
                label="Alergias"
                multiline
                rows={2}
                value={formData.alergias}
                onChange={(e) => handleInputChange('alergias', e.target.value)}
                placeholder="Describa las alergias conocidas..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medicamentos Actuales"
                multiline
                rows={2}
                value={formData.medicamentosActuales}
                onChange={(e) => handleInputChange('medicamentosActuales', e.target.value)}
                placeholder="Liste los medicamentos que toma actualmente..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Antecedentes Patológicos"
                multiline
                rows={3}
                value={formData.antecedentesPatologicos}
                onChange={(e) => handleInputChange('antecedentesPatologicos', e.target.value)}
                placeholder="Enfermedades o cirugías previas..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Antecedentes Familiares"
                multiline
                rows={3}
                value={formData.antecedentesFamiliares}
                onChange={(e) => handleInputChange('antecedentesFamiliares', e.target.value)}
                placeholder="Enfermedades hereditarias en la familia..."
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Seguro Médico (Opcional)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Aseguradora"
                value={formData.seguroMedico?.aseguradora || ''}
                onChange={(e) => handleInputChange('seguroMedico.aseguradora', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Póliza"
                value={formData.seguroMedico?.numeroPoliza || ''}
                onChange={(e) => handleInputChange('seguroMedico.numeroPoliza', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vigencia"
                type="date"
                value={formData.seguroMedico?.vigencia || ''}
                onChange={(e) => handleInputChange('seguroMedico.vigencia', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
            onClick={handleSubmit}
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