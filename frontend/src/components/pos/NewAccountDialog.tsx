import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

import { posService } from '@/services/posService';
import { employeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import { AttentionType, PatientAccountFormData } from '@/types/pos.types';
import { Patient } from '@/types/patient.types';
import { Employee } from '@/types/employee.types';
import { newAccountSchema, NewAccountFormValues } from '@/schemas/pos.schemas';

interface NewAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

const NewAccountDialog: React.FC<NewAccountDialogProps> = ({
  open,
  onClose,
  onAccountCreated,
}) => {
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewAccountFormValues>({
    resolver: yupResolver(newAccountSchema),
    defaultValues: {
      pacienteId: 0,
      tipoAtencion: 'consulta_general',
      anticipo: 0,
      medicoTratanteId: undefined,
      observaciones: '',
    },
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Employee | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const attentionTypes: { value: AttentionType; label: string }[] = [
    { value: 'consulta_general', label: 'Consulta General' },
    { value: 'urgencia', label: 'Urgencia' },
    { value: 'hospitalizacion', label: 'Hospitalización' },
  ];

  const searchPatients = async (query: string) => {
    if (query.length < 2) return;
    
    setSearchLoading(true);
    try {
      const response = await patientService.searchPatients(query, 10);
      if (response.success) {
        setPatients(response.data.patients);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchDoctors = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      const response = await employeeService.searchEmployees(query, 10);
      if (response.success) {
        // Filtrar solo médicos
        const medicDoctors = response.data.employees.filter(
          emp => emp.tipoEmpleado === 'medico_especialista' || emp.tipoEmpleado === 'medico_residente'
        );
        setDoctors(medicDoctors);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
    }
  };

  const onSubmit = async (data: NewAccountFormValues) => {
    if (!selectedPatient) {
      setError('Debe seleccionar un paciente');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountData: PatientAccountFormData = {
        pacienteId: selectedPatient.id,
        tipoAtencion: data.tipoAtencion,
        anticipo: data.anticipo || 0,
        medicoTratanteId: selectedDoctor?.id,
        observaciones: data.observaciones || '',
      };

      const response = await posService.createPatientAccount(accountData);
      
      if (response.success) {
        onAccountCreated();
        handleClose();
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setValue('pacienteId', patient.id);
    } else {
      setValue('pacienteId', 0);
    }
  };

  const handleDoctorSelect = (doctor: Employee | null) => {
    setSelectedDoctor(doctor);
    if (doctor) {
      setValue('medicoTratanteId', doctor.id);
    } else {
      setValue('medicoTratanteId', undefined);
    }
  };

  const handleClose = () => {
    reset({
      pacienteId: 0,
      tipoAtencion: 'consulta_general',
      anticipo: 0,
      medicoTratanteId: undefined,
      observaciones: '',
    });
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PersonAddIcon />
        Nueva Cuenta de Paciente
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Selección de Paciente */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Paciente *
              </Typography>
              <Controller
                name="pacienteId"
                control={control}
                render={({ field, fieldState }) => (
                  <Box>
                    <Autocomplete
                      options={patients}
                      getOptionLabel={(option) => 
                        `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`
                      }
                      value={selectedPatient}
                      onChange={(_, newValue) => handlePatientSelect(newValue)}
                      onInputChange={(_, newInputValue) => {
                        searchPatients(newInputValue);
                      }}
                      loading={searchLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Buscar paciente por nombre..."
                          fullWidth
                          error={!!fieldState.error}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2">
                              {option.nombre} {option.apellidoPaterno} {option.apellidoMaterno}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.telefono} | {option.email || 'Sin email'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      noOptionsText="No se encontraron pacientes"
                    />
                    {fieldState.error && (
                      <FormHelperText error>{fieldState.error.message}</FormHelperText>
                    )}
                  </Box>
                )}
              />
            </Grid>

          {/* Tipo de Atención */}
          <Grid item xs={12} md={6}>
            <Controller
              name="tipoAtencion"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>Tipo de Atención *</InputLabel>
                  <Select
                    {...field}
                    label="Tipo de Atención *"
                  >
                    {attentionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
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

          {/* Anticipo */}
          <Grid item xs={12} md={6}>
            <Controller
              name="anticipo"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Anticipo"
                  type="number"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  inputProps={{
                    min: 0,
                    step: 0.01
                  }}
                />
              )}
            />
          </Grid>

          {/* Médico Tratante */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Médico Tratante
            </Typography>
            <Controller
              name="medicoTratanteId"
              control={control}
              render={({ field, fieldState }) => (
                <Box>
                  <Autocomplete
                    options={doctors}
                    getOptionLabel={(option) => 
                      `Dr(a). ${option.nombre} ${option.apellidoPaterno} - ${option.especialidad || 'Sin especialidad'}`
                    }
                    value={selectedDoctor}
                    onChange={(_, newValue) => handleDoctorSelect(newValue)}
                    onInputChange={(_, newInputValue) => {
                      searchDoctors(newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Buscar médico..."
                        fullWidth
                        error={!!fieldState.error}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">
                            Dr(a). {option.nombre} {option.apellidoPaterno}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.especialidad || 'Sin especialidad'} | {option.tipoEmpleado}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    noOptionsText="No se encontraron médicos"
                  />
                  {fieldState.error && (
                    <FormHelperText error>{fieldState.error.message}</FormHelperText>
                  )}
                </Box>
              )}
            />
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <Controller
              name="observaciones"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={3}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Observaciones adicionales sobre la cuenta..."
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !selectedPatient}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewAccountDialog;