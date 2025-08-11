import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  Chip
} from '@mui/material';
import {
  Inventory as ProductIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalPharmacy as PharmacyIcon,
  AttachMoney as MoneyIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {
  Product,
  Supplier,
  CreateProductRequest,
  UpdateProductRequest,
  PRODUCT_CATEGORIES,
  UNIT_TYPES
} from '@/types/inventory.types';
import { inventoryService } from '@/services/inventoryService';

const schema = yup.object({
  codigo: yup.string().optional(),
  codigoBarras: yup.string().optional(),
  nombre: yup.string().required('El nombre es requerido').min(2, 'Mínimo 2 caracteres'),
  descripcion: yup.string().optional(),
  categoriaId: yup.string().required('La categoría es requerida').test('not-empty', 'Debe seleccionar una categoría', (value) => {
    return value !== '' && ['medicamento', 'material_medico', 'insumo'].includes(value);
  }),
  proveedorId: yup.number().required('El proveedor es requerido').test('positive', 'Debe seleccionar un proveedor', value => value > 0),
  unidadMedida: yup.string().required('La unidad de medida es requerida'),
  contenidoPorUnidad: yup.string().optional(),
  precioCompra: yup.number().required('El precio de compra es requerido').min(0, 'Debe ser mayor a 0'),
  precioVenta: yup.number().required('El precio de venta es requerido').min(0, 'Debe ser mayor a 0'),
  stockMinimo: yup.number().required('El stock mínimo es requerido').min(0, 'Debe ser mayor o igual a 0'),
  stockMaximo: yup.number().required('El stock máximo es requerido').min(1, 'Debe ser mayor a 0'),
  stockActual: yup.number().required('El stock actual es requerido').min(0, 'Debe ser mayor o igual a 0'),
  ubicacion: yup.string().optional(),
  requiereReceta: yup.boolean(),
  fechaCaducidad: yup.string().optional(),
  lote: yup.string().optional()
});

interface ProductFormDialogProps {
  open: boolean;
  product?: Product | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: () => void;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  product,
  suppliers,
  onClose,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [margenGanancia, setMargenGanancia] = useState<number>(0);

  const isEditing = !!product;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateProductRequest | UpdateProductRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      codigo: '',
      codigoBarras: '',
      nombre: '',
      descripcion: '',
      categoriaId: '',
      proveedorId: 0,
      unidadMedida: '',
      contenidoPorUnidad: '',
      precioCompra: 0,
      precioVenta: 0,
      stockMinimo: 0,
      stockMaximo: 100,
      stockActual: 0,
      ubicacion: '',
      requiereReceta: false,
      fechaCaducidad: '',
      lote: ''
    }
  });

  const precioCompra = watch('precioCompra');
  const precioVenta = watch('precioVenta');

  // Calcular margen de ganancia
  useEffect(() => {
    if (precioCompra > 0 && precioVenta > 0) {
      const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
      setMargenGanancia(margen);
    } else {
      setMargenGanancia(0);
    }
  }, [precioCompra, precioVenta]);

  // Llenar formulario cuando se edita
  useEffect(() => {
    if (product && isEditing) {
      reset({
        codigo: product.codigo,
        codigoBarras: product.codigoBarras || '',
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        categoriaId: product.categoria,
        proveedorId: product.proveedor.id,
        unidadMedida: product.unidadMedida,
        contenidoPorUnidad: product.contenidoPorUnidad || '',
        precioCompra: product.precioCompra,
        precioVenta: product.precioVenta,
        stockMinimo: product.stockMinimo,
        stockMaximo: product.stockMaximo,
        stockActual: product.stockActual,
        ubicacion: product.ubicacion || '',
        requiereReceta: product.requiereReceta,
        fechaCaducidad: product.fechaCaducidad || '',
        lote: product.lote || ''
      });
    } else {
      // Generar código automático para nuevo producto
      const codigo = `PROD-${Date.now().toString().slice(-6)}`;
      reset({
        codigo,
        codigoBarras: '',
        nombre: '',
        descripcion: '',
        categoriaId: '',
        proveedorId: 0,
        unidadMedida: '',
        contenidoPorUnidad: '',
        precioCompra: 0,
        precioVenta: 0,
        stockMinimo: 0,
        stockMaximo: 100,
        stockActual: 0,
        ubicacion: '',
        requiereReceta: false,
        fechaCaducidad: '',
        lote: ''
      });
    }
  }, [product, isEditing, reset]);

  const onFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing && product) {
        await inventoryService.updateProduct(product.id, data as UpdateProductRequest);
      } else {
        await inventoryService.createProduct(data as CreateProductRequest);
      }

      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setError(null);
      onClose();
    }
  };

  const calculatePrecioVenta = () => {
    const compra = watch('precioCompra');
    if (compra > 0) {
      const ventaCalculado = compra * 1.3; // 30% de margen por defecto
      setValue('precioVenta', Number(ventaCalculado.toFixed(2)));
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.nombre;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ProductIcon color="primary" />
        {isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto'}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onFormSubmit)}>
          <Grid container spacing={3}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ProductIcon fontSize="small" />
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código de Producto"
                    placeholder="PROD-123456"
                    error={!!errors.codigo}
                    helperText={errors.codigo?.message}
                    disabled={isEditing}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="codigoBarras"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código de Barras"
                    placeholder="7501234567890"
                    error={!!errors.codigoBarras}
                    helperText={errors.codigoBarras?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="unidadMedida"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.unidadMedida}>
                    <InputLabel>Unidad de Medida</InputLabel>
                    <Select {...field} label="Unidad de Medida">
                      <MenuItem value="">
                        <em>Seleccionar unidad</em>
                      </MenuItem>
                      {UNIT_TYPES.map(unit => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.unidadMedida && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.unidadMedida.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="contenidoPorUnidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contenido por Unidad"
                    placeholder="Ej: 1, 500, 250ml"
                    size="small"
                    error={!!errors.contenidoPorUnidad}
                    helperText={errors.contenidoPorUnidad?.message || 'Especifica la cantidad o contenido por unidad'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          📦
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Producto"
                    placeholder="Nombre completo del producto"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="requiereReceta"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="secondary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PharmacyIcon fontSize="small" />
                        Requiere Receta
                      </Box>
                    }
                  />
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
                    multiline
                    rows={3}
                    label="Descripción"
                    placeholder="Descripción detallada del producto, indicaciones, etc."
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Clasificación */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Clasificación y Proveedor
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="categoriaId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoriaId}>
                    <InputLabel>Categoría</InputLabel>
                    <Select {...field} label="Categoría">
                      <MenuItem value="">
                        <em>Seleccionar categoría</em>
                      </MenuItem>
                      {PRODUCT_CATEGORIES.map(category => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoriaId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.categoriaId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="proveedorId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.proveedorId}>
                    <InputLabel>Proveedor</InputLabel>
                    <Select {...field} label="Proveedor">
                      <MenuItem value={0}>
                        <em>Seleccionar proveedor</em>
                      </MenuItem>
                      {(suppliers || []).map(supplier => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.nombreComercial || supplier.razonSocial}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.proveedorId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.proveedorId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Precios */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon fontSize="small" />
                Precios y Margen
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="precioCompra"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Precio de Compra"
                    error={!!errors.precioCompra}
                    helperText={errors.precioCompra?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="precioVenta"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Precio de Venta"
                    error={!!errors.precioVenta}
                    helperText={errors.precioVenta?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button size="small" onClick={calculatePrecioVenta}>
                            +30%
                          </Button>
                        </InputAdornment>
                      )
                    }}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Chip
                  label={`Margen: ${margenGanancia.toFixed(1)}%`}
                  color={margenGanancia > 0 ? 'success' : 'default'}
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Stock */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Control de Stock
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="stockActual"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Stock Actual"
                    error={!!errors.stockActual}
                    helperText={errors.stockActual?.message}
                    inputProps={{ min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="stockMinimo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Stock Mínimo"
                    error={!!errors.stockMinimo}
                    helperText={errors.stockMinimo?.message}
                    inputProps={{ min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="stockMaximo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Stock Máximo"
                    error={!!errors.stockMaximo}
                    helperText={errors.stockMaximo?.message}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Información Adicional */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Adicional
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="ubicacion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ubicación en Almacén"
                    placeholder="Ej: Pasillo A, Estante 3"
                    error={!!errors.ubicacion}
                    helperText={errors.ubicacion?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="lote"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Lote"
                    placeholder="Número de lote"
                    error={!!errors.lote}
                    helperText={errors.lote?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="fechaCaducidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Fecha de Caducidad"
                    error={!!errors.fechaCaducidad}
                    helperText={errors.fechaCaducidad?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onFormSubmit)}
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;