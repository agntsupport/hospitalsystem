import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Business as SuppliersIcon,
  AttachMoney as ValueIcon,
  Warning as WarningIcon,
  Schedule as ExpiringIcon,
  Refresh as RefreshIcon,
  TrendingUp as StatsIcon,
  LocalShipping as MovementIcon,
  ShoppingCart as ProductIcon
} from '@mui/icons-material';

import { InventoryStats, MOVEMENT_TYPES } from '@/types/inventory.types';
import { inventoryService } from '@/services/inventoryService';

interface InventoryStatsCardProps {
  stats: InventoryStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const InventoryStatsCard: React.FC<InventoryStatsCardProps> = ({ 
  stats, 
  loading, 
  onRefresh 
}) => {
  if (loading || !stats) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = (stats?.lowStockProducts || 0) > 0 || (stats?.expiredProducts || 0) > 0;

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatsIcon color="primary" />
            <Typography variant="h6" component="h2">
              Estadísticas del Inventario
            </Typography>
          </Box>
          <IconButton onClick={onRefresh} size="small" title="Actualizar">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Alertas */}
        {hasAlerts && (
          <Box sx={{ mb: 3 }}>
            {(stats?.lowStockProducts || 0) > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {stats?.lowStockProducts || 0} producto{(stats?.lowStockProducts || 0) !== 1 ? 's' : ''} con stock bajo
              </Alert>
            )}
            {(stats?.expiredProducts || 0) > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {stats?.expiredProducts || 0} producto{(stats?.expiredProducts || 0) !== 1 ? 's' : ''} vencido{(stats?.expiredProducts || 0) !== 1 ? 's' : ''}
              </Alert>
            )}
          </Box>
        )}

        {/* Estadísticas Principales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <ProductIcon color="primary" />
                <Typography 
                  variant="h4" 
                  color="primary" 
                  fontWeight="bold" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stats?.totalProducts || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Total Productos
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <SuppliersIcon color="info" />
                <Typography 
                  variant="h4" 
                  color="info.main" 
                  fontWeight="bold" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stats?.totalSuppliers || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Proveedores
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <ValueIcon color="success" />
                <Typography 
                  variant="h4" 
                  color="success.main" 
                  fontWeight="bold" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {inventoryService.formatPrice(stats?.totalValue || 0).replace('MX$', '$')}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Valor Inventario
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" />
                <Typography 
                  variant="h4" 
                  color="warning.main" 
                  fontWeight="bold" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stats?.lowStockProducts || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Stock Bajo
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Distribución por Categorías */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon fontSize="small" />
            Distribución por Categorías
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(stats?.productsByCategory || {}).map(([category, count]) => (
              <Grid item xs={6} sm={4} key={category}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {count}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {category}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Productos Más Vendidos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatsIcon />
            Productos Más Vendidos
          </Typography>
          <List dense>
            {(stats?.topProducts || []).slice(0, 3).map((item, index) => (
              <ListItem key={item.producto.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Chip 
                    label={`#${index + 1}`} 
                    size="small" 
                    color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={item.producto.nombre}
                  secondary={`${item.cantidadVendida} unidades • ${inventoryService.formatPrice(item.ingresoTotal)}`}
                  primaryTypographyProps={{
                    sx: {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Movimientos Recientes */}
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovementIcon fontSize="small" />
            Movimientos Recientes
          </Typography>
          <List dense>
            {(stats?.recentMovements || []).slice(0, 3).map((movement) => (
              <ListItem key={movement.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Chip
                    label={MOVEMENT_TYPES[movement.tipo as keyof typeof MOVEMENT_TYPES]}
                    size="small"
                    color={
                      movement.tipo === 'entrada' ? 'success' :
                      movement.tipo === 'salida' ? 'primary' :
                      movement.tipo === 'merma' ? 'error' :
                      'default'
                    }
                    variant="outlined"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={movement.producto.nombre}
                  secondary={`${movement.cantidad} unidades • ${inventoryService.formatDateTime(movement.fecha)}`}
                  primaryTypographyProps={{
                    sx: {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Progreso de Movimientos Mensuales */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Movimientos por Mes
          </Typography>
          {Object.entries(stats?.monthlyMovements || {}).map(([month, count]) => (
            <Box key={month} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography 
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {month}
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="medium"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {count}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((count / Math.max(1, ...Object.values(stats?.monthlyMovements || {}))) * 100, 100)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InventoryStatsCard;