import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Alert,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  EventBusy as ExpiryIcon,
  Inventory as InventoryIcon,
  LocalPharmacy as PharmacyIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ShoppingCart as OrderIcon
} from '@mui/icons-material';

import { Product } from '@/types/inventory.types';

interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  product: Product;
  message: string;
  severity: 'warning' | 'error' | 'info';
  daysToExpire?: number;
  stockLevel?: number;
}

interface StockAlertCardProps {
  alerts: StockAlert[];
  loading: boolean;
  onRefresh: () => void;
  onViewProduct: (productId: number) => void;
  onOrderProduct: (productId: number) => void;
}

const StockAlertCard: React.FC<StockAlertCardProps> = ({
  alerts,
  loading,
  onRefresh,
  onViewProduct,
  onOrderProduct
}) => {
  const getAlertIcon = (type: StockAlert['type']) => {
    switch (type) {
      case 'out_of_stock':
        return <ErrorIcon color="error" />;
      case 'low_stock':
        return <WarningIcon color="warning" />;
      case 'expiring_soon':
        return <ExpiryIcon color="warning" />;
      case 'expired':
        return <ExpiryIcon color="error" />;
      default:
        return <WarningIcon />;
    }
  };

  const getAlertColor = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAlertTypeLabel = (type: StockAlert['type']) => {
    switch (type) {
      case 'out_of_stock':
        return 'Sin Stock';
      case 'low_stock':
        return 'Stock Bajo';
      case 'expiring_soon':
        return 'Por Vencer';
      case 'expired':
        return 'Vencido';
      default:
        return 'Alerta';
    }
  };

  const getAlertTypeCount = (type: StockAlert['type']) => {
    return alerts.filter(alert => alert.type === type).length;
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'error');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={alerts.length} color="error" max={99}>
              <WarningIcon color="primary" />
            </Badge>
            Alertas de Stock
          </Typography>
          <Tooltip title="Actualizar alertas">
            <span>
              <IconButton onClick={onRefresh} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<ErrorIcon />}
            label={`Sin Stock: ${getAlertTypeCount('out_of_stock')}`}
            color="error"
            size="small"
            variant={getAlertTypeCount('out_of_stock') > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<WarningIcon />}
            label={`Stock Bajo: ${getAlertTypeCount('low_stock')}`}
            color="warning"
            size="small"
            variant={getAlertTypeCount('low_stock') > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<ExpiryIcon />}
            label={`Por Vencer: ${getAlertTypeCount('expiring_soon')}`}
            color="warning"
            size="small"
            variant={getAlertTypeCount('expiring_soon') > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<ExpiryIcon />}
            label={`Vencidos: ${getAlertTypeCount('expired')}`}
            color="error"
            size="small"
            variant={getAlertTypeCount('expired') > 0 ? 'filled' : 'outlined'}
          />
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">Cargando alertas...</Typography>
          </Box>
        ) : alerts.length === 0 ? (
          <Alert severity="success" sx={{ textAlign: 'center' }}>
            ✅ No hay alertas activas. Todos los productos están en niveles óptimos.
          </Alert>
        ) : (
          <>
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <>
                <Typography variant="subtitle2" color="error" gutterBottom sx={{ mt: 2 }}>
                  🚨 Alertas Críticas ({criticalAlerts.length})
                </Typography>
                <List dense>
                  {criticalAlerts.slice(0, 5).map((alert) => (
                    <ListItem
                      key={alert.id}
                      sx={{
                        bgcolor: 'error.50',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'error.200'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alert.product.requiereReceta ? 'secondary.main' : 'primary.main',
                            width: 32,
                            height: 32
                          }}
                        >
                          {alert.product.requiereReceta ? (
                            <PharmacyIcon fontSize="small" />
                          ) : (
                            <InventoryIcon fontSize="small" />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {alert.product.nombre}
                            </Typography>
                            <Chip
                              label={getAlertTypeLabel(alert.type)}
                              color={getAlertColor(alert.severity) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.secondary" component="span" display="block">
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span" display="block">
                              Código: {alert.product.codigo} | Stock: {alert.product.stockActual} {alert.product.unidadMedida}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver producto">
                          <IconButton
                            size="small"
                            onClick={() => onViewProduct(alert.product.id)}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Solicitar pedido">
                          <IconButton
                            size="small"
                            onClick={() => onOrderProduct(alert.product.id)}
                            color="secondary"
                          >
                            <OrderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                {criticalAlerts.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    ... y {criticalAlerts.length - 5} alertas críticas más
                  </Typography>
                )}
              </>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
              <>
                {criticalAlerts.length > 0 && <Divider sx={{ my: 2 }} />}
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  ⚠️ Alertas de Advertencia ({warningAlerts.length})
                </Typography>
                <List dense>
                  {warningAlerts.slice(0, 3).map((alert) => (
                    <ListItem
                      key={alert.id}
                      sx={{
                        bgcolor: 'warning.50',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'warning.200'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alert.product.requiereReceta ? 'secondary.main' : 'primary.main',
                            width: 32,
                            height: 32
                          }}
                        >
                          {alert.product.requiereReceta ? (
                            <PharmacyIcon fontSize="small" />
                          ) : (
                            <InventoryIcon fontSize="small" />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {alert.product.nombre}
                            </Typography>
                            <Chip
                              label={getAlertTypeLabel(alert.type)}
                              color={getAlertColor(alert.severity) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.secondary" component="span" display="block">
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span" display="block">
                              Código: {alert.product.codigo} | Stock: {alert.product.stockActual} {alert.product.unidadMedida}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver producto">
                          <IconButton
                            size="small"
                            onClick={() => onViewProduct(alert.product.id)}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Solicitar pedido">
                          <IconButton
                            size="small"
                            onClick={() => onOrderProduct(alert.product.id)}
                            color="secondary"
                          >
                            <OrderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                {warningAlerts.length > 3 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    ... y {warningAlerts.length - 3} alertas de advertencia más
                  </Typography>
                )}
              </>
            )}

            {/* Action Buttons */}
            {alerts.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => {/* TODO: Implementar vista de todas las alertas */}}
                >
                  Ver Todas las Alertas ({alerts.length})
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<OrderIcon />}
                  onClick={() => {/* TODO: Implementar generación de pedidos automática */}}
                  disabled={criticalAlerts.length === 0}
                >
                  Generar Pedidos Urgentes
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StockAlertCard;