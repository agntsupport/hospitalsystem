import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
  People,
  LocalHospital,
  Inventory,
  PointOfSale,
  Assessment,
  Hotel,
  Work,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { RootState } from '@/store/store';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Skip Links for WCAG 2.1 AA accessibility */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '1rem',
          backgroundColor: '#1976d2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0 0 4px 0',
          fontWeight: 600,
          '&:focus': {
            left: 0,
            top: 0,
            outline: '3px solid #ff9800',
            outlineOffset: '2px',
          },
        }}
      >
        Saltar al contenido principal
      </Box>
      <Box
        component="a"
        href="#navigation"
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '3rem',
          zIndex: 9999,
          padding: '1rem',
          backgroundColor: '#1976d2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0 0 4px 0',
          fontWeight: 600,
          '&:focus': {
            left: 0,
            top: '3rem',
            outline: '3px solid #ff9800',
            outlineOffset: '2px',
          },
        }}
      >
        Saltar a la navegación
      </Box>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleToggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <LocalHospital sx={{ mr: 2 }} />
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema Hospitalario
          </Typography>

          {/* Campanita de Notificaciones */}
          <NotificationBell />

          {/* Usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu del Usuario */}
      <Menu
        anchorEl={anchorEl}
        id="primary-search-account-menu"
        keepMounted
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
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
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mi Perfil</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <Box
        component="main"
        id="main-content"
        role="main"
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
        }}
      >
        <Toolbar /> {/* Espaciado para el AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;