import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Grid,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Calendar as CalendarIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import { posService } from '@/services/posService';
import { PatientAccount, Transaction } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';

interface HistoryTabProps {
  onRefresh?: () => void;
}

// Nueva interface para ventas rápidas
interface QuickSale {
  id: number;
  numeroVenta: string;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  cajero: {
    id: number;
    username: string;
  };
  fecha: string;
  observaciones?: string;
  items: Array<{
    tipo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

interface HistoryFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  pacienteNombre?: string;
  tipoAtencion?: string;
  montoMinimo?: number;
  montoMaximo?: number;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onRefresh }) => {
  // Estados para cuentas cerradas (funcionalidad original)
  const [closedAccounts, setClosedAccounts] = useState<PatientAccount[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PatientAccount | null>(null);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  
  // Estados para ventas rápidas (nueva funcionalidad)
  const [quickSales, setQuickSales] = useState<QuickSale[]>([]);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [selectedSale, setSelectedSale] = useState<QuickSale | null>(null);
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);
  
  // Estados compartidos
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyTab, setHistoryTab] = useState(0); // 0: Cuentas Cerradas, 1: Ventas Rápidas
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (historyTab === 0) {
      loadClosedAccounts();
    } else {
      loadQuickSales();
    }
  }, [page, filters, historyTab]);

  const loadClosedAccounts = async () => {
    setLoading(true);
    try {
      // Aquí llamaríamos a un endpoint específico para cuentas cerradas con filtros
      const response = await posService.getPatientAccounts({ 
        estado: 'cerrada',
        page: page,
        limit: ITEMS_PER_PAGE,
        ...filters
      });
      
      if (response.success) {
        setClosedAccounts(response.data.accounts || []);
        setTotalPages(Math.ceil((response.data.accounts?.length || 0) / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error loading closed accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickSales = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE
      };

      // Aplicar filtros
      if (filters.fechaInicio) {
        params.fechaInicio = filters.fechaInicio.toISOString().split('T')[0];
      }
      if (filters.fechaFin) {
        params.fechaFin = filters.fechaFin.toISOString().split('T')[0];
      }
      if (filters.pacienteNombre) {
        params.cajero = filters.pacienteNombre; // Reutilizar campo para cajero
      }
      if (filters.tipoAtencion) {
        params.metodoPago = filters.tipoAtencion; // Reutilizar para método de pago
      }

      const response = await posService.getSalesHistory(params);
      
      if (response.success) {
        setQuickSales(response.data.items || []);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error loading quick sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandAccount = async (accountId: number) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
      // Cargar transacciones detalladas si no las tenemos
    }
  };

  const handleViewDetails = async (account: PatientAccount) => {
    try {
      const response = await posService.getPatientAccountById(account.id);
      if (response.success) {
        setSelectedAccount(response.data.account);
        setAccountDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error loading account details:', error);
    }
  };

  const handleExpandSale = (saleId: number) => {
    if (expandedSale === saleId) {
      setExpandedSale(null);
    } else {
      setExpandedSale(saleId);
    }
  };

  const handleViewSaleDetails = (sale: QuickSale) => {
    setSelectedSale(sale);
    setSaleDetailsOpen(true);
  };

  const handleApplyFilters = () => {
    setPage(1);
    if (historyTab === 0) {
      loadClosedAccounts();
    } else {
      loadQuickSales();
    }
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const handleExportData = () => {
    if (historyTab === 0) {
      // Exportar cuentas cerradas
      const csvData = closedAccounts.map(account => ({
        'No. Cuenta': account.id,
        'Paciente': `${account.paciente?.nombre} ${account.paciente?.apellidoPaterno}`,
        'Tipo Atención': ATTENTION_TYPE_LABELS[account.tipoAtencion],
        'Fecha Apertura': new Date(account.fechaApertura).toLocaleDateString(),
        'Fecha Cierre': account.fechaCierre ? new Date(account.fechaCierre).toLocaleDateString() : '',
        'Total': account.totalCuenta,
        'Estado': account.estado.toUpperCase()
      }));
      console.log('Exportando cuentas cerradas:', csvData);
      alert(`Exportando ${csvData.length} cuentas cerradas`);
    } else {
      // Exportar ventas rápidas
      const csvData = quickSales.map(sale => ({
        'No. Venta': sale.numeroVenta,
        'Cajero': sale.cajero.username,
        'Fecha': formatDate(sale.fecha),
        'Método Pago': sale.metodoPago.toUpperCase(),
        'Total': sale.total,
        'Monto Recibido': sale.montoRecibido,
        'Cambio': sale.cambio,
        'Items': sale.items.map(item => `${item.nombre} (${item.cantidad})`).join('; '),
        'Observaciones': sale.observaciones || ''
      }));
      console.log('Exportando ventas rápidas:', csvData);
      alert(`Exportando ${csvData.length} ventas rápidas`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttentionTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'consulta_general': return 'primary';
      case 'urgencia': return 'error';
      case 'hospitalizacion': return 'warning';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        {/* Header con controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Historial de Transacciones POS
            </Typography>
            <Chip 
              label={historyTab === 0 ? `${closedAccounts.length} cuentas` : `${quickSales.length} ventas`}
              color="primary" 
              variant="outlined" 
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar">
              <IconButton onClick={historyTab === 0 ? loadClosedAccounts : loadQuickSales} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filtros">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar">
              <IconButton onClick={handleExportData} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Pestañas de Historial */}
        <Card sx={{ mb: 2 }}>
          <Tabs
            value={historyTab}
            onChange={(_, newValue) => {
              setHistoryTab(newValue);
              setPage(1);
              setExpandedAccount(null);
              setExpandedSale(null);
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<AccountIcon />} 
              label="Cuentas Cerradas" 
              iconPosition="start"
            />
            <Tab 
              icon={<MoneyIcon />} 
              label="Ventas Rápidas" 
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* Panel de filtros */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon fontSize="small" />
                Filtros de Búsqueda
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={filters.fechaInicio || null}
                    onChange={(date) => setFilters({ ...filters, fechaInicio: date || undefined })}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Fecha Fin"
                    value={filters.fechaFin || null}
                    onChange={(date) => setFilters({ ...filters, fechaFin: date || undefined })}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    label={historyTab === 0 ? "Nombre del Paciente" : "Cajero"}
                    value={filters.pacienteNombre || ''}
                    onChange={(e) => setFilters({ ...filters, pacienteNombre: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{historyTab === 0 ? "Tipo de Atención" : "Método de Pago"}</InputLabel>
                    <Select
                      value={filters.tipoAtencion || ''}
                      onChange={(e) => setFilters({ ...filters, tipoAtencion: e.target.value })}
                      label={historyTab === 0 ? "Tipo de Atención" : "Método de Pago"}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {historyTab === 0 ? (
                        <>
                          <MenuItem value="consulta_general">Consulta General</MenuItem>
                          <MenuItem value="urgencia">Urgencia</MenuItem>
                          <MenuItem value="hospitalizacion">Hospitalización</MenuItem>
                        </>
                      ) : (
                        <>
                          <MenuItem value="efectivo">Efectivo</MenuItem>
                          <MenuItem value="tarjeta">Tarjeta</MenuItem>
                          <MenuItem value="transferencia">Transferencia</MenuItem>
                        </>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    label="Monto Mínimo"
                    value={filters.montoMinimo || ''}
                    onChange={(e) => setFilters({ ...filters, montoMinimo: parseFloat(e.target.value) || undefined })}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    label="Monto Máximo"
                    value={filters.montoMaximo || ''}
                    onChange={(e) => setFilters({ ...filters, montoMaximo: parseFloat(e.target.value) || undefined })}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleClearFilters}
                  size="small"
                >
                  Limpiar
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleApplyFilters}
                  size="small"
                >
                  Aplicar Filtros
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Collapse>

        {/* Contenido según pestaña activa */}
        <Card>
          {historyTab === 0 ? (
            // Tabla de cuentas cerradas (funcionalidad original)
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cuenta #</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fecha Cierre</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Método Pago</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {closedAccounts.map((account) => (
                    <React.Fragment key={account.id}>
                    <TableRow 
                      hover 
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          #{account.id}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
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
                            {account.paciente ? 
                              `${account.paciente.nombre} ${account.paciente.apellidoPaterno} ${account.paciente.apellidoMaterno || ''}`.trim()
                              : 'Paciente no encontrado'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {account.paciente?.telefono || 'Sin teléfono'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={ATTENTION_TYPE_LABELS[account.tipoAtencion]}
                          color={getAttentionTypeColor(account.tipoAtencion) as any}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {account.fechaCierre ? formatDate(account.fechaCierre) : 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatCurrency(account.totalCuenta)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block'
                          }}
                        >
                          S: {formatCurrency(account.totalServicios)} | P: {formatCurrency(account.totalProductos)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Chip 
                          label="Efectivo" // Este campo debería venir del backend
                          color="success" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip 
                          label="CERRADA"
                          color="success" 
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small"
                              onClick={() => handleViewDetails(account)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={expandedAccount === account.id ? "Ocultar transacciones" : "Ver transacciones"}>
                            <IconButton 
                              size="small"
                              onClick={() => handleExpandAccount(account.id)}
                            >
                              {expandedAccount === account.id ? 
                                <CollapseIcon fontSize="small" /> : 
                                <ExpandIcon fontSize="small" />
                              }
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Imprimir recibo">
                            <IconButton size="small">
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Fila expandible con transacciones */}
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0 }}>
                        <Collapse in={expandedAccount === account.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Transacciones de la Cuenta #{account.id}
                            </Typography>
                            
                            {account.transacciones && account.transacciones.length > 0 ? (
                              <List dense>
                                {account.transacciones.map((transaction: any, idx: number) => (
                                  <ListItem key={idx} divider>
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Typography 
                                            variant="body2"
                                            sx={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              maxWidth: '300px'
                                            }}
                                          >
                                            {transaction.concepto}
                                          </Typography>
                                          <Typography variant="body2" fontWeight="medium">
                                            {formatCurrency(transaction.subtotal)}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {transaction.tipo.toUpperCase()} • {formatDate(transaction.fecha)}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No se encontraron transacciones para esta cuenta.
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            // Tabla de ventas rápidas (nueva funcionalidad)
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Venta #</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell>Método Pago</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quickSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <TableRow 
                        hover 
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.numeroVenta}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '150px'
                              }}
                            >
                              {sale.cajero.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {sale.cajero.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={sale.metodoPago.toUpperCase()}
                            color={sale.metodoPago === 'efectivo' ? 'success' : sale.metodoPago === 'tarjeta' ? 'primary' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sale.fecha)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatCurrency(sale.total)}
                          </Typography>
                          {sale.metodoPago === 'efectivo' && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              Recibido: {formatCurrency(sale.montoRecibido)} | Cambio: {formatCurrency(sale.cambio)}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2">
                            {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Ver detalles">
                              <IconButton 
                                size="small"
                                onClick={() => handleViewSaleDetails(sale)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title={expandedSale === sale.id ? "Ocultar items" : "Ver items"}>
                              <IconButton 
                                size="small"
                                onClick={() => handleExpandSale(sale.id)}
                              >
                                {expandedSale === sale.id ? 
                                  <CollapseIcon fontSize="small" /> : 
                                  <ExpandIcon fontSize="small" />
                                }
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Imprimir recibo">
                              <IconButton size="small">
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Fila expandible con items de la venta */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Collapse in={expandedSale === sale.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Items de la Venta {sale.numeroVenta}
                              </Typography>
                              
                              <List dense>
                                {sale.items.map((item, idx) => (
                                  <ListItem key={idx} divider>
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Typography 
                                            variant="body2"
                                            sx={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              maxWidth: '300px'
                                            }}
                                          >
                                            {item.nombre}
                                          </Typography>
                                          <Typography variant="body2" fontWeight="medium">
                                            {formatCurrency(item.subtotal)}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {item.tipo.toUpperCase()} • Cantidad: {item.cantidad} • Precio unitario: {formatCurrency(item.precioUnitario)}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              
                              {sale.observaciones && (
                                <Box sx={{ mt: 1, p: 1, backgroundColor: 'info.light', borderRadius: 1 }}>
                                  <Typography variant="caption" color="info.dark">
                                    <strong>Observaciones:</strong> {sale.observaciones}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {((historyTab === 0 && closedAccounts.length === 0) || (historyTab === 1 && quickSales.length === 0)) && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {historyTab === 0 ? (
                <>
                  <AccountIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron cuentas cerradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay cuentas que coincidan con los filtros seleccionados
                  </Typography>
                </>
              ) : (
                <>
                  <MoneyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron ventas rápidas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay ventas que coincidan con los filtros seleccionados
                  </Typography>
                </>
              )}
            </Box>
          )}
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination 
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* Dialog de detalles */}
        {/* Dialog de detalles de cuenta */}
        <Dialog 
          open={accountDetailsOpen} 
          onClose={() => setAccountDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Detalles de la Cuenta #{selectedAccount?.id}
          </DialogTitle>
          
          <DialogContent>
            {selectedAccount && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Información del Paciente
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {selectedAccount.paciente?.nombre} {selectedAccount.paciente?.apellidoPaterno}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Teléfono:</strong> {selectedAccount.paciente?.telefono}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Información de la Cuenta
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tipo:</strong> {ATTENTION_TYPE_LABELS[selectedAccount.tipoAtencion]}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Apertura:</strong> {formatDate(selectedAccount.fechaApertura)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cierre:</strong> {selectedAccount.fechaCierre ? formatDate(selectedAccount.fechaCierre) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Resumen Financiero
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      <strong>Servicios:</strong> {formatCurrency(selectedAccount.totalServicios)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      <strong>Productos:</strong> {formatCurrency(selectedAccount.totalProductos)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      <strong>Total:</strong> {formatCurrency(selectedAccount.totalCuenta)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setAccountDetailsOpen(false)}>
              Cerrar
            </Button>
            <Button variant="contained" startIcon={<PrintIcon />}>
              Imprimir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de detalles de venta rápida */}
        <Dialog 
          open={saleDetailsOpen} 
          onClose={() => setSaleDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon />
            Detalles de la Venta {selectedSale?.numeroVenta}
          </DialogTitle>
          
          <DialogContent>
            {selectedSale && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Información de la Venta
                    </Typography>
                    <Typography variant="body2">
                      <strong>Número:</strong> {selectedSale.numeroVenta}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {formatDate(selectedSale.fecha)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cajero:</strong> {selectedSale.cajero.username}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Información de Pago
                    </Typography>
                    <Typography variant="body2">
                      <strong>Método:</strong> {selectedSale.metodoPago.toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> {formatCurrency(selectedSale.total)}
                    </Typography>
                    {selectedSale.metodoPago === 'efectivo' && (
                      <>
                        <Typography variant="body2">
                          <strong>Recibido:</strong> {formatCurrency(selectedSale.montoRecibido)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cambio:</strong> {formatCurrency(selectedSale.cambio)}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Items Vendidos
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSale.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip 
                              label={item.tipo.toUpperCase()} 
                              size="small"
                              color={item.tipo === 'servicio' ? 'primary' : 'success'}
                            />
                          </TableCell>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell align="right">{item.cantidad}</TableCell>
                          <TableCell align="right">{formatCurrency(item.precioUnitario)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(selectedSale.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {selectedSale.observaciones && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Observaciones:</Typography>
                    <Typography variant="body2">{selectedSale.observaciones}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setSaleDetailsOpen(false)}>
              Cerrar
            </Button>
            <Button variant="contained" startIcon={<PrintIcon />}>
              Imprimir Recibo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoryTab;