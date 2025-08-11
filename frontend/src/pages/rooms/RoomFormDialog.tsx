import React, { useState, useEffect } from 'react';
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

interface RoomFormDialogProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
  editingRoom?: Room | null;
}


interface RoomFormData {
  numero: string;
  tipo: Room['tipo'];
  precioPorDia: number;
  estado: Room['estado'];
  descripcion: string;
}

const RoomFormDialog: React.FC<RoomFormDialogProps> = ({
  open,
  onClose,
  onRoomCreated,
  editingRoom
}) => {
  const [formData, setFormData] = useState<RoomFormData>({
    numero: '',
    tipo: 'individual',
    precioPorDia: 0,
    estado: 'disponible',
    descripcion: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingRoom;

  // Cargar datos de la habitación cuando se está editando
  useEffect(() => {
    if (editingRoom && open) {
      setFormData({
        numero: editingRoom.numero,
        tipo: editingRoom.tipo,
        precioPorDia: editingRoom.precioPorDia,
        estado: editingRoom.estado,
        descripcion: editingRoom.descripcion || ''
      });
    } else if (!editingRoom && open) {
      // Reset form for new room
      setFormData({
        numero: '',
        tipo: 'individual',
        precioPorDia: 0,
        estado: 'disponible',
        descripcion: ''
      });
    }
    setErrors({});
  }, [editingRoom, open]);

  const handleInputChange = (field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero.trim()) {
      newErrors.numero = 'El número de habitación es requerido';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de habitación es requerido';
    }

    if (formData.precioPorDia <= 0) {
      newErrors.precioPorDia = 'El precio por día debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      if (isEditing) {
        response = await roomsService.updateRoom(editingRoom!.id, formData);
      } else {
        response = await roomsService.createRoom(formData);
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
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
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
            <TextField
              fullWidth
              label="Número de Habitación *"
              value={formData.numero}
              onChange={(e) => handleInputChange('numero', e.target.value)}
              error={!!errors.numero}
              helperText={errors.numero}
              disabled={loading}
              placeholder="Ej: 101, A-205"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <RoomIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.tipo}>
              <InputLabel>Tipo de Habitación *</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de Habitación *"
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                disabled={loading}
              >
                {Object.entries(ROOM_TYPES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.tipo && (
                <FormHelperText>{errors.tipo}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Precio por Día *"
              type="number"
              value={formData.precioPorDia}
              onChange={(e) => handleInputChange('precioPorDia', parseFloat(e.target.value) || 0)}
              error={!!errors.precioPorDia}
              helperText={errors.precioPorDia}
              disabled={loading}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={(e) => handleInputChange('estado', e.target.value)}
                disabled={loading}
              >
                {Object.entries(ROOM_STATES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              disabled={loading}
              placeholder="Descripción opcional de la habitación..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : (isEditing ? <EditIcon /> : <AddIcon />)}
        >
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomFormDialog;