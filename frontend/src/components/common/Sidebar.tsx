import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  People,
  LocalHospital,
  Inventory,
  PointOfSale,
  Assessment,
  Hotel,
  Work,
  Person,
  MedicalServices,
  Receipt,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import { RootState } from '@/store/store';
import { ROLE_LABELS } from '@/utils/constants';

const drawerWidth = 280;

interface MenuItem {
  id: string;
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
  divider?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    id: 'patients',
    text: 'Pacientes',
    icon: <People />,
    path: '/patients',
    roles: ['cajero', 'enfermero', 'almacenista', 'medico_residente', 'medico_especialista', 'administrador'],
  },
  {
    id: 'employees',
    text: 'Empleados',
    icon: <Work />,
    path: '/employees',
    roles: ['administrador'],
  },
  {
    id: 'rooms',
    text: 'Habitaciones',
    icon: <Hotel />,
    path: '/rooms',
    roles: ['cajero', 'enfermero', 'almacenista', 'medico_residente', 'medico_especialista', 'administrador'],
    divider: true,
  },
  {
    id: 'pos',
    text: 'Punto de Venta',
    icon: <PointOfSale />,
    path: '/pos',
    roles: ['cajero', 'administrador'],
  },
  {
    id: 'inventory',
    text: 'Inventario',
    icon: <Inventory />,
    path: '/inventory',
    roles: ['almacenista', 'administrador'],
  },
  {
    id: 'billing',
    text: 'Facturación',
    icon: <Receipt />,
    path: '/billing',
    roles: ['cajero', 'administrador', 'socio'],
  },
  {
    id: 'reports',
    text: 'Reportes',
    icon: <Assessment />,
    path: '/reports',
    roles: ['administrador', 'socio', 'almacenista'],
    divider: true,
  },
  {
    id: 'hospitalization',
    text: 'Hospitalización',
    icon: <LocalHospital />,
    path: '/hospitalization',
    roles: ['enfermero', 'medico_residente', 'medico_especialista', 'administrador'],
  },
];

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  const hasAccess = (item: MenuItem): boolean => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.rol);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography variant="h6" noWrap component="div" color="primary">
            Sistema Hospitalario
          </Typography>
          {user && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.username}
              </Typography>
              <Chip 
                label={ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS]} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </Toolbar>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => {
          if (!hasAccess(item)) return null;
          
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <React.Fragment key={item.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main + '14',
                      borderRight: `3px solid ${theme.palette.primary.main}`,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 3,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              {item.divider && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { md: sidebarOpen ? drawerWidth : 0 }, 
        flexShrink: { md: 0 } 
      }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen && isMobile}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={sidebarOpen && !isMobile}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;