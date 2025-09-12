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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { inventoryService } from '@/services/inventoryService';
import { PAYMENT_TERMS, Supplier } from '@/types/inventory.types';
import { supplierFormSchema, SupplierFormValues } from '@/schemas/inventory.schemas';
import { toast } from 'react-toastify';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierCreated: () => void;
  editingSupplier?: Supplier | null;
}

const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  open,
  onClose,
  onSupplierCreated,
  editingSupplier
}) => {
  const isEditing = !!editingSupplier;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setError: setFormError,
    clearErrors
  } = useForm<SupplierFormValues>({
    resolver: yupResolver(supplierFormSchema),
    defaultValues: {
      razonSocial: '',
      nombreComercial: '',
      rfc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      contacto: {
        nombre: '',
        cargo: '',
        telefono: '',
        email: ''
      },
      condicionesPago: 'Contado',
      diasCredito: 0
    }
  });

  const condicionesPago = watch('condicionesPago');

  useEffect(() => {
    if (open) {
      if (editingSupplier) {
        // Llenar formulario con datos del proveedor a editar
        reset({
          razonSocial: editingSupplier.razonSocial || '',
          nombreComercial: editingSupplier.nombreComercial || '',
          rfc: editingSupplier.rfc || '',
          telefono: editingSupplier.telefono || '',
          email: editingSupplier.email || '',
          direccion: editingSupplier.direccion || '',
          ciudad: editingSupplier.ciudad || '',
          estado: editingSupplier.estado || '',
          codigoPostal: editingSupplier.codigoPostal || '',
          contacto: {
            nombre: editingSupplier.contacto?.nombre || '',
            cargo: editingSupplier.contacto?.cargo || '',
            telefono: editingSupplier.contacto?.telefono || '',
            email: editingSupplier.contacto?.email || ''
          },
          condicionesPago: editingSupplier.condicionesPago || 'Contado',
          diasCredito: editingSupplier.diasCredito || 0
        });
      } else {
        // Reset formulario para nuevo proveedor
        reset({
          razonSocial: '',
          nombreComercial: '',
          rfc: '',
          telefono: '',
          email: '',
          direccion: '',
          ciudad: '',
          estado: '',
          codigoPostal: '',
          contacto: {
            nombre: '',
            cargo: '',
            telefono: '',
            email: ''
          },
          condicionesPago: 'Contado',
          diasCredito: 0
        });
      }
      clearErrors();
    }
  }, [open, editingSupplier, reset, clearErrors]);

  const onSubmit = async (data: SupplierFormValues) => {
    clearErrors();

    try {
      // Limpiar y preparar datos para envío
      const cleanFormData = { ...data };
      
      // Formatear RFC a mayúsculas
      cleanFormData.rfc = cleanFormData.rfc.toUpperCase();
      
      // Remover contacto vacío si no hay datos
      if (!cleanFormData.contacto?.nombre && !cleanFormData.contacto?.telefono && !cleanFormData.contacto?.email) {
        delete cleanFormData.contacto;
      }
      
      // Establecer días de crédito en 0 si es contado
      if (cleanFormData.condicionesPago === 'Contado') {
        cleanFormData.diasCredito = 0;
      }

      let response;
      if (isEditing) {
        response = await inventoryService.updateSupplier(editingSupplier!.id, cleanFormData);
      } else {
        response = await inventoryService.createSupplier(cleanFormData);
      }

      if (response.success) {
        toast.success(`Proveedor ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
        onSupplierCreated();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} supplier:`, error);
      const errorMessage = error?.message || error?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} proveedor`;
      setFormError('root', { message: errorMessage });
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {errors.root && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.root.message}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Controller
                name="razonSocial"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Razón Social *"
                    required
                    error={!!errors.razonSocial}
                    helperText={errors.razonSocial?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="rfc"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RFC *"
                    required
                    error={!!errors.rfc}
                    helperText={errors.rfc?.message}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                    placeholder="ABC123456789"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="nombreComercial"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre Comercial"
                    error={!!errors.nombreComercial}
                    helperText={errors.nombreComercial?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono"
                    placeholder="5551234567"
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    placeholder="contacto@proveedor.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dirección
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección"
                    placeholder="Calle, número, colonia"
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="ciudad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ciudad"
                    error={!!errors.ciudad}
                    helperText={errors.ciudad?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Estado"
                    error={!!errors.estado}
                    helperText={errors.estado?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="codigoPostal"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código Postal"
                    placeholder="12345"
                    error={!!errors.codigoPostal}
                    helperText={errors.codigoPostal?.message}
                  />
                )}
              />
            </Grid>

            {/* Contacto */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Contacto Principal (Opcional)
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contacto.nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Contacto"
                    error={!!errors.contacto?.nombre}
                    helperText={errors.contacto?.nombre?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contacto.cargo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cargo"
                    error={!!errors.contacto?.cargo}
                    helperText={errors.contacto?.cargo?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contacto.telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono del Contacto"
                    error={!!errors.contacto?.telefono}
                    helperText={errors.contacto?.telefono?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contacto.email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email del Contacto"
                    type="email"
                    error={!!errors.contacto?.email}
                    helperText={errors.contacto?.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Condiciones de Pago */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Condiciones de Pago
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="condicionesPago"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.condicionesPago}>
                    <InputLabel>Condiciones de Pago</InputLabel>
                    <Select
                      {...field}
                      label="Condiciones de Pago"
                    >
                      {PAYMENT_TERMS.map((term) => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.condicionesPago && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.condicionesPago.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="diasCredito"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Días de Crédito"
                    type="number"
                    inputProps={{ min: 0, max: 365 }}
                    disabled={condicionesPago === 'Contado'}
                    helperText={
                      condicionesPago === 'Contado' 
                        ? 'No aplica para pagos de contado' 
                        : errors.diasCredito?.message
                    }
                    error={!!errors.diasCredito}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SupplierFormDialog;