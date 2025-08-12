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
  Hotel as RoomIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { roomsService } from '@/services/roomsService';
import { Room, ROOM_TYPES, ROOM_STATES } from '@/types/rooms.types';
import { roomFormSchema, type RoomFormValues } from '@/schemas/rooms.schemas';

interface RoomFormDialogProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
  editingRoom?: Room | null;
}

const RoomFormDialog: React.FC<RoomFormDialogProps> = ({
  open,
  onClose,
  onRoomCreated,
  editingRoom
}) => {
  const isEditing = !!editingRoom;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RoomFormValues>({
    resolver: yupResolver(roomFormSchema),
    defaultValues: {
      numero: '',
      tipo: 'individual',
      precioPorDia: 0,
      estado: 'disponible',
      descripcion: ''
    }
  });

  // Cargar datos de la habitación cuando se está editando
  useEffect(() => {
    if (editingRoom && open) {
      reset({
        numero: editingRoom.numero,
        tipo: editingRoom.tipo,
        precioPorDia: editingRoom.precioPorDia,
        estado: editingRoom.estado,
        descripcion: editingRoom.descripcion || ''
      });
    } else if (!editingRoom && open) {
      // Reset form for new room
      reset({
        numero: '',
        tipo: 'individual',
        precioPorDia: 0,
        estado: 'disponible',
        descripcion: ''
      });
    }
  }, [editingRoom, open, reset]);

  const onSubmit = async (data: RoomFormValues) => {
    try {
      let response;
      if (isEditing) {
        response = await roomsService.updateRoom(editingRoom!.id, data);
      } else {
        response = await roomsService.createRoom(data);
      }

      if (response.success) {
        toast.success(`Habitación ${isEditing ? 'actualizada' : 'creada'} exitosamente`);
        onRoomCreated();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error submitting room:', error);
      const errorMessage = error?.message || error?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} habitación`;
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
            {isEditing ? 'Editar Habitación' : 'Nueva Habitación'}
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
                  label="Número de Habitación *"
                  error={!!errors.numero}
                  helperText={errors.numero?.message}
                  disabled={isSubmitting}
                  placeholder="Ej: 101, A-205"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RoomIcon />
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
                  <InputLabel>Tipo de Habitación *</InputLabel>
                  <Select
                    {...field}
                    label="Tipo de Habitación *"
                    disabled={isSubmitting}
                  >
                    {Object.entries(ROOM_TYPES).map(([key, label]) => (
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

          <Grid item xs={12} sm={6}>
            <Controller
              name="precioPorDia"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Precio por Día *"
                  type="number"
                  error={!!errors.precioPorDia}
                  helperText={errors.precioPorDia?.message}
                  disabled={isSubmitting}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
              )}
            />
          </Grid>

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
                    {Object.entries(ROOM_STATES).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
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
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Descripción opcional de la habitación..."
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

export default RoomFormDialog;