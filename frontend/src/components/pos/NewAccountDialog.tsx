import React, { useState } from 'react';
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
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

import { posService } from '@/services/posService';
import { employeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import { AttentionType, PatientAccountFormData } from '@/types/pos.types';
import { Patient } from '@/types/patient.types';
import { Employee } from '@/types/employee.types';

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
  const [formData, setFormData] = useState<PatientAccountFormData>({
    pacienteId: 0,
    tipoAtencion: 'consulta_general',
    anticipo: 0,
    medicoTratanteId: undefined,
    observaciones: '',
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

  const handleSubmit = async () => {
    if (!selectedPatient) {
      setError('Debe seleccionar un paciente');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountData: PatientAccountFormData = {
        ...formData,
        pacienteId: selectedPatient.id,
        medicoTratanteId: selectedDoctor?.id,
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

  const handleClose = () => {
    setFormData({
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
            <Autocomplete
              options={patients}
              getOptionLabel={(option) => 
                `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`
              }
              value={selectedPatient}
              onChange={(_, newValue) => setSelectedPatient(newValue)}
              onInputChange={(_, newInputValue) => {
                searchPatients(newInputValue);
              }}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar paciente por nombre..."
                  fullWidth
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
          </Grid>

          {/* Tipo de Atención */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Atención *</InputLabel>
              <Select
                value={formData.tipoAtencion}
                label="Tipo de Atención *"
                onChange={(e) => setFormData({
                  ...formData,
                  tipoAtencion: e.target.value as AttentionType
                })}
              >
                {attentionTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Anticipo */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Anticipo"
              type="number"
              value={formData.anticipo}
              onChange={(e) => setFormData({
                ...formData,
                anticipo: parseFloat(e.target.value) || 0
              })}
              inputProps={{
                min: 0,
                step: 0.01
              }}
            />
          </Grid>

          {/* Médico Tratante */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Médico Tratante
            </Typography>
            <Autocomplete
              options={doctors}
              getOptionLabel={(option) => 
                `Dr(a). ${option.nombre} ${option.apellidoPaterno} - ${option.especialidad || 'Sin especialidad'}`
              }
              value={selectedDoctor}
              onChange={(_, newValue) => setSelectedDoctor(newValue)}
              onInputChange={(_, newInputValue) => {
                searchDoctors(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar médico..."
                  fullWidth
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
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({
                ...formData,
                observaciones: e.target.value
              })}
              placeholder="Observaciones adicionales sobre la cuenta..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !selectedPatient}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creando...' : 'Crear Cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewAccountDialog;