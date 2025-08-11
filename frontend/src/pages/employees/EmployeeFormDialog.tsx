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
  Divider,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { employeeService } from '@/services/employeeService';
import { Employee, EmployeeFormData, EmployeeType } from '@/types/employee.types';
import { EMPLOYEE_TYPE_LABELS } from '@/utils/constants';

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onEmployeeCreated: () => void;
  editingEmployee?: Employee | null;
}

const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  open,
  onClose,
  onEmployeeCreated,
  editingEmployee
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    tipoEmpleado: 'enfermero',
    cedulaProfesional: '',
    especialidad: '',
    telefono: '',
    email: '',
    salario: undefined,
    fechaIngreso: new Date().toISOString().split('T')[0],
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingEmployee;

  // Cargar datos del empleado cuando se está editando
  useEffect(() => {
    if (editingEmployee && open) {
      setFormData({
        nombre: editingEmployee.nombre,
        apellidoPaterno: editingEmployee.apellidoPaterno,
        apellidoMaterno: editingEmployee.apellidoMaterno || '',
        tipoEmpleado: editingEmployee.tipoEmpleado,
        cedulaProfesional: editingEmployee.cedulaProfesional || '',
        especialidad: editingEmployee.especialidad || '',
        telefono: editingEmployee.telefono || '',
        email: editingEmployee.email || '',
        salario: editingEmployee.salario,
        fechaIngreso: editingEmployee.fechaIngreso 
          ? new Date(editingEmployee.fechaIngreso).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        activo: editingEmployee.activo
      });
    } else if (!editingEmployee && open) {
      // Reset form for new employee
      setFormData({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        tipoEmpleado: 'enfermero',
        cedulaProfesional: '',
        especialidad: '',
        telefono: '',
        email: '',
        salario: undefined,
        fechaIngreso: new Date().toISOString().split('T')[0],
        activo: true
      });
    }
    setErrors({});
  }, [editingEmployee, open]);

  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = 'El apellido paterno es requerido';
    }

    if (!formData.tipoEmpleado) {
      newErrors.tipoEmpleado = 'El tipo de empleado es requerido';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.salario && formData.salario < 0) {
      newErrors.salario = 'El salario no puede ser negativo';
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
      const dataToSend = { ...formData };
      
      // Convert empty strings to null
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key as keyof EmployeeFormData] === '') {
          dataToSend[key as keyof EmployeeFormData] = undefined as any;
        }
      });

      let response;
      if (isEditing) {
        response = await employeeService.updateEmployee(editingEmployee!.id, dataToSend);
      } else {
        response = await employeeService.createEmployee(dataToSend);
      }

      if (response.success) {
        toast.success(`Empleado ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
        onEmployeeCreated();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error submitting employee:', error);
      const errorMessage = error?.message || error?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} empleado`;
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
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditing ? <EditIcon color="primary" /> : <PersonAddIcon color="primary" />}
          <Typography variant="h6">
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Información Personal */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Información Personal
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              error={!!errors.nombre}
              helperText={errors.nombre}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido Paterno *"
              value={formData.apellidoPaterno}
              onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
              error={!!errors.apellidoPaterno}
              helperText={errors.apellidoPaterno}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido Materno"
              value={formData.apellidoMaterno}
              onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fecha de Ingreso"
              type="date"
              value={formData.fechaIngreso}
              onChange={(e) => handleInputChange('fechaIngreso', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>

          {/* Información Profesional */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
              Información Profesional
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.tipoEmpleado}>
              <InputLabel>Tipo de Empleado *</InputLabel>
              <Select
                value={formData.tipoEmpleado}
                label="Tipo de Empleado *"
                onChange={(e) => handleInputChange('tipoEmpleado', e.target.value as EmployeeType)}
                disabled={loading}
              >
                <MenuItem value="enfermero">Enfermero</MenuItem>
                <MenuItem value="medico_residente">Médico Residente</MenuItem>
                <MenuItem value="medico_especialista">Médico Especialista</MenuItem>
              </Select>
              {errors.tipoEmpleado && (
                <FormHelperText>{errors.tipoEmpleado}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cédula Profesional"
              value={formData.cedulaProfesional}
              onChange={(e) => handleInputChange('cedulaProfesional', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Especialidad"
              value={formData.especialidad}
              onChange={(e) => handleInputChange('especialidad', e.target.value)}
              disabled={loading}
              helperText="Solo para médicos especialistas"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Salario"
              type="number"
              value={formData.salario || ''}
              onChange={(e) => handleInputChange('salario', e.target.value ? parseFloat(e.target.value) : undefined)}
              error={!!errors.salario}
              helperText={errors.salario}
              disabled={loading}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>
              }}
            />
          </Grid>

          {/* Información de Contacto */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
              Información de Contacto
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
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
          startIcon={loading ? <CircularProgress size={20} /> : (isEditing ? <EditIcon /> : <PersonAddIcon />)}
        >
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeFormDialog;