// ABOUTME: Página de Módulo de Inventario del sistema hospitalario
// ABOUTME: Gestión de proveedores, productos, servicios y control de stock

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add as AddIcon
} from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';
import InventoryStatsCard from './InventoryStatsCard';
import SuppliersTab from './SuppliersTab';
import ProductsTab from './ProductsTab';
import StockMovementsTab from './StockMovementsTab';
import StockControlTab from './StockControlTab';
import ServicesTab from './ServicesTab';
import SupplierFormDialog from './SupplierFormDialog';
import ProductFormDialog from './ProductFormDialog';
import StockMovementDialog from './StockMovementDialog';
import { inventoryService } from '@/services/inventoryService';
import { InventoryStats, Supplier } from '@/types/inventory.types';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

const InventoryPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [value, setValue] = useState(0);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Estados para datos
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  
  // Estados para diálogos
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await inventoryService.getInventoryStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading inventory stats:', error);
      setStatsError(error?.message || 'Error al cargar estadísticas');
    } finally {
      setStatsLoading(false);
    }
  };

  // Cargar proveedores
  const loadSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await inventoryService.getSuppliers({});
      if (response.success && response.data) {
        setSuppliers(response.data?.items || response.data?.suppliers || []);
      } else {
        setSuppliers([]);
      }
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadSuppliers();
  }, []);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAddButtonClick = () => {
    switch (value) {
      case 0: // Estadísticas - no aplica
        break;
      case 1: // Proveedores
        setSupplierDialogOpen(true);
        break;
      case 2: // Productos
        setProductDialogOpen(true);
        break;
      case 3: // Servicios - manejado internamente por ServicesTab
        break;
      case 4: // Control de Stock - no aplica
        break;
      case 5: // Movimientos
        setMovementDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const handleDataChange = () => {
    loadStats(); // Recargar estadísticas cuando cambian los datos
    loadSuppliers(); // Recargar proveedores cuando cambian los datos
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierDialogOpen(true);
  };

  const handleCloseSupplierDialog = () => {
    setSupplierDialogOpen(false);
    setEditingSupplier(null);
  };

  const getFabTooltip = () => {
    switch (value) {
      case 1: return 'Agregar Proveedor';
      case 2: return 'Agregar Producto';
      case 3: return '';
      case 4: return '';
      case 5: return 'Registrar Movimiento';
      default: return '';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Módulo de Inventario"
        subtitle="Gestión integral de proveedores, productos y control de stock"
        icon={<InventoryIcon />}
        iconColor="primary"
      />

      {/* Estadísticas Card */}
      <Box sx={{ mb: 4 }}>
        <InventoryStatsCard
          stats={stats}
          loading={statsLoading}
          onRefresh={loadStats}
        />
      </Box>

      {statsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statsError}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="inventory tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="Resumen" {...a11yProps(0)} />
          <Tab label="Proveedores" {...a11yProps(1)} />
          <Tab label="Productos" {...a11yProps(2)} />
          <Tab label="Servicios" {...a11yProps(3)} />
          <Tab label="Control de Stock" {...a11yProps(4)} />
          <Tab label="Movimientos" {...a11yProps(5)} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={value} index={0}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Resumen del Inventario
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Las estadísticas se muestran en la tarjeta superior. Selecciona una pestaña para gestionar proveedores, productos o movimientos de stock.
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <SuppliersTab 
          onDataChange={handleDataChange}
          onEditSupplier={handleEditSupplier}
        />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <ProductsTab 
          suppliers={suppliers}
          onRefreshSuppliers={loadSuppliers}
        />
      </TabPanel>

      <TabPanel value={value} index={3}>
        <ServicesTab />
      </TabPanel>

      <TabPanel value={value} index={4}>
        <StockControlTab />
      </TabPanel>

      <TabPanel value={value} index={5}>
        <StockMovementsTab onDataChange={handleDataChange} />
      </TabPanel>

      {/* Floating Action Button */}
      {value > 0 && value !== 4 && getFabTooltip() && (
        <Fab
          color="primary"
          aria-label={getFabTooltip()}
          title={getFabTooltip()}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
          onClick={handleAddButtonClick}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Diálogos */}
      <SupplierFormDialog
        open={supplierDialogOpen}
        onClose={handleCloseSupplierDialog}
        onSupplierCreated={handleDataChange}
        editingSupplier={editingSupplier}
      />

      <ProductFormDialog
        open={productDialogOpen}
        suppliers={suppliers}
        onClose={() => setProductDialogOpen(false)}
        onSubmit={handleDataChange}
      />

      <StockMovementDialog
        open={movementDialogOpen}
        onClose={() => setMovementDialogOpen(false)}
        onMovementCreated={handleDataChange}
      />
    </Box>
  );
};

export default InventoryPage;