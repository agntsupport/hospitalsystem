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
import { Employee, EmployeeType, EmployeeFormData } from '@/types/employee.types';
import { employeeFormSchema, EmployeeFormValues } from '@/schemas/employees.schemas';
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
  const isEditing = !!editingEmployee;
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: yupResolver(employeeFormSchema),
    context: { $isNew: !isEditing },
    defaultValues: {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      genero: 'M',
      telefono: '',
      email: '',
      direccion: '',
      tipo: 'cajero',
      especialidad: '',
      numeroLicencia: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      salario: 0,
      turno: 'matutino',
      username: '',
      password: '',
      confirmPassword: '',
      rol: 'cajero',
      activo: true
    }
  });

  // Watch para sincronizar tipo con rol
  const watchedTipo = watch('tipo');
  
  useEffect(() => {
    if (watchedTipo && !isEditing) {
      setValue('rol', watchedTipo);
    }
  }, [watchedTipo, setValue, isEditing]);

  // Cargar datos del empleado cuando se está editando
  useEffect(() => {
    if (editingEmployee && open) {
      reset({
        nombre: editingEmployee.nombre,
        apellidoPaterno: editingEmployee.apellidoPaterno,
        apellidoMaterno: editingEmployee.apellidoMaterno || '',
        fechaNacimiento: editingEmployee.fechaNacimiento 
          ? new Date(editingEmployee.fechaNacimiento).toISOString().split('T')[0]
          : '',
        genero: editingEmployee.genero || 'M',
        telefono: editingEmployee.telefono || '',
        email: editingEmployee.email || '',
        direccion: editingEmployee.direccion || '',
        tipo: editingEmployee.tipoEmpleado,
        especialidad: editingEmployee.especialidad || '',
        numeroLicencia: editingEmployee.cedulaProfesional || '',
        fechaIngreso: editingEmployee.fechaIngreso 
          ? new Date(editingEmployee.fechaIngreso).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        salario: editingEmployee.salario || 0,
        turno: editingEmployee.turno || 'matutino',
        username: '',
        password: '',
        confirmPassword: '',
        rol: editingEmployee.tipoEmpleado, // Usar el mismo tipo como rol
        activo: editingEmployee.activo
      });
    } else if (!editingEmployee && open) {
      // Reset form for new employee
      reset({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        fechaNacimiento: '',
        genero: 'M',
        telefono: '',
        email: '',
        direccion: '',
        tipo: 'cajero',
        especialidad: '',
        numeroLicencia: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        salario: 0,
        turno: 'matutino',
        username: '',
        password: '',
        confirmPassword: '',
        rol: 'cajero',
        activo: true
      });
    }
  }, [editingEmployee, open, reset]);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      // Mapear los datos del schema al formato esperado por el servicio
      const mappedData: EmployeeFormData = {
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno || undefined,
        fechaNacimiento: data.fechaNacimiento || undefined,
        genero: data.genero as 'M' | 'F' | 'Otro' || undefined,
        direccion: data.direccion || undefined,
        turno: data.turno as 'matutino' | 'vespertino' | 'nocturno' | 'mixto' || undefined,
        tipoEmpleado: data.tipo as EmployeeType,
        cedulaProfesional: data.numeroLicencia || undefined,
        especialidad: data.especialidad || undefined,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
        salario: data.salario || undefined,
        fechaIngreso: data.fechaIngreso,
        activo: data.activo
      };

      // Para nuevos empleados, también crear el usuario con el mismo rol que el tipo
      if (!isEditing) {
        (mappedData as any).username = data.username;
        (mappedData as any).password = data.password;
        (mappedData as any).rol = data.tipo; // Usar el tipo como rol
      }

      let response;
      if (isEditing) {
        response = await employeeService.updateEmployee(editingEmployee!.id, mappedData);
      } else {
        response = await employeeService.createEmployee(mappedData);
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
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nombre *"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="apellidoPaterno"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Apellido Paterno *"
                  error={!!errors.apellidoPaterno}
                  helperText={errors.apellidoPaterno?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="apellidoMaterno"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Apellido Materno"
                  error={!!errors.apellidoMaterno}
                  helperText={errors.apellidoMaterno?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="fechaNacimiento"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Fecha de Nacimiento *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fechaNacimiento}
                  helperText={errors.fechaNacimiento?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="genero"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.genero}>
                  <InputLabel>Género *</InputLabel>
                  <Select
                    {...field}
                    label="Género *"
                    disabled={isSubmitting}
                  >
                    <MenuItem value="M">Masculino</MenuItem>
                    <MenuItem value="F">Femenino</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                  {errors.genero && (
                    <FormHelperText>{errors.genero.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="fechaIngreso"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Fecha de Ingreso *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fechaIngreso}
                  helperText={errors.fechaIngreso?.message}
                  disabled={isSubmitting}
                />
              )}
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
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.tipo}>
                  <InputLabel>Tipo de Empleado *</InputLabel>
                  <Select
                    {...field}
                    label="Tipo de Empleado *"
                    disabled={isSubmitting}
                  >
                    <MenuItem value="cajero">Cajero</MenuItem>
                    <MenuItem value="enfermero">Enfermero</MenuItem>
                    <MenuItem value="almacenista">Almacenista</MenuItem>
                    <MenuItem value="administrador">Administrador</MenuItem>
                    <MenuItem value="socio">Socio</MenuItem>
                    <MenuItem value="medico_residente">Médico Residente</MenuItem>
                    <MenuItem value="medico_especialista">Médico Especialista</MenuItem>
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
              name="numeroLicencia"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Cédula Profesional"
                  error={!!errors.numeroLicencia}
                  helperText={errors.numeroLicencia?.message}
                  disabled={isSubmitting}
                />
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
                  error={!!errors.especialidad}
                  helperText={errors.especialidad?.message || "Solo para médicos especialistas"}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="salario"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Salario *"
                  type="number"
                  error={!!errors.salario}
                  helperText={errors.salario?.message}
                  disabled={isSubmitting}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="turno"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.turno}>
                  <InputLabel>Turno *</InputLabel>
                  <Select
                    {...field}
                    label="Turno *"
                    disabled={isSubmitting}
                  >
                    <MenuItem value="matutino">Matutino</MenuItem>
                    <MenuItem value="vespertino">Vespertino</MenuItem>
                    <MenuItem value="nocturno">Nocturno</MenuItem>
                    <MenuItem value="mixto">Mixto</MenuItem>
                  </Select>
                  {errors.turno && (
                    <FormHelperText>{errors.turno.message}</FormHelperText>
                  )}
                </FormControl>
              )}
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
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Teléfono *"
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email *"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="direccion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Dirección *"
                  multiline
                  rows={2}
                  error={!!errors.direccion}
                  helperText={errors.direccion?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          {!isEditing && (
            <>
              {/* Información de Usuario - Solo para nuevos empleados */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                  Información de Usuario
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre de Usuario *"
                      error={!!errors.username}
                      helperText={errors.username?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="rol"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Rol (Auto-generado)"
                      value={watchedTipo || field.value || 'Se asignará según el tipo de empleado'}
                      disabled={true}
                      helperText="El rol se asigna automáticamente según el tipo de empleado seleccionado"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contraseña *"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirmar Contraseña *"
                      type="password"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </>
          )}
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
          startIcon={isSubmitting ? <CircularProgress size={20} /> : (isEditing ? <EditIcon /> : <PersonAddIcon />)}
        >
          {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeFormDialog;