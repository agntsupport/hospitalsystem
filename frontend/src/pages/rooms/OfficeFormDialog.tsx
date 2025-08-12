import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
  CircularProgress,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  MeetingRoom as OfficeIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { roomsService } from '@/services/roomsService';
import { Office, OFFICE_TYPES, OFFICE_STATES } from '@/types/rooms.types';
import { officeFormSchema, type OfficeFormValues } from '@/schemas/rooms.schemas';

interface OfficeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onOfficeCreated: () => void;
  editingOffice?: Office | null;
}

const OfficeFormDialog: React.FC<OfficeFormDialogProps> = ({
  open,
  onClose,
  onOfficeCreated,
  editingOffice
}) => {
  const isEditing = !!editingOffice;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<OfficeFormValues>({
    resolver: yupResolver(officeFormSchema),
    defaultValues: {
      numero: '',
      tipo: 'consulta_general',
      especialidad: '',
      estado: 'disponible',
      descripcion: ''
    }
  });

  const tipoValue = watch('tipo');

  // Cargar datos del consultorio cuando se está editando
  useEffect(() => {
    if (editingOffice && open) {
      reset({
        numero: editingOffice.numero,
        tipo: editingOffice.tipo,
        especialidad: editingOffice.especialidad || '',
        estado: editingOffice.estado,
        descripcion: editingOffice.descripcion || ''
      });
    } else if (!editingOffice && open) {
      // Reset form for new office
      reset({
        numero: '',
        tipo: 'consulta_general',
        especialidad: '',
        estado: 'disponible',
        descripcion: ''
      });
    }
  }, [editingOffice, open, reset]);

  const onSubmit = async (data: OfficeFormValues) => {
    try {
      let response;
      const submitData = {
        numero: data.numero,
        tipo: data.tipo,
        descripcion: data.descripcion,
        ...(data.especialidad && { especialidad: data.especialidad })
      };

      if (isEditing) {
        response = await roomsService.updateOffice(editingOffice!.id, {
          ...submitData,
          estado: data.estado
        });
      } else {
        response = await roomsService.createOffice(submitData);
      }

      if (response.success) {
        toast.success(`Consultorio ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
        onOfficeCreated();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error submitting office:', error);
      const errorMessage = error?.message || error?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} consultorio`;
      toast.error(errorMessage);
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
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditing ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
          <Typography variant="h6">
            {isEditing ? 'Editar Consultorio' : 'Nuevo Consultorio'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="numero"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Número de Consultorio *"
                  error={!!errors.numero}
                  helperText={errors.numero?.message}
                  disabled={isSubmitting}
                  placeholder="Ej: C-101, CONS-A"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <OfficeIcon />
                      </InputAdornment>
                    ),
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
                <FormControl fullWidth error={!!errors.tipo}>
                  <InputLabel>Tipo de Consultorio *</InputLabel>
                  <Select
                    {...field}
                    label="Tipo de Consultorio *"
                    disabled={isSubmitting}
                  >
                    {Object.entries(OFFICE_TYPES).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.tipo && (
                    <FormHelperText>{errors.tipo.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {tipoValue === 'especialidad' && (
            <Grid item xs={12}>
              <Controller
                name="especialidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Especialidad *"
                    error={!!errors.especialidad}
                    helperText={errors.especialidad?.message}
                    disabled={isSubmitting}
                    placeholder="Ej: Cardiología, Pediatría, Neurología"
                  />
                )}
              />
            </Grid>
          )}

          {isEditing && (
            <Grid item xs={12} sm={6}>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      {...field}
                      label="Estado"
                      disabled={isSubmitting}
                    >
                      {Object.entries(OFFICE_STATES).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}

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
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Descripción opcional del consultorio..."
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
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : (isEditing ? <EditIcon /> : <AddIcon />)}
        >
          {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfficeFormDialog;