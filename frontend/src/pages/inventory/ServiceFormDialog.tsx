import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
  FormHelperText,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  MedicalServices as ServiceIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { inventoryService } from '@/services/inventoryService';
import { Service, CreateServiceRequest, UpdateServiceRequest, TipoServicio } from '@/types/inventory.types';

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
  onSuccess: () => void;
}

interface ServiceFormValues {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoServicio;
  precio: number;
  activo: boolean;
}

const SERVICE_TYPE_OPTIONS = [
  { value: TipoServicio.CONSULTA_GENERAL, label: 'Consulta General' },
  { value: TipoServicio.CONSULTA_ESPECIALIDAD, label: 'Consulta Especialidad' },
  { value: TipoServicio.URGENCIA, label: 'Urgencia' },
  { value: TipoServicio.CURACION, label: 'Curación' },
  { value: TipoServicio.HOSPITALIZACION, label: 'Hospitalización' },
];

const serviceSchema = yup.object().shape({
  codigo: yup.string()
    .required('El código es requerido')
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .matches(/^[A-Z0-9-]+$/, 'El código solo puede contener letras mayúsculas, números y guiones'),
  nombre: yup.string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: yup.string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo: yup.string()
    .required('El tipo de servicio es requerido')
    .oneOf(Object.values(TipoServicio), 'Tipo de servicio inválido'),
  precio: yup.number()
    .required('El precio es requerido')
    .positive('El precio debe ser mayor a 0')
    .max(999999.99, 'El precio no puede exceder $999,999.99'),
  activo: yup.boolean(),
});

const ServiceFormDialog: React.FC<ServiceFormDialogProps> = ({
  open,
  onClose,
  service,
  onSuccess,
}) => {
  const isEditing = !!service;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ServiceFormValues>({
    resolver: yupResolver(serviceSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: TipoServicio.CONSULTA_GENERAL,
      precio: 0,
      activo: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (service) {
        reset({
          codigo: service.codigo,
          nombre: service.nombre,
          descripcion: service.descripcion || '',
          tipo: service.tipo,
          precio: service.precio,
          activo: service.activo,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo: TipoServicio.CONSULTA_GENERAL,
          precio: 0,
          activo: true,
        });
      }
    }
  }, [open, service, reset]);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      if (isEditing) {
        const updateData: UpdateServiceRequest = {
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          tipo: data.tipo,
          precio: data.precio,
          activo: data.activo,
        };

        const response = await inventoryService.updateService(service.id, updateData);
        if (response.success) {
          toast.success('Servicio actualizado correctamente');
          onSuccess();
          handleClose();
        }
      } else {
        const createData: CreateServiceRequest = {
          codigo: data.codigo.toUpperCase(),
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          tipo: data.tipo,
          precio: data.precio,
        };

        const response = await inventoryService.createService(createData);
        if (response.success) {
          toast.success('Servicio creado correctamente');
          onSuccess();
          handleClose();
        }
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el servicio');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const watchPrecio = watch('precio');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ServiceIcon />
            <Typography variant="h6">
              {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Código */}
            <Grid item xs={12} md={6}>
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código"
                    error={!!errors.codigo}
                    helperText={errors.codigo?.message || 'Ej: CONS-001, URG-002'}
                    disabled={isEditing}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
            </Grid>

            {/* Tipo de Servicio */}
            <Grid item xs={12} md={6}>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.tipo}>
                    <InputLabel>Tipo de Servicio</InputLabel>
                    <Select {...field} label="Tipo de Servicio">
                      {SERVICE_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
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

            {/* Nombre */}
            <Grid item xs={12}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Servicio"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                  />
                )}
              />
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descripción (opcional)"
                    multiline
                    rows={3}
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                )}
              />
            </Grid>

            {/* Precio */}
            <Grid item xs={12} md={6}>
              <Controller
                name="precio"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Precio"
                    type="number"
                    error={!!errors.precio}
                    helperText={errors.precio?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: 0,
                      step: 0.01,
                    }}
                  />
                )}
              />
            </Grid>

            {/* Vista previa del precio */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="primary">
                  {formatCurrency(watchPrecio || 0)}
                </Typography>
              </Box>
            </Grid>

            {/* Estado activo (solo en edición) */}
            {isEditing && (
              <Grid item xs={12}>
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          color="primary"
                        />
                      }
                      label={field.value ? 'Servicio Activo' : 'Servicio Inactivo'}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Información adicional en modo edición */}
            {isEditing && service && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Información del servicio:
                  </Typography>
                  {service._count && (
                    <>
                      <Typography variant="body2">
                        • Usado en {service._count.transacciones} transacciones
                      </Typography>
                      <Typography variant="body2">
                        • Incluido en {service._count.itemsVentaRapida} ventas rápidas
                      </Typography>
                      <Typography variant="body2">
                        • Aparece en {service._count.detallesFactura} facturas
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Creado: {new Date(service.createdAt).toLocaleString('es-MX')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Última actualización: {new Date(service.updatedAt).toLocaleString('es-MX')}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ServiceFormDialog;