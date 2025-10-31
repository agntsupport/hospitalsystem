import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  LocalHospital as ServiceIcon,
  Inventory as ProductIcon,
  AttachMoney as MoneyIcon,
  Print as PrintIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { inventoryService } from '@/services/inventoryService';
import { CartItem, Service, Product } from '@/types/pos.types';

interface QuickSalesTabProps {
  onRefresh?: () => void;
}

interface QuickSale {
  items: CartItem[];
  total: number;
  metodoPago: PaymentMethod;
  montoRecibido?: number;
  cambio?: number;
  observaciones?: string;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

const QuickSalesTab: React.FC<QuickSalesTabProps> = ({ onRefresh }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(0); // 0: servicios, 1: productos
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<QuickSale>({
    items: [],
    total: 0,
    metodoPago: 'efectivo'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Actualizar total del carrito
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setPaymentData(prev => ({ ...prev, items: cart, total }));
  }, [cart]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar servicios disponibles
      const servicesResponse = await posService.getAvailableServices();
      if (servicesResponse.success) {
        const servicesData = servicesResponse.data?.items || [] || servicesResponse.data?.services || [] || [];
        setServices(servicesData);
      }

      // Cargar productos disponibles (con stock)
      const productsResponse = await inventoryService.getProducts({ 
        activo: true,
        limit: 100
      });
      if (productsResponse.success) {
        const productsData = productsResponse.data.products || productsResponse.data?.items || [] || [];
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Service | Product, type: 'servicio' | 'producto') => {
    const cartId = `${type}-${item.id}`;
    const existingItem = cart.find(cartItem => cartItem.id === cartId);

    if (existingItem) {
      // Incrementar cantidad si ya existe
      setCart(prev => prev.map(cartItem => 
        cartItem.id === cartId 
          ? { 
              ...cartItem, 
              cantidad: cartItem.cantidad + 1,
              subtotal: (cartItem.cantidad + 1) * cartItem.precio
            }
          : cartItem
      ));
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        id: cartId,
        tipo: type,
        itemId: item.id,
        nombre: item.nombre,
        precio: type === 'servicio' ? item.precio : (item as any).precioVenta || (item as any).precio_venta || 0,
        cantidad: 1,
        subtotal: type === 'servicio' ? item.precio : (item as any).precioVenta || (item as any).precio_venta || 0,
        disponible: type === 'producto' ? (item as any).stockActual || (item as any).stockActual : undefined
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateCartItemQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
      return;
    }

    const cartItem = cart.find(item => item.id === cartId);
    if (cartItem && cartItem.tipo === 'producto' && cartItem.disponible && newQuantity > cartItem.disponible) {
      return; // No permitir más cantidad que el stock disponible
    }

    setCart(prev => prev.map(item => 
      item.id === cartId 
        ? { 
            ...item, 
            cantidad: newQuantity,
            subtotal: newQuantity * item.precio
          }
        : item
    ));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setPaymentData({
      items: [...cart],
      total,
      metodoPago: 'efectivo',
      montoRecibido: total
    });
    setCheckoutOpen(true);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Procesar venta rápida
      const saleData = {
        items: paymentData.items.map(item => ({
          tipo: item.tipo,
          itemId: item.itemId,
          cantidad: item.cantidad,
          precioUnitario: item.precio
        })),
        metodoPago: paymentData.metodoPago,
        montoRecibido: paymentData.montoRecibido || paymentData.total,
        observaciones: paymentData.observaciones
      };

      const response = await posService.processQuickSale(saleData);
      
      if (response.success) {
        // Limpiar carrito y cerrar diálogo
        clearCart();
        setCheckoutOpen(false);
        setPaymentData({
          items: [],
          total: 0,
          metodoPago: 'efectivo'
        });
        
        // Recargar datos para actualizar stock
        loadData();
        onRefresh?.();
        
        // Mostrar confirmación
        alert('Venta procesada correctamente');
      }
    } catch (error: any) {
      alert(error.message || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const calculateChange = () => {
    if (paymentData.montoRecibido && paymentData.montoRecibido >= paymentData.total) {
      return paymentData.montoRecibido - paymentData.total;
    }
    return 0;
  };

  const getServiceTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'consulta_general': return 'primary';
      case 'urgencia': return 'error';
      case 'hospitalizacion': return 'warning';
      default: return 'default';
    }
  };

  const getProductCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'medicamento': return 'success';
      case 'material_medico': return 'info';
      case 'insumo': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '70vh', display: 'flex', gap: 2 }}>
      {/* Panel izquierdo - Productos/Servicios */}
      <Card sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <CartIcon color="primary" />
              Catálogo de Ventas
            </Typography>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                minWidth: { xs: '120px', sm: '200px' },
                maxWidth: '250px',
                width: 250
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>

          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab 
              icon={<ServiceIcon />} 
              label={`Servicios (${filteredServices.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<ProductIcon />} 
              label={`Productos (${filteredProducts.length})`} 
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {currentTab === 0 && (
              <Grid container spacing={1}>
                {filteredServices.map((service) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={service.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => addToCart(service, 'servicio')}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Tooltip title={service.nombre} arrow placement="top">
                          <Typography 
                            variant="subtitle2" 
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 'medium',
                              lineHeight: 1.2
                            }}
                          >
                            {service.nombre}
                          </Typography>
                        </Tooltip>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          display="block"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mt: 0.5
                          }}
                        >
                          {service.codigo}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Chip
                            label={service.tipo.replace('_', ' ').toUpperCase()}
                            color={getServiceTypeColor(service.tipo) as any}
                            size="small"
                            sx={{
                              maxWidth: '120px',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }
                            }}
                          />
                          <Typography 
                            variant="h6" 
                            color="primary"
                            sx={{
                              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatCurrency(service.precio)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {currentTab === 1 && (
              <Grid container spacing={1}>
                {filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={product.id}>
                    <Card 
                      sx={{
                        cursor: (product.stockActual || 0) > 0 ? 'pointer' : 'not-allowed',
                        opacity: (product.stockActual || 0) > 0 ? 1 : 0.6,
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': (product.stockActual || 0) > 0 ? {
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        } : {}
                      }}
                      onClick={() => (product.stockActual || 0) > 0 && addToCart(product, 'producto')}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Tooltip title={product.nombre} arrow placement="top">
                          <Typography 
                            variant="subtitle2" 
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 'medium',
                              lineHeight: 1.2
                            }}
                          >
                            {product.nombre}
                          </Typography>
                        </Tooltip>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          display="block"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mt: 0.5
                          }}
                        >
                          {product.codigo}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Box>
                            <Chip
                              label={(product.categoria || 'general').replace('_', ' ').toUpperCase()}
                              color={getProductCategoryColor(product.categoria || 'general') as any}
                              size="small"
                              sx={{
                                maxWidth: '120px',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              display="block" 
                              sx={{ 
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Stock: {product.stockActual || 0}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="h6" 
                            color="primary"
                            sx={{
                              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }}
                          >
                            {formatCurrency(product.precioVenta || (product as any).precio_venta || 0)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Panel derecho - Carrito */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={cart.length} color="primary">
                <CartIcon />
              </Badge>
              Carrito de Venta
            </Typography>
            {cart.length > 0 && (
              <Tooltip title="Limpiar carrito">
                <IconButton onClick={clearCart} size="small" color="error">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {cart.length === 0 ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              color: 'text.secondary'
            }}>
              <CartIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6">Carrito vacío</Typography>
              <Typography variant="body2">
                Selecciona servicios o productos para agregar
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ flex: 1, overflow: 'auto', px: 0 }}>
                {cart.map((item) => (
                  <ListItem key={item.id} divider sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.nombre}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          {formatCurrency(item.subtotal)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateCartItemQuantity(item.id, item.cantidad - 1)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                          {item.cantidad}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => updateCartItemQuantity(item.id, item.cantidad + 1)}
                          disabled={item.disponible ? item.cantidad >= item.disponible : false}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">
                          {formatCurrency(item.precio)} c/u
                        </Typography>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => removeFromCart(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(cart.reduce((sum, item) => sum + item.subtotal, 0))}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<PaymentIcon />}
                onClick={handleCheckout}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Procesar Venta
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Checkout */}
      <Dialog 
        open={checkoutOpen} 
        onClose={() => setCheckoutOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon />
          Procesar Pago - {formatCurrency(paymentData.total)}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Resumen de Venta
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2">{item.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(item.precio)} c/u
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(paymentData.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Información de Pago
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentData.metodoPago}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    metodoPago: e.target.value as PaymentMethod 
                  }))}
                  label="Método de Pago"
                >
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="tarjeta">Tarjeta</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                </Select>
              </FormControl>

              {paymentData.metodoPago === 'efectivo' && (
                <TextField
                  fullWidth
                  type="number"
                  label="Monto Recibido"
                  value={paymentData.montoRecibido || ''}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    montoRecibido: parseFloat(e.target.value) || undefined 
                  }))}
                  sx={{ mb: 2 }}
                />
              )}

              {paymentData.metodoPago === 'efectivo' && paymentData.montoRecibido && (
                <Alert severity={calculateChange() >= 0 ? "info" : "error"} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Cambio: {formatCurrency(calculateChange())}</strong>
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones (opcional)"
                value={paymentData.observaciones || ''}
                onChange={(e) => setPaymentData(prev => ({ 
                  ...prev, 
                  observaciones: e.target.value 
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePayment}
            disabled={loading || (paymentData.metodoPago === 'efectivo' && calculateChange() < 0)}
            startIcon={loading ? undefined : <CheckIcon />}
          >
            {loading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickSalesTab;