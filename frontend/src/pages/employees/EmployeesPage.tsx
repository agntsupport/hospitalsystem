// ABOUTME: Página de gestión de Empleados del sistema hospitalario
// ABOUTME: CRUD completo con filtros, estadísticas y auditoría

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Grid,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  LocalHospital as MedicIcon,
  School as ResidentIcon,
  MedicalServices as NurseIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';
import { FullPageLoader } from '@/components/common/LoadingState';
import { useDebounce } from '@/hooks/useDebounce';
import { employeeService } from '@/services/employeeService';
import { Employee, EmployeeStats, EmployeeType } from '@/types/employee.types';
import { EMPLOYEE_TYPE_LABELS } from '@/utils/constants';
import EmployeeFormDialog from './EmployeeFormDialog';
import AuditTrail from '@/components/common/AuditTrail';
import { toast } from 'react-toastify';

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [tipoEmpleado, setTipoEmpleado] = useState<EmployeeType | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Dialogs
  const [viewEmployeeId, setViewEmployeeId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployeeOpen, setDeleteEmployeeOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [auditEntityId, setAuditEntityId] = useState<number>(0);
  
  const debouncedSearch = useDebounce(search, 500);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
  }, []);

  // Cargar empleados cuando cambien los filtros
  useEffect(() => {
    loadEmployees();
  }, [debouncedSearch, tipoEmpleado, page]);

  const loadStats = async () => {
    try {
      const response = await employeeService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading employee stats:', error);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await employeeService.getEmployees({
        page,
        limit: 20,
        search: debouncedSearch,
        tipoEmpleado: tipoEmpleado || undefined,
      });
      
      if (response.success) {
        setEmployees(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotal(response.pagination?.total || 0);
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = async (id: number) => {
    try {
      const response = await employeeService.getEmployeeById(id);
      if (response.success && response.data) {
        setSelectedEmployee(response.data);
        setViewEmployeeId(id);
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar empleado');
    }
  };

  const handleCreateEmployee = () => {
    setCreateEmployeeOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditEmployeeOpen(true);
  };

  const handleEmployeeCreated = () => {
    loadEmployees();
    loadStats();
    setCreateEmployeeOpen(false);
    setEditEmployeeOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteEmployeeOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      const response = await employeeService.deleteEmployee(employeeToDelete.id);
      if (response.success) {
        toast.success(`Empleado ${employeeToDelete.nombre} ${employeeToDelete.apellidoPaterno} eliminado exitosamente`);
        // Recargar la lista y estadísticas
        loadEmployees();
        loadStats();
        // Cerrar diálogo
        setDeleteEmployeeOpen(false);
        setEmployeeToDelete(null);
      } else {
        toast.error(response.message || 'Error al eliminar empleado');
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      const errorMessage = error?.message || error?.error || 'Error al eliminar empleado';
      toast.error(errorMessage);
    }
  };

  const handleActivateEmployee = async (employee: Employee) => {
    try {
      const response = await employeeService.activateEmployee(employee.id);
      if (response.success) {
        toast.success(`Empleado ${employee.nombre} ${employee.apellidoPaterno} reactivado exitosamente`);
        // Recargar la lista y estadísticas
        loadEmployees();
        loadStats();
      } else {
        toast.error(response.message || 'Error al reactivar empleado');
      }
    } catch (error: any) {
      console.error('Error activating employee:', error);
      const errorMessage = error?.message || error?.error || 'Error al reactivar empleado';
      toast.error(errorMessage);
    }
  };

  const handleCloseDialogs = () => {
    setCreateEmployeeOpen(false);
    setEditEmployeeOpen(false);
    setEditingEmployee(null);
    setViewEmployeeId(null);
    setSelectedEmployee(null);
    setDeleteEmployeeOpen(false);
    setEmployeeToDelete(null);
  };

  const handleOpenAuditTrail = (employee: Employee) => {
    setAuditEntityId(employee.id);
    setAuditTrailOpen(true);
  };

  const handleCloseAuditTrail = () => {
    setAuditTrailOpen(false);
    setAuditEntityId(0);
  };

  const getEmployeeTypeColor = (tipo: EmployeeType) => {
    switch (tipo) {
      case 'medico_especialista':
        return 'primary';
      case 'medico_residente':
        return 'secondary';
      case 'enfermero':
        return 'success';
      default:
        return 'default';
    }
  };

  const getEmployeeTypeIcon = (tipo: EmployeeType) => {
    switch (tipo) {
      case 'medico_especialista':
        return <MedicIcon fontSize="small" />;
      case 'medico_residente':
        return <ResidentIcon fontSize="small" />;
      case 'enfermero':
        return <NurseIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const formatSalary = (salario?: number) => {
    if (!salario) return 'No especificado';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(salario);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Gestión de Empleados"
        subtitle="Administra el personal médico y administrativo del hospital"
        icon={<GroupIcon />}
        iconColor="primary"
        actions={[
          {
            label: 'Nuevo Empleado',
            icon: <AddIcon />,
            onClick: handleCreateEmployee,
            variant: 'contained',
          }
        ]}
      />

      {/* Estadísticas con StatCard unificado */}
      <StatCardsGrid sx={{ mb: 3 }}>
        <StatCard
          title="Total Empleados"
          value={stats?.totalEmpleados || 0}
          icon={<PersonAddIcon />}
          color="primary"
          loading={!stats}
        />
        <StatCard
          title="Especialistas"
          value={stats?.empleadosPorTipo?.medico_especialista || 0}
          icon={<MedicIcon />}
          color="primary"
          loading={!stats}
        />
        <StatCard
          title="Residentes"
          value={stats?.empleadosPorTipo?.medico_residente || 0}
          icon={<ResidentIcon />}
          color="secondary"
          loading={!stats}
        />
        <StatCard
          title="Enfermeros"
          value={stats?.empleadosPorTipo?.enfermero || 0}
          icon={<NurseIcon />}
          color="success"
          loading={!stats}
        />
        <StatCard
          title="Activos"
          value={stats?.empleadosActivos || 0}
          icon={<CheckCircleIcon />}
          color="success"
          loading={!stats}
        />
      </StatCardsGrid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Empleado</InputLabel>
                <Select
                  value={tipoEmpleado}
                  label="Tipo de Empleado"
                  onChange={(e) => setTipoEmpleado(e.target.value as EmployeeType | '')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="medico_especialista">Médico Especialista</MenuItem>
                  <MenuItem value="medico_residente">Médico Residente</MenuItem>
                  <MenuItem value="enfermero">Enfermero</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setTipoEmpleado('');
                  setPage(1);
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla de empleados */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Empleados ({total})
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre Completo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Cédula</TableCell>
                      <TableCell>Especialidad</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Salario</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(employees || []).map((employee) => (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.telefono}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={EMPLOYEE_TYPE_LABELS[employee.tipoEmpleado]}
                            color={getEmployeeTypeColor(employee.tipoEmpleado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{employee.cedulaProfesional}</TableCell>
                        <TableCell>{employee.especialidad || '-'}</TableCell>
                        <TableCell>{employee.email || '-'}</TableCell>
                        <TableCell>{formatSalary(employee.salario)}</TableCell>
                        <TableCell>
                          <Chip
                            label={employee.activo ? 'Activo' : 'Inactivo'}
                            color={employee.activo ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleViewEmployee(employee.id)}
                            title="Ver detalles"
                          >
                            <ViewIcon />
                          </IconButton>
                          {employee.activo ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditEmployee(employee)}
                                title="Editar"
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteEmployee(employee)}
                                title="Eliminar"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => handleActivateEmployee(employee)}
                              title="Reactivar empleado"
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAuditTrail(employee)}
                            title="Historial de cambios"
                            color="info"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de ver empleado */}
      <Dialog
        open={!!viewEmployeeId}
        onClose={() => {
          setViewEmployeeId(null);
          setSelectedEmployee(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalles del Empleado
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedEmployee.nombre} {selectedEmployee.apellidoPaterno} {selectedEmployee.apellidoMaterno}
                  </Typography>
                  <Chip
                    label={EMPLOYEE_TYPE_LABELS[selectedEmployee.tipoEmpleado]}
                    color={getEmployeeTypeColor(selectedEmployee.tipoEmpleado)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cédula Profesional
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.cedulaProfesional}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Especialidad
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.especialidad || 'No especificada'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.email || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Teléfono
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.telefono || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Salario
                  </Typography>
                  <Typography variant="body1">
                    {formatSalary(selectedEmployee.salario)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fecha de Ingreso
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedEmployee.fechaIngreso).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado
                  </Typography>
                  <Chip
                    label={selectedEmployee.activo ? 'Activo' : 'Inactivo'}
                    color={selectedEmployee.activo ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewEmployeeId(null);
            setSelectedEmployee(null);
          }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de crear empleado */}
      <EmployeeFormDialog
        open={createEmployeeOpen}
        onClose={handleCloseDialogs}
        onEmployeeCreated={handleEmployeeCreated}
      />

      {/* Dialog de editar empleado */}
      <EmployeeFormDialog
        open={editEmployeeOpen}
        onClose={handleCloseDialogs}
        onEmployeeCreated={handleEmployeeCreated}
        editingEmployee={editingEmployee}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteEmployeeOpen}
        onClose={() => setDeleteEmployeeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DeleteIcon color="error" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {employeeToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Está seguro de que desea eliminar al siguiente empleado?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {employeeToDelete.nombre} {employeeToDelete.apellidoPaterno} {employeeToDelete.apellidoMaterno}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {EMPLOYEE_TYPE_LABELS[employeeToDelete.tipoEmpleado]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cédula: {employeeToDelete.cedulaProfesional}
                </Typography>
              </Box>
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                ⚠️ Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteEmployeeOpen(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteEmployee}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Trail Dialog */}
      <AuditTrail
        open={auditTrailOpen}
        onClose={handleCloseAuditTrail}
        entityType="empleado"
        entityId={auditEntityId}
        title="Historial de Cambios - Empleado"
      />
    </Box>
  );
};

export default EmployeesPage;