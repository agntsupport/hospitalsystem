import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { PatientAccount, Service, Product, CartItem } from '@/types/pos.types';
import { cartSchema, CartFormValues } from '@/schemas/pos.schemas';

interface POSTransactionDialogProps {
  open: boolean;
  account: PatientAccount | null;
  onClose: () => void;
  onTransactionAdded: () => void;
}

const POSTransactionDialog: React.FC<POSTransactionDialogProps> = ({
  open,
  account,
  onClose,
  onTransactionAdded,
}) => {
  // React Hook Form setup for cart validation
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CartFormValues>({
    resolver: yupResolver(cartSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'servicio' | 'producto'>('servicio');

  useEffect(() => {
    if (open) {
      loadServices();
      loadProducts();
    }
  }, [open]);

  const loadServices = async () => {
    try {
      const response = await posService.getServices({ activo: true });
      if (response.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadProducts = async () => {
    try {
      // Usar inventario integrado con filtro de stock mínimo para obtener solo productos disponibles
      const response = await posService.getProducts({ 
        activo: true, 
        stockMinimo: 1 // Solo productos con stock disponible
      });
      if (response.success) {
        setProducts(response.data?.items || response.data?.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addToCart = (item: Service | Product, type: 'servicio' | 'producto') => {
    const cartItemId = `${type}_${item.id}`;
    const existingItemIndex = cart.findIndex(c => c.id === cartItemId);
    
    if (existingItemIndex >= 0) {
      const existingItem = cart[existingItemIndex];
      // Si es producto, verificar stock disponible
      if (type === 'producto') {
        const product = item as Product;
        if (existingItem.cantidad >= product.stockActual) {
          setError(`Stock insuficiente. Disponible: ${product.stockActual}`);
          return;
        }
      }
      
      const updatedCart = cart.map(c => 
        c.id === cartItemId 
          ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.precio }
          : c
      );
      setCart(updatedCart);
      setValue('items', updatedCart);
    } else {
      const precio = type === 'servicio' ? (item as Service).precio : (item as Product).precioVenta;
      const newCartItem: CartItem = {
        id: cartItemId,
        tipo: type,
        itemId: item.id,
        nombre: item.nombre,
        precio,
        cantidad: 1,
        subtotal: precio,
        disponible: type === 'producto' ? (item as Product).stockActual : undefined
      };
      const updatedCart = [...cart, newCartItem];
      setCart(updatedCart);
      setValue('items', updatedCart);
    }
    setError(null);
  };

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const cartItem = cart.find(c => c.id === cartItemId);
    if (cartItem?.tipo === 'producto' && cartItem.disponible && newQuantity > cartItem.disponible) {
      setError(`Stock insuficiente. Disponible: ${cartItem.disponible}`);
      return;
    }

    const updatedCart = cart.map(c => 
      c.id === cartItemId 
        ? { ...c, cantidad: newQuantity, subtotal: newQuantity * c.precio }
        : c
    );
    setCart(updatedCart);
    setValue('items', updatedCart);
    setError(null);
  };

  const removeFromCart = (cartItemId: string) => {
    const updatedCart = cart.filter(c => c.id !== cartItemId);
    setCart(updatedCart);
    setValue('items', updatedCart);
  };

  const getTotalCart = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const onSubmit = async (data: CartFormValues) => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      // Procesar cada item del carrito como una transacción separada
      for (const item of data.items) {
        const transactionData = {
          tipo: item.tipo,
          cantidad: item.cantidad,
          ...(item.tipo === 'servicio' 
            ? { servicioId: item.itemId } 
            : { productoId: item.itemId }
          )
        };

        await posService.addTransaction(account.id, transactionData);
      }

      onTransactionAdded();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Error al procesar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCart([]);
    reset({ items: [] });
    setError(null);
    setSearchType('servicio');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const currentItems = searchType === 'servicio' ? services : products;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CartIcon />
        Agregar Servicios/Productos
        {account && (
          <Typography variant="subtitle2" color="text.secondary">
            - Cuenta #{account.id} ({account.paciente?.nombre} {account.paciente?.apellidoPaterno})
          </Typography>
        )}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {errors.items && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.items.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Selector de tipo */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Item</InputLabel>
              <Select
                value={searchType}
                label="Tipo de Item"
                onChange={(e) => setSearchType(e.target.value as 'servicio' | 'producto')}
              >
                <MenuItem value="servicio">Servicios Médicos</MenuItem>
                <MenuItem value="producto">Productos/Medicamentos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Lista de items disponibles */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              {searchType === 'servicio' ? 'Servicios Disponibles' : 'Productos Disponibles'}
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {currentItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => addToCart(item, searchType)}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {item.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.codigo} - {formatCurrency(searchType === 'servicio' ? (item as Service).precio : (item as Product).precioVenta)}
                    {searchType === 'producto' && (
                      <>
                        {` • Stock: ${(item as Product).stockActual}`}
                        {(item as Product).stockActual <= (item as Product).stockMinimo && (
                          <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                            (Stock Bajo)
                          </Typography>
                        )}
                      </>
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Carrito */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Carrito de Compras
            </Typography>
            
            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <CartIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography>Carrito vacío</Typography>
                <Typography variant="caption">
                  Haga clic en un servicio o producto para agregarlo
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2">{item.nombre}</Typography>
                          {item.disponible && (
                            <Typography variant="caption" color="text.secondary">
                              Disponible: {item.disponible}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {item.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => updateCartItemQuantity(item.id, item.cantidad - 1)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <TextField
                              size="small"
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 0)}
                              sx={{ width: 60 }}
                              inputProps={{ min: 1, max: item.disponible }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => updateCartItemQuantity(item.id, item.cantidad + 1)}
                              disabled={item.disponible ? item.cantidad >= item.disponible : false}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.precio)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">
                            {formatCurrency(item.subtotal)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="h6">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(getTotalCart())}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || cart.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Procesando...' : `Agregar ${cart.length} Item(s)`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default POSTransactionDialog;