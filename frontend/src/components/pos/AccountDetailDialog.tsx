// ABOUTME: Diálogo unificado para ver detalles de cuenta POS con dos modos: 'full' (transacciones completas) y 'summary' (resumen rápido)
// Soporta impresión de estado de cuenta en formato Carta, paginación, filtros por tipo de transacción

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as MedicalIcon,
  AccountBalance as AccountIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';
import PrintableAccountStatement from './PrintableAccountStatement';

interface AccountDetailDialogProps {
  open: boolean;
  onClose: () => void;
  account: PatientAccount | null;
  /** Modo de visualización: 'full' muestra transacciones completas, 'summary' muestra solo resumen */
  mode?: 'full' | 'summary';
}

interface Transaction {
  id: number;
  tipo: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fecha: string;
  producto?: {
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
  servicio?: {
    codigo: string;
    nombre: string;
    tipo: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AccountDetailDialog: React.FC<AccountDetailDialogProps> = ({
  open,
  onClose,
  account,
  mode = 'full'
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [filterTipo, setFilterTipo] = useState('');
  // Totales actualizados desde el backend
  const [totales, setTotales] = useState({
    anticipo: account?.anticipo || 0,
    totalServicios: account?.totalServicios || 0,
    totalProductos: account?.totalProductos || 0,
    totalCuenta: account?.totalCuenta || 0,
    saldoPendiente: account?.saldoPendiente || 0
  });

  // Funciones de formato memoizadas (usadas en ambos modos)
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

  // Referencia para impresión de estado de cuenta
  const statementRef = useRef<HTMLDivElement>(null);

  // Configuración de impresión formato Carta
  const handlePrint = useReactToPrint({
    contentRef: statementRef,
    documentTitle: `Estado_Cuenta_${account?.id}_${new Date().getTime()}`,
    pageStyle: `
      @page {
        size: letter portrait;
        margin: 0.5in;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  useEffect(() => {
    // En modo summary no cargamos transacciones
    if (open && account && mode === 'full') {
      loadTransactions();
    }
  }, [open, account, page, rowsPerPage, filterTipo, mode]);

  const loadTransactions = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const response = await posService.getAccountTransactions(account.id, {
        page: page + 1,
        limit: rowsPerPage,
        tipo: filterTipo || undefined
      });

      if (response.success && response.data) {
        setTransactions(response.data.transacciones);
        setTotalTransactions(response.data.pagination.total);

        // Actualizar totales con los valores actualizados del backend
        if (response.data?.totales) {
          setTotales(prev => ({
            ...prev,
            ...response.data!.totales
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case 'producto':
        return <PharmacyIcon fontSize="small" />;
      case 'servicio':
        return <MedicalIcon fontSize="small" />;
      case 'anticipo':
        return <AccountIcon fontSize="small" />;
      default:
        return <ReceiptIcon fontSize="small" />;
    }
  };

  const getTransactionColor = (tipo: string) => {
    switch (tipo) {
      case 'producto':
        return 'info';
      case 'servicio':
        return 'primary';
      case 'anticipo':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTransactionsByType = (tipo: string) => {
    return transactions.filter(t => t.tipo === tipo);
  };

  const getTotalByType = (tipo: string) => {
    return getTransactionsByType(tipo).reduce((sum, t) => sum + t.subtotal, 0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!account) return null;

  // Renderizado del modo 'summary' - Vista simplificada sin transacciones
  if (mode === 'summary') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          Detalles de la Cuenta #{account.id}
        </DialogTitle>

        <DialogContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Información del Paciente
                </Typography>
                <Typography variant="body2">
                  <strong>Nombre:</strong> {account.paciente?.nombre} {account.paciente?.apellidoPaterno}
                </Typography>
                <Typography variant="body2">
                  <strong>Teléfono:</strong> {account.paciente?.telefono || 'Sin teléfono'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Información de la Cuenta
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {ATTENTION_TYPE_LABELS[account.tipoAtencion] || account.tipoAtencion}
                </Typography>
                <Typography variant="body2">
                  <strong>Apertura:</strong> {formatDate(account.fechaApertura)}
                </Typography>
                <Typography variant="body2">
                  <strong>Cierre:</strong> {account.fechaCierre ? formatDate(account.fechaCierre) : 'N/A'}
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
                  <strong>Servicios:</strong> {formatCurrency(account.totalServicios)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  <strong>Productos:</strong> {formatCurrency(account.totalProductos)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  <strong>Total:</strong> {formatCurrency(account.totalCuenta)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Imprimir
          </Button>
        </DialogActions>

        {/* Componente de estado de cuenta imprimible (oculto) */}
        <div style={{ display: 'none' }}>
          <PrintableAccountStatement
            ref={statementRef}
            data={{
              cuentaId: account.id,
              fechaEmision: new Date(),
              paciente: {
                nombre: account.paciente?.nombre || '',
                apellidoPaterno: account.paciente?.apellidoPaterno || '',
                apellidoMaterno: account.paciente?.apellidoMaterno,
                telefono: account.paciente?.telefono,
                email: account.paciente?.email,
                direccion: account.paciente?.direccion
              },
              medicoTratante: account.medicoTratante ? {
                nombre: account.medicoTratante.nombre,
                apellidoPaterno: account.medicoTratante.apellidoPaterno,
                especialidad: account.medicoTratante.especialidad
              } : undefined,
              tipoAtencion: account.tipoAtencion,
              fechaIngreso: account.fechaApertura,
              transacciones: [],
              totales: {
                anticipo: account.anticipo || 0,
                totalServicios: account.totalServicios || 0,
                totalProductos: account.totalProductos || 0,
                totalCuenta: account.totalCuenta || 0,
                saldoPendiente: account.saldoPendiente || 0
              },
              estado: account.estado
            }}
          />
        </div>
      </Dialog>
    );
  }

  // Modo 'full' - Vista completa con transacciones
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReceiptIcon />
            <Box>
              <Typography variant="h6">
                Estado de Cuenta #{account.id}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {account.paciente ?
                  `${account.paciente.nombre} ${account.paciente.apellidoPaterno} ${account.paciente.apellidoMaterno || ''}`.trim()
                  : 'Paciente no encontrado'
                }
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar">
              <IconButton onClick={loadTransactions} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Resumen de la cuenta */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumen de la Cuenta
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Cálculo del saldo:</strong> Anticipo - Total de servicios y productos = Saldo{' '}
              {totales.saldoPendiente >= 0
                ? '(a favor del paciente)'
                : '(que debe el paciente)'
              }
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<AccountIcon />}
              label={`Anticipo: ${formatCurrency(totales.anticipo)}`}
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<MedicalIcon />}
              label={`Servicios: ${formatCurrency(totales.totalServicios)}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PharmacyIcon />}
              label={`Productos: ${formatCurrency(totales.totalProductos)}`}
              color="info"
              variant="outlined"
            />
            <Chip
              label={`Total: ${formatCurrency(totales.totalCuenta)}`}
              color="default"
              variant="filled"
            />
            <Chip
              label={totales.saldoPendiente >= 0
                ? `Saldo a Favor: +${formatCurrency(Math.abs(totales.saldoPendiente))}`
                : `Debe: ${formatCurrency(totales.saldoPendiente)}`
              }
              color={totales.saldoPendiente >= 0 ? 'success' : 'error'}
              variant="filled"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Filtros */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo de Transacción</InputLabel>
            <Select
              value={filterTipo}
              label="Tipo de Transacción"
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="anticipo">Anticipos</MenuItem>
              <MenuItem value="servicio">Servicios</MenuItem>
              <MenuItem value="producto">Productos</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Total: {totalTransactions} transacciones
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Todas las Transacciones" />
          <Tab label={`Productos (${getTransactionsByType('producto').length})`} />
          <Tab label={`Servicios (${getTransactionsByType('servicio').length})`} />
        </Tabs>

        {/* Lista de transacciones */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Alert severity="info">
              No se encontraron transacciones para esta cuenta.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Chip
                            icon={getTransactionIcon(transaction.tipo)}
                            label={transaction.tipo.charAt(0).toUpperCase() + transaction.tipo.slice(1)}
                            color={getTransactionColor(transaction.tipo) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.concepto}
                          </Typography>
                          {transaction.producto && (
                            <Typography variant="caption" color="text.secondary">
                              {transaction.producto.codigo} - {transaction.producto.unidadMedida}
                            </Typography>
                          )}
                          {transaction.servicio && (
                            <Typography variant="caption" color="text.secondary">
                              {transaction.servicio.codigo} - {transaction.servicio.tipo}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {transaction.cantidad}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(transaction.precioUnitario)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(transaction.subtotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(transaction.fecha)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalTransactions}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Transacciones por página:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Productos ({getTransactionsByType('producto').length})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total en productos: {formatCurrency(getTotalByType('producto'))}
          </Typography>
          {/* Similar table for products only */}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Servicios ({getTransactionsByType('servicio').length})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total en servicios: {formatCurrency(getTotalByType('servicio'))}
          </Typography>
          {/* Similar table for services only */}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          disabled={loading || transactions.length === 0}
          onClick={handlePrint}
        >
          Imprimir Estado de Cuenta
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={loading}
        >
          Exportar
        </Button>
      </DialogActions>

      {/* Componente de estado de cuenta imprimible (oculto) */}
      {account && (
        <div style={{ display: 'none' }}>
          <PrintableAccountStatement
            ref={statementRef}
            data={{
              cuentaId: account.id,
              fechaEmision: new Date(),
              paciente: {
                nombre: account.paciente?.nombre || '',
                apellidoPaterno: account.paciente?.apellidoPaterno || '',
                apellidoMaterno: account.paciente?.apellidoMaterno,
                telefono: account.paciente?.telefono,
                email: account.paciente?.email,
                direccion: account.paciente?.direccion
              },
              medicoTratante: account.medicoTratante ? {
                nombre: account.medicoTratante.nombre,
                apellidoPaterno: account.medicoTratante.apellidoPaterno,
                especialidad: account.medicoTratante.especialidad
              } : undefined,
              tipoAtencion: account.tipoAtencion,
              fechaIngreso: account.fechaApertura,
              transacciones: transactions.map(t => ({
                ...t,
                fecha: t.fecha
              })),
              totales: totales,
              estado: account.estado
            }}
          />
        </div>
      )}
    </Dialog>
  );
};

export default AccountDetailDialog;