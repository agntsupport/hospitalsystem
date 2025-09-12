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
  Pagination,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MedicalServices as ServiceIcon,
  LocalHospital as HospitalIcon,
  Healing as HealingIcon,
  Warning as EmergencyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDebounce } from '@/hooks/useDebounce';
import { inventoryService } from '@/services/inventoryService';
import { Service, ServiceFilters, TipoServicio } from '@/types/inventory.types';
import ServiceFormDialog from './ServiceFormDialog';

interface ServicesTabProps {
  onOpenFormDialog?: (service?: Service) => void;
}

const SERVICE_TYPE_LABELS = {
  [TipoServicio.CONSULTA_GENERAL]: 'Consulta General',
  [TipoServicio.CONSULTA_ESPECIALIDAD]: 'Consulta Especialidad',
  [TipoServicio.URGENCIA]: 'Urgencia',
  [TipoServicio.CURACION]: 'Curación',
  [TipoServicio.HOSPITALIZACION]: 'Hospitalización',
};

const SERVICE_TYPE_ICONS = {
  [TipoServicio.CONSULTA_GENERAL]: <HospitalIcon fontSize="small" />,
  [TipoServicio.CONSULTA_ESPECIALIDAD]: <ServiceIcon fontSize="small" />,
  [TipoServicio.URGENCIA]: <EmergencyIcon fontSize="small" />,
  [TipoServicio.CURACION]: <HealingIcon fontSize="small" />,
  [TipoServicio.HOSPITALIZACION]: <HospitalIcon fontSize="small" />,
};

const SERVICE_TYPE_COLORS = {
  [TipoServicio.CONSULTA_GENERAL]: 'primary',
  [TipoServicio.CONSULTA_ESPECIALIDAD]: 'secondary',
  [TipoServicio.URGENCIA]: 'error',
  [TipoServicio.CURACION]: 'warning',
  [TipoServicio.HOSPITALIZACION]: 'info',
} as const;

const ServicesTab: React.FC<ServicesTabProps> = ({ onOpenFormDialog }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  
  // Estados para el diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchServices();
  }, [page, debouncedSearchTerm, selectedType, activeFilter]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const filters: ServiceFilters = {
        search: debouncedSearchTerm,
        tipo: selectedType as TipoServicio | 'all',
        activo: activeFilter as 'all' | 'true' | 'false',
      };

      const response = await inventoryService.getServices(filters);
      
      if (response.success) {
        setServices(response.data.servicios);
        setTotalPages(response.data.pagination.totalPages);
        setTotalServices(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const hasRelations = 
      (service._count?.transacciones || 0) > 0 ||
      (service._count?.itemsVentaRapida || 0) > 0 ||
      (service._count?.detallesFactura || 0) > 0;

    const confirmMessage = hasRelations
      ? `¿Desea desactivar el servicio "${service.nombre}"? Este servicio tiene historial asociado y solo será marcado como inactivo.`
      : `¿Está seguro de eliminar el servicio "${service.nombre}"? Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await inventoryService.deleteService(service.id);
      if (response.success) {
        toast.success(response.message || 'Servicio procesado correctamente');
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al procesar el servicio');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleOpenDialog = (service?: Service) => {
    if (onOpenFormDialog) {
      onOpenFormDialog(service);
    } else {
      setEditingService(service || null);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleSuccess = () => {
    fetchServices(); // Refrescar la lista después de crear/editar
    handleCloseDialog();
  };

  return (
    <Box>
      {/* Header con estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Servicios
              </Typography>
              <Typography variant="h4">
                {totalServices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Servicios Activos
              </Typography>
              <Typography variant="h4" color="success.main">
                {services.filter(s => s.activo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Consultas
              </Typography>
              <Typography variant="h4" color="primary">
                {services.filter(s => s.tipo === TipoServicio.CONSULTA_GENERAL || s.tipo === TipoServicio.CONSULTA_ESPECIALIDAD).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Urgencias
              </Typography>
              <Typography variant="h4" color="error">
                {services.filter(s => s.tipo === TipoServicio.URGENCIA).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por código, nombre o descripción..."
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
                <InputLabel>Tipo de Servicio</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Tipo de Servicio"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nuevo Servicio
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de servicios */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : services.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No se encontraron servicios con los filtros aplicados
          </Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="center">Uso</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {service.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {SERVICE_TYPE_ICONS[service.tipo]}
                      <Typography>{service.nombre}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {service.descripcion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={SERVICE_TYPE_LABELS[service.tipo]}
                      size="small"
                      color={SERVICE_TYPE_COLORS[service.tipo]}
                      icon={SERVICE_TYPE_ICONS[service.tipo]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary">
                      {formatCurrency(service.precio)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="caption" display="block">
                        {service._count?.transacciones || 0} transacciones
                      </Typography>
                      <Typography variant="caption" display="block">
                        {service._count?.itemsVentaRapida || 0} ventas
                      </Typography>
                      <Typography variant="caption" display="block">
                        {service._count?.detallesFactura || 0} facturas
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={service.activo ? 'Activo' : 'Inactivo'}
                      color={service.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(service)}
                      title="Editar"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(service)}
                      title={
                        (service._count?.transacciones || 0) > 0 ||
                        (service._count?.itemsVentaRapida || 0) > 0 ||
                        (service._count?.detallesFactura || 0) > 0
                          ? 'Desactivar'
                          : 'Eliminar'
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Diálogo de formulario */}
      {!onOpenFormDialog && (
        <ServiceFormDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          service={editingService}
          onSuccess={handleSuccess}
        />
      )}
    </Box>
  );
};

export default ServicesTab;