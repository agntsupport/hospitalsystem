import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
  TablePagination,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  CreditCard as CreditIcon
} from '@mui/icons-material';

import { inventoryService } from '@/services/inventoryService';
import { Supplier, SupplierFilters, PAYMENT_TERMS } from '@/types/inventory.types';
import { toast } from 'react-toastify';

interface SuppliersTabProps {
  onDataChange: () => void;
  onEditSupplier: (supplier: Supplier) => void;
}

const SuppliersTab: React.FC<SuppliersTabProps> = ({ onDataChange, onEditSupplier }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadSuppliers();
  }, [filters, page, rowsPerPage]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await inventoryService.getSuppliers({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success) {
        setSuppliers(response.data?.items || []);
        setTotalCount(response.data?.pagination?.total || 0);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      const errorMessage = error?.message || 'Error al cargar proveedores';
      setError(errorMessage);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof SupplierFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
    setPage(0); // Reset page when filters change
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    if (!deleteReason.trim()) {
      toast.error('Debe especificar un motivo para la eliminación');
      return;
    }

    try {
      const response = await inventoryService.deleteSupplier(selectedSupplier.id, deleteReason.trim());
      if (response.success) {
        toast.success('Proveedor eliminado exitosamente');
        loadSuppliers();
        onDataChange();
        handleCloseDeleteDialog();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      const errorMessage = error?.message || 'Error al eliminar proveedor';
      toast.error(errorMessage);
    }
  };

  const handleOpenViewDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleOpenEditDialog = (supplier: Supplier) => {
    onEditSupplier(supplier);
  };


  const handleOpenDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedSupplier(null);
    setDeleteReason('');
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          Gestión de Proveedores
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'inherit'}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSuppliers}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar proveedor"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ciudad"
                  value={filters.ciudad || ''}
                  onChange={(e) => handleFilterChange('ciudad', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Estado"
                  value={filters.estado || ''}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.activo !== undefined ? String(filters.activo) : ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('activo', e.target.value === '' ? undefined : e.target.value === 'true')}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="true">Activos</MenuItem>
                    <MenuItem value="false">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Limpiar Filtros
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de Proveedores */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Proveedor</TableCell>
              <TableCell>RFC</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Crédito</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !suppliers || suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron proveedores
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (suppliers || []).map((supplier) => (
                <TableRow key={supplier.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}
                        >
                          {supplier.razonSocial}
                        </Typography>
                        {supplier.nombreComercial && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px'
                            }}
                          >
                            {supplier.nombreComercial}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {supplier.codigo}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {supplier.rfc}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {supplier.telefono && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '180px'
                          }}
                        >
                          <PhoneIcon fontSize="small" />
                          {supplier.telefono}
                        </Typography>
                      )}
                      {supplier.email && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}
                        >
                          <EmailIcon fontSize="small" />
                          {supplier.email}
                        </Typography>
                      )}
                      {supplier.contacto && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Contacto: {supplier.contacto.nombre}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {supplier.ciudad || 'No especificada'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {supplier.estado || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CreditIcon fontSize="small" />
                        {supplier.condicionesPago || 'Contado'}
                      </Typography>
                      {supplier.diasCredito && supplier.diasCredito > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {supplier.diasCredito} días
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.activo ? 'Activo' : 'Inactivo'}
                      color={supplier.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenViewDialog(supplier)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar proveedor">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(supplier)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar proveedor">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(supplier)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Ver Proveedor Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Proveedor
        </DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Razón Social</Typography>
                  <Typography variant="body1">{selectedSupplier.razonSocial}</Typography>
                </Grid>
                {selectedSupplier.nombreComercial && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nombre Comercial</Typography>
                    <Typography variant="body1">{selectedSupplier.nombreComercial}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">RFC</Typography>
                  <Typography variant="body1" fontFamily="monospace">{selectedSupplier.rfc}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Código</Typography>
                  <Typography variant="body1">{selectedSupplier.codigo}</Typography>
                </Grid>
                {selectedSupplier.telefono && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body1">{selectedSupplier.telefono}</Typography>
                  </Grid>
                )}
                {selectedSupplier.email && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedSupplier.email}</Typography>
                  </Grid>
                )}
                {selectedSupplier.direccion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Dirección</Typography>
                    <Typography variant="body1">{selectedSupplier.direccion}</Typography>
                    {(selectedSupplier.ciudad || selectedSupplier.estado) && (
                      <Typography variant="body2" color="text.secondary">
                        {[selectedSupplier.ciudad, selectedSupplier.estado, selectedSupplier.codigoPostal].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                  </Grid>
                )}
                {selectedSupplier.contacto && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Contacto</Typography>
                    <Typography variant="body1">
                      {selectedSupplier.contacto.nombre}
                      {selectedSupplier.contacto.cargo && ` (${selectedSupplier.contacto.cargo})`}
                    </Typography>
                    {selectedSupplier.contacto.telefono && (
                      <Typography variant="body2" color="text.secondary">
                        Tel: {selectedSupplier.contacto.telefono}
                      </Typography>
                    )}
                    {selectedSupplier.contacto.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {selectedSupplier.contacto.email}
                      </Typography>
                    )}
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Condiciones de Pago</Typography>
                  <Typography variant="body1">{selectedSupplier.condicionesPago || 'Contado'}</Typography>
                  {selectedSupplier.diasCredito && selectedSupplier.diasCredito > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedSupplier.diasCredito} días de crédito
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                  <Chip
                    label={selectedSupplier.activo ? 'Activo' : 'Inactivo'}
                    color={selectedSupplier.activo ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Registro</Typography>
                  <Typography variant="body1">{formatDate(selectedSupplier.fechaRegistro)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Última Actualización</Typography>
                  <Typography variant="body1">{formatDate(selectedSupplier.fechaActualizacion)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          Eliminar Proveedor
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar al proveedor <strong>{selectedSupplier?.razonSocial}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Esta acción marcará al proveedor como inactivo.
          </Typography>
          
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="Motivo de la eliminación"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Ingrese el motivo por el cual elimina este proveedor..."
            helperText="Este campo es obligatorio para proceder con la eliminación"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSupplier}
            startIcon={<DeleteIcon />}
            disabled={!deleteReason.trim()}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default SuppliersTab;