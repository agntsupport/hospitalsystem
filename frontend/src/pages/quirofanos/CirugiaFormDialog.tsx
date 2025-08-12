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
  Autocomplete,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { es } from 'date-fns/locale';
import { addHours, isBefore, isAfter } from 'date-fns';
import quirofanosService, { CirugiaQuirofano, Quirofano } from '@/services/quirofanosService';
import { patientsService } from '@/services/patientsService';
import { employeeService } from '@/services/employeeService';

interface CirugiaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cirugia?: CirugiaQuirofano;
}

interface FormData {
  quirofanoId: number | '';
  pacienteId: number | '';
  medicoId: number | '';
  tipoIntervencion: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  observaciones: string;
  equipoMedico: number[];
}

const CirugiaFormDialog: React.FC<CirugiaFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  cirugia
}) => {
  const [formData, setFormData] = useState<FormData>({
    quirofanoId: '',
    pacienteId: '',
    medicoId: '',
    tipoIntervencion: '',
    fechaInicio: null,
    fechaFin: null,
    observaciones: '',
    equipoMedico: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Datos para los selectores
  const [quirofanos, setQuirofanos] = useState<Quirofano[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [personalMedico, setPersonalMedico] = useState<any[]>([]);
  
  // Estado para verificar disponibilidad
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadInitialData();
      if (cirugia) {
        // Cargar datos de la cirugía existente para edición
        setFormData({
          quirofanoId: cirugia.quirofanoId,
          pacienteId: cirugia.pacienteId,
          medicoId: cirugia.medicoId,
          tipoIntervencion: cirugia.tipoIntervencion,
          fechaInicio: cirugia.fechaInicio ? new Date(cirugia.fechaInicio) : null,
          fechaFin: cirugia.fechaFin ? new Date(cirugia.fechaFin) : null,
          observaciones: cirugia.observaciones || '',
          equipoMedico: cirugia.equipoMedico || []
        });
      } else {
        // Resetear formulario para nueva cirugía
        setFormData({
          quirofanoId: '',
          pacienteId: '',
          medicoId: '',
          tipoIntervencion: '',
          fechaInicio: null,
          fechaFin: null,
          observaciones: '',
          equipoMedico: []
        });
      }
      setError(null);
      setAvailabilityMessage(null);
    }
  }, [open, cirugia]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const [quirofanosRes, pacientesRes, empleadosRes] = await Promise.all([
        quirofanosService.getQuirofanos({ estado: 'disponible', limit: 100 }),
        patientsService.getPatients({ limit: 100 }),
        employeeService.getEmployees({ limit: 100 })
      ]);

      if (quirofanosRes.success) {
        setQuirofanos(quirofanosRes.data.items || []);
      }
      
      if (pacientesRes.success) {
        setPacientes(pacientesRes.data.items || []);
      }
      
      if (empleadosRes.success) {
        const empleados = empleadosRes.data.items || [];
        // Filtrar médicos (especialistas y residentes)
        const medicosList = empleados.filter(e => 
          e.cargo === 'medico_especialista' || e.cargo === 'medico_residente'
        );
        setMedicos(medicosList);
        
        // Personal médico para el equipo (enfermeros, anestesiólogos, etc.)
        const personalList = empleados.filter(e => 
          e.cargo === 'enfermero' || 
          e.cargo === 'medico_residente' || 
          e.especialidad?.toLowerCase().includes('anestes')
        );
        setPersonalMedico(personalList);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.quirofanoId || !formData.fechaInicio || !formData.fechaFin) {
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityMessage(null);
      
      // Verificar disponibilidad del quirófano
      const disponibles = await quirofanosService.getQuirofanosDisponibles(
        formData.fechaInicio.toISOString().split('T')[0],
        formData.fechaInicio.toTimeString().slice(0, 5),
        formData.fechaFin.toTimeString().slice(0, 5)
      );
      
      const quirofanoDisponible = disponibles.data?.find(
        q => q.id === formData.quirofanoId
      );
      
      if (!quirofanoDisponible) {
        setAvailabilityMessage('⚠️ El quirófano no está disponible en ese horario');
      } else {
        setAvailabilityMessage('✅ Quirófano disponible');
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (formData.quirofanoId && formData.fechaInicio && formData.fechaFin) {
      checkAvailability();
    }
  }, [formData.quirofanoId, formData.fechaInicio, formData.fechaFin]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Si se cambia la fecha de inicio y no hay fecha fin, establecer fecha fin automáticamente
      if (field === 'fechaInicio' && value && !prev.fechaFin) {
        updated.fechaFin = addHours(value, 2); // Duración predeterminada de 2 horas
      }
      
      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.quirofanoId || !formData.pacienteId || !formData.medicoId) {
      setError('Por favor complete todos los campos requeridos');
      return false;
    }
    
    if (!formData.tipoIntervencion) {
      setError('Por favor especifique el tipo de intervención');
      return false;
    }
    
    if (!formData.fechaInicio || !formData.fechaFin) {
      setError('Por favor seleccione las fechas de inicio y fin');
      return false;
    }
    
    if (isBefore(formData.fechaFin, formData.fechaInicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }
    
    if (isBefore(formData.fechaInicio, new Date())) {
      setError('No se pueden programar cirugías en fechas pasadas');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        quirofanoId: formData.quirofanoId as number,
        pacienteId: formData.pacienteId as number,
        medicoId: formData.medicoId as number,
        tipoIntervencion: formData.tipoIntervencion,
        fechaInicio: formData.fechaInicio!.toISOString(),
        fechaFin: formData.fechaFin!.toISOString(),
        observaciones: formData.observaciones,
        equipoMedico: formData.equipoMedico
      };

      if (cirugia) {
        // Actualizar cirugía existente
        await quirofanosService.actualizarCirugia(cirugia.id, dataToSend);
      } else {
        // Crear nueva cirugía
        await quirofanosService.programarCirugia(dataToSend);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al guardar la cirugía');
    } finally {
      setLoading(false);
    }
  };

  const tiposIntervencion = [
    'Cirugía General',
    'Cirugía Cardíaca',
    'Neurocirugía',
    'Cirugía Ortopédica',
    'Cirugía Plástica',
    'Cirugía Vascular',
    'Cirugía Torácica',
    'Cirugía Pediátrica',
    'Cirugía Oncológica',
    'Cirugía Laparoscópica',
    'Cirugía de Emergencia',
    'Procedimiento Ambulatorio'
  ];

  if (loadingData) {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {cirugia ? '✏️ Editar Cirugía' : '➕ Programar Nueva Cirugía'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {availabilityMessage && (
          <Alert 
            severity={availabilityMessage.includes('✅') ? 'success' : 'warning'} 
            sx={{ mb: 2 }}
          >
            {availabilityMessage}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Quirófano */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Quirófano</InputLabel>
              <Select
                value={formData.quirofanoId}
                onChange={(e) => handleInputChange('quirofanoId', e.target.value)}
                label="Quirófano"
              >
                {quirofanos.map((quirofano) => (
                  <MenuItem key={quirofano.id} value={quirofano.id}>
                    Quirófano {quirofano.numero} - {quirofano.tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Paciente */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={pacientes}
              getOptionLabel={(option) => 
                `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`
              }
              value={pacientes.find(p => p.id === formData.pacienteId) || null}
              onChange={(e, newValue) => handleInputChange('pacienteId', newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Paciente" required />
              )}
            />
          </Grid>

          {/* Médico Principal */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={medicos}
              getOptionLabel={(option) => 
                `Dr. ${option.nombre} ${option.apellidoPaterno} - ${option.especialidad || 'Sin especialidad'}`
              }
              value={medicos.find(m => m.id === formData.medicoId) || null}
              onChange={(e, newValue) => handleInputChange('medicoId', newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Médico Principal" required />
              )}
            />
          </Grid>

          {/* Tipo de Intervención */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={tiposIntervencion}
              value={formData.tipoIntervencion}
              onChange={(e, newValue) => handleInputChange('tipoIntervencion', newValue || '')}
              onInputChange={(e, newInputValue) => handleInputChange('tipoIntervencion', newInputValue)}
              renderInput={(params) => (
                <TextField {...params} label="Tipo de Intervención" required />
              )}
            />
          </Grid>

          {/* Fecha y Hora de Inicio */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DateTimePicker
                label="Fecha y Hora de Inicio"
                value={formData.fechaInicio}
                onChange={(newValue) => handleInputChange('fechaInicio', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDateTime={new Date()}
                ampm={false}
              />
            </LocalizationProvider>
          </Grid>

          {/* Fecha y Hora de Fin */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DateTimePicker
                label="Fecha y Hora de Fin (Estimada)"
                value={formData.fechaFin}
                onChange={(newValue) => handleInputChange('fechaFin', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDateTime={formData.fechaInicio || new Date()}
                ampm={false}
              />
            </LocalizationProvider>
          </Grid>

          {/* Equipo Médico */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={personalMedico}
              getOptionLabel={(option) => 
                `${option.nombre} ${option.apellidoPaterno} - ${option.cargo}`
              }
              value={personalMedico.filter(p => formData.equipoMedico.includes(p.id))}
              onChange={(e, newValue) => 
                handleInputChange('equipoMedico', newValue.map(v => v.id))
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={`${option.nombre} ${option.apellidoPaterno}`}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipo Médico (Opcional)"
                  placeholder="Seleccione el personal adicional"
                />
              )}
            />
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Notas adicionales sobre la cirugía..."
            />
          </Grid>

          {/* Información de duración */}
          {formData.fechaInicio && formData.fechaFin && (
            <Grid item xs={12}>
              <Alert severity="info">
                Duración estimada: {
                  Math.round((formData.fechaFin.getTime() - formData.fechaInicio.getTime()) / (1000 * 60))
                } minutos
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || checkingAvailability}
        >
          {loading ? <CircularProgress size={24} /> : cirugia ? 'Actualizar' : 'Programar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CirugiaFormDialog;