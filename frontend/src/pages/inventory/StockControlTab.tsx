// ABOUTME: Componente de control de stock e inventario con alertas de reorden
// Muestra alertas de stock bajo, recomendaciones de pedidos y configuración de umbrales

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/hooks/useNotification';
import {
  Box,
  Typography,
  Grid,
  Button,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  ShoppingCart as OrderIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import StockAlertCard from '@/components/inventory/StockAlertCard';
import StockAlertStats from '@/components/inventory/StockAlertStats';
import StockAlertConfigDialog from '@/components/inventory/StockAlertConfigDialog';
import { inventoryService } from '@/services/inventoryService';
import { stockAlertService, StockAlert } from '@/services/stockAlertService';
import { Product } from '@/types/inventory.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-control-tabpanel-${index}`}
      aria-labelledby={`stock-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const StockControlTab: React.FC = () => {
  const { showInfo, showSuccess } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Estados para diálogos
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderRecommendations, setOrderRecommendations] = useState<any[]>([]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar todos los productos para análisis de alertas
      const response = await inventoryService.getProducts({ limit: 1000, offset: 0 });
      
      if (response.success && response.data && response.data?.products || []) {
        const products = response.data?.products || [];
        setProducts(products);
        
        // Generar alertas
        const generatedAlerts = stockAlertService.generateAlerts(products);
        setAlerts(generatedAlerts);
        
        // Generar recomendaciones de pedidos
        const recommendations = stockAlertService.generateOrderRecommendations(generatedAlerts);
        setOrderRecommendations(recommendations);
      } else {
        setProducts([]);
        setAlerts([]);
        setOrderRecommendations([]);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
      console.error('Error loading products for alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleConfigSave = () => {
    // Regenerar alertas con nueva configuración
    const generatedAlerts = stockAlertService.generateAlerts(products);
    setAlerts(generatedAlerts);
    
    const recommendations = stockAlertService.generateOrderRecommendations(generatedAlerts);
    setOrderRecommendations(recommendations);
  };

  const handleViewProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      // Funcionalidad planificada: Modal de detalles se implementará con el módulo de edición de productos
      showInfo(`Producto: ${product.nombre} - Stock: ${product.stockActual} ${product.unidadMedida}`);
    }
  };

  const handleOrderProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setOrderDialogOpen(true);
    }
  };

  const handleExportAlerts = () => {
    const alertsData = alerts.map(alert => ({
      Producto: alert.product.nombre,
      Código: alert.product.codigo,
      Tipo_Alerta: alert.type,
      Severidad: alert.severity,
      Mensaje: alert.message,
      Stock_Actual: alert.product.stockActual,
      Stock_Mínimo: alert.product.stockMinimo,
      Días_Para_Vencer: alert.daysToExpire || 'N/A',
      Fecha_Caducidad: alert.product.fechaCaducidad || 'N/A'
    }));

    const csv = [
      Object.keys(alertsData[0] || {}).join(','),
      ...alertsData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas_stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const alertStats = stockAlertService.getAlertStats(alerts);
  const criticalAlerts = stockAlertService.getCriticalAlerts(alerts);

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
          <AssessmentIcon color="primary" />
          Control de Stock y Alertas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Configurar
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportAlerts}
            disabled={alerts.length === 0}
          >
            Exportar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProducts}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 3 }}>
        <StockAlertStats
          stats={alertStats}
          loading={loading}
          onConfigureAlerts={() => setConfigDialogOpen(true)}
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="stock control tabs"
        >
          <Tab label={`Alertas Activas (${alerts.length})`} icon={<WarningIcon />} />
          <Tab label={`Recomendaciones (${orderRecommendations.length})`} icon={<OrderIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StockAlertCard
              alerts={alerts}
              loading={loading}
              onRefresh={loadProducts}
              onViewProduct={handleViewProduct}
              onOrderProduct={handleOrderProduct}
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <OrderIcon color="primary" />
              Recomendaciones de Pedidos
            </Typography>
            
            {orderRecommendations.length === 0 ? (
              <Alert severity="success">
                No hay recomendaciones de pedidos en este momento. Todos los productos tienen niveles de stock adecuados.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Basado en las alertas activas, se recomienda realizar los siguientes pedidos:
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Stock Actual</TableCell>
                        <TableCell align="center">Cantidad Recomendada</TableCell>
                        <TableCell>Razón</TableCell>
                        <TableCell align="center">Prioridad</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderRecommendations.map((rec, index) => (
                        <TableRow key={`${rec.productId}-${index}`}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {rec.productName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {rec.currentStock}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {rec.recommendedQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {rec.reason}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={rec.priority}
                              color={
                                rec.priority === 'high' ? 'error' :
                                rec.priority === 'medium' ? 'warning' : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Generar pedido">
                              <IconButton
                                size="small"
                                onClick={() => handleOrderProduct(rec.productId)}
                                color="primary"
                              >
                                <ShippingIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<OrderIcon />}
                    onClick={() => {
                      // Funcionalidad planificada: Generación masiva de órdenes de compra en módulo de compras
                      showInfo(`${orderRecommendations.length} pedidos recomendados. La generación automática de órdenes de compra estará disponible próximamente.`);
                    }}
                  >
                    Generar Todos los Pedidos Recomendados
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Diálogos */}
      <StockAlertConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        onSave={handleConfigSave}
      />

      {/* Diálogo de Pedido */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Pedido</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.nombre}
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Stock Actual"
                    secondary={`${selectedProduct.stockActual} ${selectedProduct.unidadMedida}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="Stock Mínimo"
                    secondary={`${selectedProduct.stockMinimo} ${selectedProduct.unidadMedida}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Stock Máximo"
                    secondary={`${selectedProduct.stockMaximo} ${selectedProduct.unidadMedida}`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon><OrderIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Cantidad Recomendada"
                    secondary={`${selectedProduct.stockMaximo - selectedProduct.stockActual} ${selectedProduct.unidadMedida}`}
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Esta funcionalidad se integrará con el módulo de compras para generar órdenes de compra automáticamente.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Funcionalidad planificada: Integración con módulo de compras para generar órdenes de compra
              showSuccess(`Pedido registrado para ${selectedProduct?.nombre || 'producto'}. La orden de compra se generará en el módulo de compras.`);
              setOrderDialogOpen(false);
            }}
          >
            Generar Pedido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockControlTab;