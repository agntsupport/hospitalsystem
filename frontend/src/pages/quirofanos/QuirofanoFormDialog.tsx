import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { quirofanoFormSchema, QuirofanoFormValues } from '@/schemas/quirofanos.schemas';
import quirofanosService, { Quirofano } from '@/services/quirofanosService';
import { toast } from 'react-toastify';
import {
  MedicalServices,
  AttachMoney,
  People,
  Description,
  Info as InfoIcon,
  MoneyOff as CostIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quirofano?: Quirofano;
}

const QuirofanoFormDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  quirofano
}) => {
  const isEditing = !!quirofano;
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const [availableNumbers, setAvailableNumbers] = React.useState<{
    existingNumbers: string[];
    suggestions: string[];
    pattern?: string;
  }>({ existingNumbers: [], suggestions: [] });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<QuirofanoFormValues>({
    resolver: yupResolver(quirofanoFormSchema),
    defaultValues: {
      numero: '',
      tipo: '',
      especialidad: '',
      descripcion: '',
      equipamiento: '',
      capacidadEquipo: 6,
      precioHora: 0,
      costoHora: null
    }
  });

  // Cargar números disponibles cuando se abre el formulario para nuevo quirófano
  useEffect(() => {
    if (open && !isEditing) {
      const fetchAvailableNumbers = async () => {
        try {
          const response = await quirofanosService.getAvailableNumbers();
          if (response.success) {
            setAvailableNumbers(response.data);
          }
        } catch (error) {
          console.error('Error al obtener números disponibles:', error);
        }
      };
      fetchAvailableNumbers();
    }
  }, [open, isEditing]);

  useEffect(() => {
    if (open) {
      if (quirofano) {
        // Llenar formulario con datos del quirófano a editar
        reset({
          numero: quirofano.numero || '',
          tipo: quirofano.tipo || '',
          especialidad: quirofano.especialidad || '',
          descripcion: quirofano.descripcion || '',
          equipamiento: quirofano.equipamiento || '',
          capacidadEquipo: quirofano.capacidadEquipo || 6,
          precioHora: quirofano.precioHora || 0,
          costoHora: quirofano.costoHora ?? null
        });
      } else {
        // Resetear formulario para nuevo quirófano
        reset({
          numero: '',
          tipo: '',
          especialidad: '',
          descripcion: '',
          equipamiento: '',
          capacidadEquipo: 6,
          precioHora: 0
        });
      }
    }
  }, [open, quirofano, reset]);

  const onSubmit = async (data: QuirofanoFormValues) => {
    try {
      if (isEditing) {
        await quirofanosService.updateQuirofano(quirofano.id, data);
        toast.success('Quirófano actualizado exitosamente');
      } else {
        await quirofanosService.createQuirofano(data);
        toast.success('Quirófano creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el quirófano');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {isEditing ? '✏️ Editar Quirófano' : '➕ Nuevo Quirófano'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📋 Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número del Quirófano"
                    placeholder={!isEditing && availableNumbers.suggestions.length > 0 
                      ? `Sugerencia: ${availableNumbers.suggestions[0]}` 
                      : "Ej: Q6, Q7, Q8..."}
                    error={!!errors.numero}
                    helperText={
                      errors.numero?.message || 
                      (!isEditing && availableNumbers.existingNumbers.length > 0 
                        ? `Ocupados: ${availableNumbers.existingNumbers.join(', ')}` 
                        : 'Patrón: Q1, Q2, Q3...')
                    }
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MedicalServices color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <FormControl 
                    fullWidth
                    error={!!errors.tipo}
                  >
                    <InputLabel>Tipo de Quirófano</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Quirófano"
                      disabled={isSubmitting}
                    >
                      <MenuItem value="">
                        <em>Seleccionar...</em>
                      </MenuItem>
                      <MenuItem value="cirugia_general">Cirugía General</MenuItem>
                      <MenuItem value="cirugia_cardiaca">Cirugía Cardíaca</MenuItem>
                      <MenuItem value="cirugia_neurologica">Neurocirugía</MenuItem>
                      <MenuItem value="cirugia_ortopedica">Cirugía Ortopédica</MenuItem>
                      <MenuItem value="cirugia_ambulatoria">Cirugía Ambulatoria</MenuItem>
                    </Select>
                    {errors.tipo && (
                      <FormHelperText>{errors.tipo.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="especialidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Especialidad"
                    placeholder="Ej: Cirugía Cardiovascular, Traumatología"
                    error={!!errors.especialidad}
                    helperText={errors.especialidad?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="capacidadEquipo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Capacidad del Equipo"
                    type="number"
                    error={!!errors.capacidadEquipo}
                    helperText={errors.capacidadEquipo?.message || 'Número de personas que pueden trabajar simultáneamente'}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <People color="action" />
                        </InputAdornment>
                      ),
                      inputProps: { min: 2, max: 20 }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Información Económica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                💰 Información Económica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="precioHora"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Precio por Hora (Venta)"
                    type="number"
                    error={!!errors.precioHora}
                    helperText={errors.precioHora?.message || 'Tarifa cobrada por hora de uso'}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney color="action" />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 100 }
                    }}
                  />
                )}
              />
            </Grid>

            {isAdmin && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="costoHora"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Costo por Hora (Operativo)"
                      type="number"
                      error={!!errors.costoHora}
                      helperText={errors.costoHora?.message || 'Costo interno del hospital'}
                      disabled={isSubmitting}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseFloat(val) || 0);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CostIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <Tooltip title="Este costo se usa para calcular márgenes de utilidad en reportes">
                            <InfoIcon color="action" fontSize="small" />
                          </Tooltip>
                        ),
                        inputProps: { min: 0, step: 100 }
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Información Adicional */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                📝 Información Adicional
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={2}
                    placeholder="Descripción general del quirófano"
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="equipamiento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Equipamiento"
                    multiline
                    rows={3}
                    placeholder="Lista del equipamiento disponible en el quirófano"
                    error={!!errors.equipamiento}
                    helperText={errors.equipamiento?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuirofanoFormDialog;