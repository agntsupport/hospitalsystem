// ABOUTME: Tab de comisiones médicas para el módulo de reportes.
// ABOUTME: Lista comisiones, permite calcular, pagar y ver comprobantes PDF.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  AttachMoney as PayIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import StatCard, { StatCardsGrid } from '../common/StatCard';
import comisionesService, { ComisionMedica, ComisionStats, EstadoComision } from '../../services/comisionesService';
import CommissionCalculatorDialog from './CommissionCalculatorDialog';
import CommissionPaymentDialog from './CommissionPaymentDialog';

const CommissionsReportTab: React.FC = () => {
  // Estados principales
  const [comisiones, setComisiones] = useState<ComisionMedica[]>([]);
  const [stats, setStats] = useState<ComisionStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros y paginación
  const [filterEstado, setFilterEstado] = useState<EstadoComision | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Menú de acciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComision, setSelectedComision] = useState<ComisionMedica | null>(null);

  // Diálogos
  const [openCalculator, setOpenCalculator] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [comisionesRes, statsRes] = await Promise.all([
        comisionesService.getComisiones({
          estado: filterEstado || undefined,
          page: page + 1,
          limit: rowsPerPage,
        }),
        comisionesService.getStats(),
      ]);

      setComisiones(comisionesRes.data);
      setTotal(comisionesRes.pagination.total);
      setStats(statsRes);
    } catch (error) {
      console.error('Error cargando comisiones:', error);
      toast.error('Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  }, [filterEstado, page, rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers del menú
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, comision: ComisionMedica) => {
    setAnchorEl(event.currentTarget);
    setSelectedComision(comision);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedComision(null);
  };

  // Pagar comisión
  const handlePagar = () => {
    setOpenPayment(true);
    setAnchorEl(null);
  };

  // Anular comisión
  const handleAnular = async () => {
    if (!selectedComision) return;

    try {
      await comisionesService.anularComision(selectedComision.id);
      toast.success('Comisión anulada');
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al anular: ${errorMessage}`);
    }
    handleCloseMenu();
  };

  // Descargar PDF
  const handleDownloadPdf = async () => {
    if (!selectedComision) return;

    try {
      const blob = await comisionesService.downloadPdf(selectedComision.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comision-${selectedComision.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al descargar: ${errorMessage}`);
    }
    handleCloseMenu();
  };

  // Regenerar PDF para comisiones pagadas sin comprobante
  const handleRegenerarPdf = async () => {
    if (!selectedComision) return;

    try {
      await comisionesService.regenerarPdf(selectedComision.id);
      toast.success('PDF regenerado exitosamente. Ahora puedes descargarlo.');
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al regenerar PDF: ${errorMessage}`);
    }
    handleCloseMenu();
  };

  return (
    <Box>
      {/* Estadísticas */}
      <StatCardsGrid sx={{ mb: 3 }}>
        <StatCard
          title="Pendientes"
          value={stats?.porEstado.pendientes || 0}
          icon={<CalculateIcon />}
          color="warning"
          loading={!stats}
        />
        <StatCard
          title="Pagadas"
          value={stats?.porEstado.pagadas || 0}
          icon={<PayIcon />}
          color="success"
          loading={!stats}
        />
        <StatCard
          title="Total Pagado"
          value={comisionesService.formatCurrency(stats?.totalPagado || 0)}
          icon={<PayIcon />}
          color="primary"
          loading={!stats}
        />
        <StatCard
          title="Este Mes"
          value={comisionesService.formatCurrency(stats?.mesActual.monto || 0)}
          subtitle={`${stats?.mesActual.cantidad || 0} comisiones`}
          icon={<PayIcon />}
          color="info"
          loading={!stats}
        />
      </StatCardsGrid>

      {/* Filtros y acciones */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                label="Estado"
                onChange={(e: SelectChangeEvent) => {
                  setFilterEstado(e.target.value as EstadoComision | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PAGADA">Pagada</MenuItem>
                <MenuItem value="ANULADA">Anulada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCalculator(true)}
            >
              Calcular Comisiones
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de comisiones */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médico</TableCell>
                <TableCell>Periodo</TableCell>
                <TableCell align="center">Cuentas</TableCell>
                <TableCell align="right">Facturado</TableCell>
                <TableCell align="right">Comisión</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Fecha Pago</TableCell>
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
              ) : comisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay comisiones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                comisiones.map((comision) => (
                  <TableRow key={comision.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {comision.nombreMedico}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comision.especialidad || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {comisionesService.formatPeriodo(comision.fechaInicio, comision.fechaFin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={comision.totalCuentas} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {comisionesService.formatCurrency(comision.montoFacturado)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {comisionesService.formatCurrency(comision.montoComision)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={comisionesService.getEstadoLabel(comision.estado)}
                        color={comisionesService.getEstadoColor(comision.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {comision.fechaPago
                        ? comisionesService.formatDate(comision.fechaPago)
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, comision)}
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedComision?.estado === 'PENDIENTE' && (
          <MenuItem onClick={handlePagar}>
            <PayIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
            Pagar Comisión
          </MenuItem>
        )}
        {selectedComision?.estado === 'PAGADA' && selectedComision.pdfComprobante && (
          <MenuItem onClick={handleDownloadPdf}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
            Descargar PDF
          </MenuItem>
        )}
        {selectedComision?.estado === 'PAGADA' && !selectedComision.pdfComprobante && (
          <MenuItem onClick={handleRegenerarPdf}>
            <PdfIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            Generar PDF
          </MenuItem>
        )}
        {selectedComision?.estado === 'PENDIENTE' && (
          <MenuItem onClick={handleAnular}>
            <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
            Anular
          </MenuItem>
        )}
      </Menu>

      {/* Diálogos */}
      <CommissionCalculatorDialog
        open={openCalculator}
        onClose={() => setOpenCalculator(false)}
        onSuccess={() => {
          setOpenCalculator(false);
          loadData();
        }}
      />

      <CommissionPaymentDialog
        open={openPayment}
        onClose={() => {
          setOpenPayment(false);
          setSelectedComision(null);
        }}
        onSuccess={() => {
          setOpenPayment(false);
          setSelectedComision(null);
          loadData();
        }}
        comision={selectedComision}
      />
    </Box>
  );
};

export default CommissionsReportTab;
