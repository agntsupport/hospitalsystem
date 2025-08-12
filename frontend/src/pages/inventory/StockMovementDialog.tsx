import React, { useEffect, useState } from 'react';
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
  Autocomplete,
  Chip
} from '@mui/material';
import {
  SwapHoriz as MovementIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { inventoryService } from '@/services/inventoryService';
import { Product, MOVEMENT_TYPES } from '@/types/inventory.types';
import { stockMovementSchema, StockMovementFormValues } from '@/schemas/inventory.schemas';
import { toast } from 'react-toastify';

interface StockMovementDialogProps {
  open: boolean;
  onClose: () => void;
  onMovementCreated: () => void;
}

// Opciones de razón/motivo
const REASON_OPTIONS = [
  { value: 'compra', label: 'Compra' },
  { value: 'venta', label: 'Venta' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'danado', label: 'Dañado' },
  { value: 'ajuste_inventario', label: 'Ajuste de Inventario' },
  { value: 'traspaso', label: 'Traspaso' },
  { value: 'consumo_interno', label: 'Consumo Interno' },
  { value: 'donacion', label: 'Donación' },
  { value: 'otro', label: 'Otro' }
];

const StockMovementDialog: React.FC<StockMovementDialogProps> = ({
  open,
  onClose,
  onMovementCreated,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setError: setFormError,
    clearErrors
  } = useForm<StockMovementFormValues>({
    resolver: yupResolver(stockMovementSchema),
    defaultValues: {
      productoId: 0,
      tipoMovimiento: 'entrada',
      cantidad: 1,
      costo: 0,
      razon: 'compra',
      observaciones: '',
      referencia: ''
    }
  });

  const tipoMovimiento = watch('tipoMovimiento');
  const razon = watch('razon');

  useEffect(() => {
    if (open) {
      reset();
      clearErrors();
      loadProducts();
    }
  }, [open, reset, clearErrors]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await inventoryService.getProducts({ 
        activo: true, 
        limit: 1000 // Cargar todos los productos activos
      });
      
      if (response.success && response.data) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const onSubmit = async (data: StockMovementFormValues) => {
    clearErrors();

    try {
      const response = await inventoryService.createStockMovement({
        productoId: data.productoId,
        tipoMovimiento: data.tipoMovimiento as 'entrada' | 'salida' | 'ajuste' | 'merma',
        cantidad: data.cantidad,
        costo: data.costo || 0,
        razon: data.razon,
        referencia: data.referencia,
        observaciones: data.observaciones
      });

      if (response.success) {
        toast.success('Movimiento de stock registrado exitosamente');
        onMovementCreated();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error creating stock movement:', error);
      const errorMessage = error?.message || error?.error || 'Error al registrar movimiento';
      setFormError('root', { message: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'success';
      case 'salida': return 'error';
      case 'ajuste': return 'warning';
      case 'merma': return 'error';
      default: return 'default';
    }
  };

  const getSelectedProduct = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MovementIcon />
          Registrar Movimiento de Stock
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
            {/* Selección de Producto */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Producto y Tipo de Movimiento
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Controller
                name="productoId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                    loading={loadingProducts}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Producto *"
                        required
                        error={!!errors.productoId}
                        helperText={errors.productoId?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingProducts && <CircularProgress color="inherit" size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.codigo} - {option.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {option.stockActual} | {option.categoria}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    onChange={(_, value) => field.onChange(value?.id || 0)}
                    value={products.find(p => p.id === field.value) || null}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="tipoMovimiento"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.tipoMovimiento}>
                    <InputLabel>Tipo de Movimiento *</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Movimiento *"
                      required
                    >
                      {Object.entries(MOVEMENT_TYPES).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              size="small" 
                              color={getMovementTypeColor(key) as any}
                              label={value}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.tipoMovimiento && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.tipoMovimiento.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Stock Actual del Producto Seleccionado */}
            {watch('productoId') > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Stock Actual:</strong> {getSelectedProduct(watch('productoId'))?.stockActual || 0} unidades
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Cantidad y Costo */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Detalles del Movimiento
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cantidad *"
                    type="number"
                    required
                    inputProps={{ min: 1 }}
                    error={!!errors.cantidad}
                    helperText={errors.cantidad?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="costo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={tipoMovimiento === 'entrada' ? 'Costo Unitario *' : 'Costo Unitario'}
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    required={tipoMovimiento === 'entrada'}
                    error={!!errors.costo}
                    helperText={errors.costo?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                    }}
                  />
                )}
              />
            </Grid>

            {/* Razón y Referencia */}
            <Grid item xs={12} md={6}>
              <Controller
                name="razon"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.razon}>
                    <InputLabel>Razón *</InputLabel>
                    <Select
                      {...field}
                      label="Razón *"
                      required
                    >
                      {REASON_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.razon && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.razon.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="referencia"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Referencia/Factura"
                    placeholder="No. factura, documento, etc."
                    error={!!errors.referencia}
                    helperText={errors.referencia?.message}
                  />
                )}
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    error={!!errors.observaciones}
                    helperText={errors.observaciones?.message}
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
            {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockMovementDialog;