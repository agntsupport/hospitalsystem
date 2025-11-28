// ABOUTME: Página de gestión de Usuarios del sistema
// ABOUTME: CRUD de usuarios con roles, permisos y auditoría

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  SelectChangeEvent,
  Stack,
  Divider,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  VpnKey as KeyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';
import { FullPageLoader } from '@/components/common/LoadingState';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import usersService, { User, UserStats } from '../../services/usersService';
import UserFormDialog from './UserFormDialog';
import PasswordResetDialog from './PasswordResetDialog';
import RoleHistoryDialog from './RoleHistoryDialog';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  
  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Diálogos
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Menu de acciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);
  
  // Notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Verificar permisos
  useEffect(() => {
    if (currentUser?.rol !== 'administrador') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, rowsPerPage, searchTerm, filterRol, filterActivo]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getUsers({
        search: searchTerm,
        rol: filterRol || undefined,
        activo: filterActivo ? filterActivo === 'true' : undefined,
        page: page + 1,
        limit: rowsPerPage
      });
      
      setUsers(response.data);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showNotification('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await usersService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenFormDialog(true);
    handleCloseMenu();
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setOpenPasswordDialog(true);
    handleCloseMenu();
  };

  const handleViewHistory = (user: User) => {
    setSelectedUser(user);
    setOpenHistoryDialog(true);
    handleCloseMenu();
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.activo) {
        await usersService.deleteUser(user.id);
        showNotification('Usuario desactivado exitosamente', 'success');
      } else {
        await usersService.reactivateUser(user.id);
        showNotification('Usuario reactivado exitosamente', 'success');
      }
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error cambiando estado del usuario:', error);
      showNotification('Error al cambiar estado del usuario', 'error');
    }
    handleCloseMenu();
  };

  const handleFormSubmit = async () => {
    setOpenFormDialog(false);
    setSelectedUser(null);
    await loadUsers();
    await loadStats();
    showNotification(
      selectedUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
      'success'
    );
  };

  const handlePasswordReset = async () => {
    setOpenPasswordDialog(false);
    setSelectedUser(null);
    showNotification('Contraseña reseteada exitosamente', 'success');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const getRolColor = (rol: string) => {
    const colors: Record<string, string> = {
      administrador: '#d32f2f',
      medico_especialista: '#1976d2',
      medico_residente: '#2196f3',
      enfermero: '#9c27b0',
      cajero: '#ff9800',
      almacenista: '#4caf50',
      socio: '#795548'
    };
    return colors[rol] || '#757575';
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      administrador: 'Administrador',
      medico_especialista: 'Médico Especialista',
      medico_residente: 'Médico Residente',
      enfermero: 'Enfermero',
      cajero: 'Cajero',
      almacenista: 'Almacenista',
      socio: 'Socio'
    };
    return labels[rol] || rol;
  };

  return (
    <Container maxWidth="xl">
      {/* Header unificado */}
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios del sistema, sus roles y permisos"
        icon={<GroupIcon />}
        iconColor="primary"
      />

      {/* Estadísticas con StatCard unificado */}
      <StatCardsGrid sx={{ mb: 3 }}>
        <StatCard
          title="Total Usuarios"
          value={stats?.totalUsuarios || 0}
          icon={<GroupIcon />}
          color="primary"
          loading={!stats}
        />
        <StatCard
          title="Usuarios Activos"
          value={stats?.usuariosActivos || 0}
          icon={<ActiveIcon />}
          color="success"
          loading={!stats}
        />
        <StatCard
          title="Usuarios Inactivos"
          value={stats?.usuariosInactivos || 0}
          icon={<InactiveIcon />}
          color="error"
          loading={!stats}
        />
        <StatCard
          title="Nuevos (30 días)"
          value={stats?.usuariosCreados30Dias || 0}
          icon={<TrendingIcon />}
          color="info"
          loading={!stats}
        />
      </StatCardsGrid>

      {/* Filtros y acciones */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filterRol}
                label="Rol"
                onChange={(e: SelectChangeEvent) => setFilterRol(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="administrador">Administrador</MenuItem>
                <MenuItem value="medico_especialista">Médico Especialista</MenuItem>
                <MenuItem value="medico_residente">Médico Residente</MenuItem>
                <MenuItem value="enfermero">Enfermero</MenuItem>
                <MenuItem value="cajero">Cajero</MenuItem>
                <MenuItem value="almacenista">Almacenista</MenuItem>
                <MenuItem value="socio">Socio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterActivo}
                label="Estado"
                onChange={(e: SelectChangeEvent) => setFilterActivo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setSelectedUser(null);
                  setOpenFormDialog(true);
                }}
                fullWidth
              >
                Nuevo Usuario
              </Button>
              <IconButton onClick={loadUsers} color="primary">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de usuarios */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Último Acceso</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron usuarios
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.nombre || user.apellidos ? (
                        `${user.nombre || ''} ${user.apellidos || ''}`.trim()
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin nombre
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.email || (
                        <Typography variant="body2" color="text.secondary">
                          Sin email
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRolLabel(user.rol)}
                        size="small"
                        sx={{
                          backgroundColor: getRolColor(user.rol),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={user.activo ? <ActiveIcon /> : <InactiveIcon />}
                        label={user.activo ? 'Activo' : 'Inactivo'}
                        color={user.activo ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {user.ultimoAcceso ? (
                        new Date(user.ultimoAcceso).toLocaleString('es-MX')
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nunca
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => menuUser && handleEditUser(menuUser)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => menuUser && handleResetPassword(menuUser)}>
          <KeyIcon fontSize="small" sx={{ mr: 1 }} />
          Resetear Contraseña
        </MenuItem>
        <MenuItem onClick={() => menuUser && handleViewHistory(menuUser)}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
          Ver Historial
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => menuUser && handleToggleUserStatus(menuUser)}
          sx={{ color: menuUser?.activo ? 'error.main' : 'success.main' }}
        >
          <BlockIcon fontSize="small" sx={{ mr: 1 }} />
          {menuUser?.activo ? 'Desactivar' : 'Reactivar'}
        </MenuItem>
      </Menu>

      {/* Diálogos */}
      <UserFormDialog
        open={openFormDialog}
        onClose={() => {
          setOpenFormDialog(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
      />

      <PasswordResetDialog
        open={openPasswordDialog}
        onClose={() => {
          setOpenPasswordDialog(false);
          setSelectedUser(null);
        }}
        onSubmit={handlePasswordReset}
        user={selectedUser}
      />

      <RoleHistoryDialog
        open={openHistoryDialog}
        onClose={() => {
          setOpenHistoryDialog(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UsersPage;