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
  Card,
  CardContent,
  Alert,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';

import { billingService } from '@/services/billingService';
import { Invoice, InvoiceFilters, INVOICE_STATUSES } from '@/types/billing.types';
import InvoiceDetailsDialog from '@/components/billing/InvoiceDetailsDialog';
import PaymentDialog from '@/components/billing/PaymentDialog';
import CreateInvoiceDialog from '@/components/billing/CreateInvoiceDialog';

interface InvoicesTabProps {
  onDataChange: () => void;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({ onDataChange }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para diálogos
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    estado: undefined,
    fechaInicio: undefined,
    fechaFin: undefined,
    folio: '',
    numeroExpediente: '',
    montoMinimo: undefined,
    montoMaximo: undefined,
    soloVencidas: false
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await billingService.getInvoices({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success && response.data) {
        setInvoices(response.data.items || []);
        setTotal(response.data.total || 0);
      } else {
        setInvoices([]);
        setTotal(0);
        setError(response.message || 'Error al cargar facturas');
      }
    } catch (err) {
      setError('Error al cargar facturas');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
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
      estado: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      folio: '',
      numeroExpediente: '',
      montoMinimo: undefined,
      montoMaximo: undefined,
      soloVencidas: false
    });
    setPage(0);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialogOpen(true);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    if (invoice.saldoPendiente <= 0) return;
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleInvoiceUpdate = () => {
    loadInvoices();
    onDataChange();
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
    handleInvoiceUpdate();
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    handleInvoiceUpdate();
  };

  const getStatusColor = (estado: Invoice['estado']) => {
    return billingService.getInvoiceStatusColor(estado);
  };

  const isOverdue = (invoice: Invoice) => {
    return billingService.isInvoiceOverdue(invoice);
  };

  const getPaymentProgress = (invoice: Invoice) => {
    return billingService.getPaymentProgress(invoice);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InvoiceIcon color="primary" />
          Facturas ({total})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nueva Factura
          </Button>
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
            onClick={loadInvoices}
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.estado || ''}
                    label="Estado"
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value as any || undefined })}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(INVOICE_STATUSES).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Folio"
                  value={filters.folio || ''}
                  onChange={(e) => setFilters({ ...filters, folio: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Expediente"
                  value={filters.numeroExpediente || ''}
                  onChange={(e) => setFilters({ ...filters, numeroExpediente: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
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

              <Grid item xs={12} sm={6} md={2}>
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

              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    size="small"
                  >
                    Limpiar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Facturas */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell align="center">Progreso</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  Cargando facturas...
                </TableCell>
              </TableRow>
            ) : (invoices?.length || 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  No se encontraron facturas
                </TableCell>
              </TableRow>
            ) : (
              (invoices || []).map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <InvoiceIcon fontSize="small" />
                      </Avatar>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '120px'
                        }}
                      >
                        {invoice.folio}
                      </Typography>
                    </Box>
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
                        {invoice.paciente.nombre} {invoice.paciente.apellidoPaterno}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.paciente.numeroExpediente}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {billingService.formatDate(invoice.fechaEmision)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      color={isOverdue(invoice) ? 'error' : 'text.primary'}
                    >
                      {billingService.formatDate(invoice.fechaVencimiento)}
                    </Typography>
                    {isOverdue(invoice) && (
                      <Typography variant="caption" color="error">
                        Vencida
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={INVOICE_STATUSES[invoice.estado]}
                      color={getStatusColor(invoice.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {billingService.formatCurrency(invoice.total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2"
                      color={invoice.saldoPendiente > 0 ? 'warning.main' : 'success.main'}
                    >
                      {billingService.formatCurrency(invoice.saldoPendiente)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getPaymentProgress(invoice)}
                        sx={{ width: 60, height: 6 }}
                        color={getPaymentProgress(invoice) === 100 ? 'success' : 'primary'}
                      />
                      <Typography variant="caption">
                        {getPaymentProgress(invoice)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewInvoice(invoice)}
                          color="primary"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {invoice.saldoPendiente > 0 && (
                        <Tooltip title="Registrar pago">
                          <IconButton
                            size="small"
                            onClick={() => handlePayInvoice(invoice)}
                            color="success"
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
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

      {/* Diálogos */}
      <InvoiceDetailsDialog
        open={detailsDialogOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedInvoice(null);
        }}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        invoice={selectedInvoice}
        onClose={() => setPaymentDialogOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default InvoicesTab;