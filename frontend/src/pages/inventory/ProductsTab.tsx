import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Alert,
  Stack,
  Tooltip,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  LocalPharmacy as PharmacyIcon,
  QrCode as QrCodeIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

import {
  Product,
  ProductFilters,
  ProductsResponse,
  CategoriaProducto,
  PRODUCT_CATEGORIES,
  UNIT_TYPES
} from '@/types/inventory.types';
import { Supplier } from '@/types/inventory.types';
import { inventoryService } from '@/services/inventoryService';
import ProductFormDialog from './ProductFormDialog';

interface ProductsTabProps {
  suppliers: Supplier[];
  onRefreshSuppliers: () => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ suppliers, onRefreshSuppliers }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoriaId: undefined,
    proveedorId: undefined,
    stockBajo: false,
    proximosVencer: false,
    activo: true,
    requiereReceta: undefined
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await inventoryService.getProducts({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success && response.data) {
        setProducts(response.data?.products || [] || []);
        setTotal(response.data.total || 0);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      setError('Error al cargar productos');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, rowsPerPage, page]);

  useEffect(() => {
    loadProducts();
  }, [page, rowsPerPage, filters, loadProducts]);

  const handleSearch = useCallback(() => {
    setPage(0);
    loadProducts();
  }, [loadProducts]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      categoriaId: undefined,
      proveedorId: undefined,
      stockBajo: false,
      proximosVencer: false,
      activo: true,
      requiereReceta: undefined
    });
    setPage(0);
  }, []);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleOpenForm = useCallback((product?: Product) => {
    setSelectedProduct(product || null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleFormSubmit = useCallback(() => {
    handleCloseForm();
    loadProducts();
  }, [handleCloseForm, loadProducts]);

  const handleDeleteProduct = useCallback(async (productId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      return;
    }

    try {
      await inventoryService.deleteProduct(productId);
      loadProducts();
    } catch (err) {
      setError('Error al eliminar producto');
      console.error('Error deleting product:', err);
    }
  }, [loadProducts]);

  const getStockStatus = useCallback((product: Product) => {
    if (product.stockActual <= 0) {
      return { color: 'error', label: 'Sin Stock', icon: <WarningIcon fontSize="small" /> };
    } else if (product.stockActual <= product.stockMinimo) {
      return { color: 'warning', label: 'Stock Bajo', icon: <WarningIcon fontSize="small" /> };
    } else {
      return { color: 'success', label: 'En Stock', icon: <InventoryIcon fontSize="small" /> };
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }, []);

  const getCategoryName = useCallback((categoria: string) => {
    const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoria);
    return category?.nombre || 'Sin categoría';
  }, []);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          Gestión de Productos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'inherit'}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProducts}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar producto"
                placeholder="Nombre, código o descripción"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.categoriaId || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    categoriaId: e.target.value ? e.target.value as CategoriaProducto : undefined 
                  }))}
                  label="Categoría"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {PRODUCT_CATEGORIES.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={filters.proveedorId || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    proveedorId: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  label="Proveedor"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.nombreComercial || supplier.razonSocial}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.stockBajo || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, stockBajo: e.target.checked }))}
                    />
                  }
                  label="Stock Bajo"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.proximosVencer || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, proximosVencer: e.target.checked }))}
                    />
                  }
                  label="Próximos a Vencer"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.activo !== false}
                    onChange={(e) => setFilters(prev => ({ ...prev, activo: e.target.checked }))}
                  />
                }
                label="Activos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={<SearchIcon />}
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabla de Productos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="center">Contenido</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Precio Compra</TableCell>
                  <TableCell align="right">Precio Venta</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: product.requiereReceta ? 'secondary.main' : 'primary.main',
                                width: 32, 
                                height: 32 
                              }}
                            >
                              {product.requiereReceta ? (
                                <PharmacyIcon fontSize="small" />
                              ) : (
                                <InventoryIcon fontSize="small" />
                              )}
                            </Avatar>
                            <Box>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="medium"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '200px'
                                }}
                              >
                                {product.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Código: {product.codigo}
                                {product.codigoBarras && (
                                  <Tooltip title={`Código de barras: ${product.codigoBarras}`}>
                                    <QrCodeIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                                  </Tooltip>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getCategoryName(product.categoria)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px'
                            }}
                          >
                            {product.proveedor.nombreComercial || product.proveedor.razonSocial}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {product.contenidoPorUnidad && (
                              <Typography variant="body2" fontWeight="medium">
                                {product.contenidoPorUnidad}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {product.unidadMedida}
                            </Typography>
                          </Box>
                          {!product.contenidoPorUnidad && (
                            <Typography variant="caption" color="text.secondary" style={{ fontStyle: 'italic' }}>
                              1 {product.unidadMedida}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {product.stockActual}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              unidades
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Min: {product.stockMinimo} | Max: {product.stockMaximo}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={stockStatus.icon}
                            label={stockStatus.label}
                            color={stockStatus.color as any}
                            size="small"
                          />
                          {!product.activo && (
                            <Chip
                              label="Inactivo"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }}
                          >
                            {formatCurrency(product.precioCompra)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="medium" 
                            color="success.main"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }}
                          >
                            {formatCurrency(product.precioVenta)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {((product.precioVenta - product.precioCompra) / product.precioCompra * 100).toFixed(1)}% margen
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Editar producto">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenForm(product)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar producto">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteProduct(product.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Formulario de Producto */}
      <ProductFormDialog
        open={isFormOpen}
        product={selectedProduct}
        suppliers={suppliers}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />
    </Box>
  );
};

export default ProductsTab;