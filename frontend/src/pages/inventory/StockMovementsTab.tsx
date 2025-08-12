import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Tooltip,
  Avatar,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  SwapHoriz as MovementsIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SalidaIcon,
  Warning as MermaIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  DateRange as DateIcon,
  Person as UserIcon,
  Receipt as DocumentIcon,
  History as HistoryIcon
} from '@mui/icons-material';
// Removed date-fns imports - using built-in formatting instead

import { inventoryService } from '@/services/inventoryService';
import { StockMovement, StockMovementFilters, MOVEMENT_TYPES } from '@/types/inventory.types';
import AuditTrail from '@/components/common/AuditTrail';

interface StockMovementsTabProps {
  onDataChange: () => void;
}

const StockMovementsTab: React.FC<StockMovementsTabProps> = ({ onDataChange }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<StockMovementFilters>({
    tipo: undefined,
    fechaInicio: undefined,
    fechaFin: undefined,
    productoId: undefined,
    usuarioId: undefined
  });

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await inventoryService.getStockMovements({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success && response.data) {
        setMovements(response.data.items || []);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setMovements([]);
        setTotal(0);
      }
    } catch (err) {
      setError('Error al cargar movimientos de stock');
      console.error('Error loading movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      tipoMovimiento: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      productoId: undefined,
      usuarioId: undefined
    });
    setPage(0);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <EntradaIcon color="success" />;
      case 'salida':
        return <SalidaIcon color="error" />;
      case 'merma':
        return <MermaIcon color="warning" />;
      default:
        return <MovementsIcon />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'success';
      case 'salida':
        return 'error';
      case 'merma':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MovementsIcon color="primary" />
          Movimientos de Stock
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadMovements}
            disabled={loading}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    value={filters.tipo || ''}
                    label="Tipo de Movimiento"
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value as any || undefined })}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="entrada">Entrada</MenuItem>
                    <MenuItem value="salida">Salida</MenuItem>
                    <MenuItem value="merma">Merma</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Usuario ID"
                  type="number"
                  value={filters.usuarioId || ''}
                  onChange={(e) => setFilters({ ...filters, usuarioId: e.target.value ? parseInt(e.target.value) : undefined })}
                  InputProps={{
                    startAdornment: <UserIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Inicio"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Fin"
                  value={filters.fechaFin || ''}
                  onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                  >
                    Limpiar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Movimientos */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha/Hora</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell align="right">Costo</TableCell>
              <TableCell align="center">Trazabilidad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  Cargando movimientos...
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  No se encontraron movimientos
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DateIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDateTime(movement.fecha)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getMovementIcon(movement.tipo)}
                      label={MOVEMENT_TYPES[movement.tipo as keyof typeof MOVEMENT_TYPES]}
                      color={getMovementColor(movement.tipo) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {movement.producto.nombre.charAt(0)}
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
                          {movement.producto.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {movement.producto.codigo}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color={movement.tipo === 'entrada' ? 'success.main' : 'error.main'}
                    >
                      {movement.tipo === 'entrada' ? '+' : '-'}{movement.cantidad}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '300px'
                      }}
                    >
                      {movement.motivo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <UserIcon fontSize="small" color="action" />
                      <Typography 
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '120px'
                        }}
                      >
                        {movement.usuario?.username || 'Usuario'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {movement.observaciones && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DocumentIcon fontSize="small" color="action" />
                        <Typography 
                          variant="caption"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '120px'
                          }}
                        >
                          {movement.observaciones}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(movement.costo || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver historial de cambios">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedMovementId(movement.id);
                          setAuditDialogOpen(true);
                        }}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white'
                          }
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Dialog de Auditoría */}
      <AuditTrail
        open={auditDialogOpen}
        onClose={() => {
          setAuditDialogOpen(false);
          setSelectedMovementId(null);
        }}
        entityType="movimiento"
        entityId={selectedMovementId || 0}
        title="Historial del Movimiento de Inventario"
      />
    </Box>
  );
};

export default StockMovementsTab;