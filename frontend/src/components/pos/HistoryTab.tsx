import React, { useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Grid,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  AccountBalance as AccountIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import { useAccountHistory } from '@/hooks/useAccountHistory';
import AccountHistoryList from './AccountHistoryList';
import AccountDetailsDialog from './AccountDetailsDialog';

interface HistoryTabProps {
  onRefresh?: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onRefresh }) => {
  const {
    closedAccounts,
    expandedAccount,
    selectedAccount,
    accountDetailsOpen,
    setAccountDetailsOpen,
    quickSales,
    expandedSale,
    selectedSale,
    saleDetailsOpen,
    setSaleDetailsOpen,
    loading,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    page,
    setPage,
    totalPages,
    historyTab,
    setHistoryTab,
    loadClosedAccounts,
    loadQuickSales,
    handleExpandAccount,
    handleViewDetails,
    handleExpandSale,
    handleViewSaleDetails,
    handleApplyFilters,
    handleClearFilters,
    handleExportData
  } = useAccountHistory();

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

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
            <AccountHistoryList
              accounts={closedAccounts}
              expandedAccount={expandedAccount}
              onExpandAccount={handleExpandAccount}
              onViewDetails={handleViewDetails}
              loading={loading}
              historyTab={historyTab}
            />
          ) : (
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
                      <TableRow hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.numeroVenta}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.cajero.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sale.metodoPago.toUpperCase()}
                            color={sale.metodoPago === 'efectivo' ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sale.fecha)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(sale.total)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Ver detalles">
                              <IconButton size="small" onClick={() => handleViewSaleDetails(sale)}>
                                <ViewIcon fontSize="small" />
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
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

        {/* Diálogos de detalles */}
        <AccountDetailsDialog
          accountDetailsOpen={accountDetailsOpen}
          saleDetailsOpen={saleDetailsOpen}
          selectedAccount={selectedAccount}
          selectedSale={selectedSale}
          onCloseAccountDetails={() => setAccountDetailsOpen(false)}
          onCloseSaleDetails={() => setSaleDetailsOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default HistoryTab;
