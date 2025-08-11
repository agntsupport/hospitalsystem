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
  MeetingRoom as OfficeIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { roomsService } from '@/services/roomsService';
import { Office, OFFICE_TYPES, OFFICE_STATES } from '@/types/rooms.types';

interface OfficeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onOfficeCreated: () => void;
  editingOffice?: Office | null;
}

interface OfficeFormData {
  numero: string;
  tipo: Office['tipo'];
  especialidad: string;
  estado: Office['estado'];
  descripcion: string;
}

const OfficeFormDialog: React.FC<OfficeFormDialogProps> = ({
  open,
  onClose,
  onOfficeCreated,
  editingOffice
}) => {
  const [formData, setFormData] = useState<OfficeFormData>({
    numero: '',
    tipo: 'consulta_general',
    especialidad: '',
    estado: 'disponible',
    descripcion: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingOffice;

  // Cargar datos del consultorio cuando se está editando
  useEffect(() => {
    if (editingOffice && open) {
      setFormData({
        numero: editingOffice.numero,
        tipo: editingOffice.tipo,
        especialidad: editingOffice.especialidad || '',
        estado: editingOffice.estado,
        descripcion: editingOffice.descripcion || ''
      });
    } else if (!editingOffice && open) {
      // Reset form for new office
      setFormData({
        numero: '',
        tipo: 'consulta_general',
        especialidad: '',
        estado: 'disponible',
        descripcion: ''
      });
    }
    setErrors({});
  }, [editingOffice, open]);

  const handleInputChange = (field: keyof OfficeFormData, value: any) => {
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
      newErrors.numero = 'El número de consultorio es requerido';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de consultorio es requerido';
    }

    // Solo validar especialidad si el tipo es 'especialidad'
    if (formData.tipo === 'especialidad' && !formData.especialidad.trim()) {
      newErrors.especialidad = 'La especialidad es requerida para consultorios de especialidad';
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
      const submitData = {
        numero: formData.numero,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        ...(formData.especialidad && { especialidad: formData.especialidad })
      };

      if (isEditing) {
        response = await roomsService.updateOffice(editingOffice!.id, {
          ...submitData,
          estado: formData.estado
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
            {isEditing ? 'Editar Consultorio' : 'Nuevo Consultorio'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Consultorio *"
              value={formData.numero}
              onChange={(e) => handleInputChange('numero', e.target.value)}
              error={!!errors.numero}
              helperText={errors.numero}
              disabled={loading}
              placeholder="Ej: C-101, CONS-A"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <OfficeIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.tipo}>
              <InputLabel>Tipo de Consultorio *</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de Consultorio *"
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                disabled={loading}
              >
                {Object.entries(OFFICE_TYPES).map(([key, label]) => (
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

          {formData.tipo === 'especialidad' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Especialidad *"
                value={formData.especialidad}
                onChange={(e) => handleInputChange('especialidad', e.target.value)}
                error={!!errors.especialidad}
                helperText={errors.especialidad}
                disabled={loading}
                placeholder="Ej: Cardiología, Pediatría, Neurología"
              />
            </Grid>
          )}

          {isEditing && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  disabled={loading}
                >
                  {Object.entries(OFFICE_STATES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              disabled={loading}
              placeholder="Descripción opcional del consultorio..."
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

export default OfficeFormDialog;