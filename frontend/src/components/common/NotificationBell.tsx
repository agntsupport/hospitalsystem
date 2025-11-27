// ABOUTME: Componente de campanita de notificaciones para el header.
// ABOUTME: Muestra badge con conteo de notificaciones no leídas y dropdown con lista de notificaciones recientes.

import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import notificacionesService, {
  Notificacion,
  TipoNotificacion
} from '@/services/notificacionesService';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  // Cargar notificaciones
  const loadNotificaciones = useCallback(async () => {
    try {
      setLoading(true);
      const [countResponse, recientes] = await Promise.all([
        notificacionesService.getNotificacionesNoLeidasCount(),
        notificacionesService.getNotificacionesRecientes()
      ]);
      setUnreadCount(countResponse.count);
      setNotificaciones(recientes);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling de notificaciones cada 30 segundos
  useEffect(() => {
    loadNotificaciones();

    const intervalId = setInterval(() => {
      loadNotificaciones();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadNotificaciones]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotificaciones(); // Recargar al abrir
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notificacion: Notificacion) => {
    try {
      // Marcar como leída si no lo está
      if (!notificacion.leida) {
        await notificacionesService.marcarComoLeida(notificacion.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      handleClose();

      // Navegar al módulo de solicitudes
      navigate('/solicitudes');
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setUnreadCount(0);
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/solicitudes');
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (tipo: TipoNotificacion) => {
    const iconMap: Record<string, React.ReactNode> = {
      NUEVA_SOLICITUD: <InventoryIcon sx={{ color: '#2196f3' }} />,
      SOLICITUD_ASIGNADA: <AssignmentIcon sx={{ color: '#ff9800' }} />,
      PRODUCTOS_LISTOS: <CheckCircleIcon sx={{ color: '#4caf50' }} />,
      ENTREGA_CONFIRMADA: <LocalShippingIcon sx={{ color: '#8bc34a' }} />,
      SOLICITUD_CANCELADA: <CancelIcon sx={{ color: '#f44336' }} />,
      PRODUCTOS_APLICADOS: <VerifiedIcon sx={{ color: '#9c27b0' }} />,
    };
    return iconMap[tipo] || <NotificationsIcon />;
  };

  return (
    <>
      <Tooltip title={unreadCount > 0 ? `${unreadCount} notificaciones nuevas` : 'Notificaciones'}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label={`${unreadCount} notificaciones no leídas`}
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 380,
            maxHeight: 480,
            overflow: 'auto',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              sx={{ textTransform: 'none' }}
            >
              Marcar todas leídas
            </Button>
          )}
        </Box>

        <Divider />

        {/* Lista de notificaciones */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notificaciones.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          notificaciones.map((notificacion) => (
            <MenuItem
              key={notificacion.id}
              onClick={() => handleNotificationClick(notificacion)}
              sx={{
                py: 1.5,
                px: 2,
                alignItems: 'flex-start',
                backgroundColor: notificacion.leida ? 'inherit' : 'action.hover',
                borderLeft: notificacion.leida ? 'none' : '3px solid',
                borderColor: notificacionesService.getTipoColor(notificacion.tipo),
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <ListItemIcon sx={{ mt: 0.5, minWidth: 40 }}>
                {getNotificationIcon(notificacion.tipo)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: notificacion.leida ? 400 : 600 }}>
                      {notificacionesService.getTipoLabel(notificacion.tipo)}
                    </Typography>
                    {!notificacion.leida && (
                      <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 0.5,
                      }}
                    >
                      {notificacion.mensaje}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={notificacion.solicitud?.numero || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.disabled">
                        {notificacionesService.formatearTiempoRelativo(notificacion.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}

        <Divider />

        {/* Footer */}
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="text"
            onClick={handleViewAll}
            sx={{ textTransform: 'none' }}
          >
            Ver todas las solicitudes
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
