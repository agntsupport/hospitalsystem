// ABOUTME: Página principal para gestionar costos operativos del hospital
// ABOUTME: Solo accesible por administradores para configurar agua, luz, nómina, etc.

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
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lightbulb as LightbulbIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  Shield as ShieldIcon,
  TrendingDown as TrendingDownIcon,
  Campaign as CampaignIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import costsService, { CostoOperativo, CostoOperativoFormData } from '@/services/costsService';

// Categorías que coinciden con el enum del backend
const CATEGORIAS = [
  { value: 'nomina', label: 'Nómina', icon: <PeopleIcon /> },
  { value: 'servicios_publicos', label: 'Servicios Públicos', icon: <LightbulbIcon /> },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: <BuildIcon /> },
  { value: 'insumos_generales', label: 'Insumos Generales', icon: <InventoryIcon /> },
  { value: 'renta_inmueble', label: 'Renta de Inmueble', icon: <HomeIcon /> },
  { value: 'seguros', label: 'Seguros', icon: <ShieldIcon /> },
  { value: 'depreciacion', label: 'Depreciación', icon: <TrendingDownIcon /> },
  { value: 'marketing', label: 'Marketing', icon: <CampaignIcon /> },
  { value: 'capacitacion', label: 'Capacitación', icon: <SchoolIcon /> },
  { value: 'otros', label: 'Otros', icon: <SettingsIcon /> }
];

const CostsPage: React.FC = () => {
  const [costos, setCostos] = useState<CostoOperativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<CostoOperativo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costoToDelete, setCostoToDelete] = useState<CostoOperativo | null>(null);

  // Config state
  const [porcentajeCosto, setPorcentajeCosto] = useState<number>(60);
  const [savingConfig, setSavingConfig] = useState(false);

  // Form state - usando campos reales del backend
  const [formData, setFormData] = useState<CostoOperativoFormData>({
    concepto: '',
    categoria: 'servicios_publicos',
    monto: 0,
    periodo: costsService.getCurrentPeriodo(),
    descripcion: '',
    recurrente: true
  });

  // Stats
  const [stats, setStats] = useState({
    totalMes: 0,
    totalGeneral: 0,
    totalesPorCategoria: {} as Record<string, number>
  });

  const fetchCostos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await costsService.getCostosOperativos();
      const costosData = response.data?.items || [];
      setCostos(costosData);

      // Stats vienen del backend
      const totales = response.data?.totalesPorCategoria || {};
      const totalGeneral = Object.values(totales).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0);

      setStats({
        totalMes: totalGeneral,
        totalGeneral: totalGeneral * 12,
        totalesPorCategoria: totales
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar costos operativos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const config = await costsService.getConfig();
      setPorcentajeCosto(config.porcentajeCostoServicio || 60);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  }, []);

  useEffect(() => {
    fetchCostos();
    fetchConfig();
  }, [fetchCostos, fetchConfig]);

  const handleOpenDialog = (costo?: CostoOperativo) => {
    if (costo) {
      setEditingCosto(costo);
      setFormData({
        concepto: costo.concepto,
        categoria: costo.categoria,
        monto: costo.monto,
        periodo: costo.periodo.split('T')[0], // Convertir ISO a YYYY-MM-DD
        descripcion: costo.descripcion || '',
        recurrente: costo.recurrente
      });
    } else {
      setEditingCosto(null);
      setFormData({
        concepto: '',
        categoria: 'servicios_publicos',
        monto: 0,
        periodo: costsService.getCurrentPeriodo(),
        descripcion: '',
        recurrente: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCosto(null);
  };

  const handleSubmit = async () => {
    if (!formData.concepto || formData.monto <= 0) {
      toast.error('Concepto y monto son requeridos');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCosto) {
        await costsService.updateCostoOperativo(editingCosto.id, formData);
        toast.success('Costo actualizado exitosamente');
      } else {
        await costsService.createCostoOperativo(formData);
        toast.success('Costo creado exitosamente');
      }
      handleCloseDialog();
      fetchCostos();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar costo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!costoToDelete) return;

    try {
      await costsService.deleteCostoOperativo(costoToDelete.id);
      toast.success('Costo eliminado exitosamente');
      setDeleteDialogOpen(false);
      setCostoToDelete(null);
      fetchCostos();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar costo');
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await costsService.updateConfig({ porcentajeCostoServicio: porcentajeCosto });
      toast.success('Configuración guardada exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getCategoriaIcon = (categoria: string) => {
    const cat = CATEGORIAS.find(c => c.value === categoria);
    return cat?.icon || <SettingsIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoneyIcon color="primary" />
        Costos Operativos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gestiona los costos fijos del hospital: servicios públicos, nómina, mantenimiento, etc.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total del Mes
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(stats.totalMes)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Proyección Anual
              </Typography>
              <Typography variant="h5" color="secondary">
                {formatCurrency(stats.totalGeneral)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Costos Activos
              </Typography>
              <Typography variant="h5">
                {costos.filter(c => c.activo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                % Costo Servicios
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  type="number"
                  size="small"
                  value={porcentajeCosto}
                  onChange={(e) => setPorcentajeCosto(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100 }
                  }}
                  sx={{ width: 100 }}
                />
                <Tooltip title="Guardar porcentaje por defecto para calcular costos de servicios">
                  <IconButton
                    color="primary"
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    size="small"
                  >
                    {savingConfig ? <CircularProgress size={20} /> : <SaveIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Costo
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Periodo</TableCell>
              <TableCell>Recurrente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No hay costos operativos registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              costos.map((costo) => (
                <TableRow key={costo.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCategoriaIcon(costo.categoria)}
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {costo.concepto}
                        </Typography>
                        {costo.descripcion && (
                          <Typography variant="caption" color="text.secondary">
                            {costo.descripcion}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={costsService.getCategoriaLabel(costo.categoria)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="medium">
                      {formatCurrency(costo.monto)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {costsService.formatPeriodo(costo.periodo)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={costo.recurrente ? 'Sí' : 'No'}
                      color={costo.recurrente ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={costo.activo ? 'Activo' : 'Inactivo'}
                      color={costo.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(costo)}
                        aria-label="Editar costo"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setCostoToDelete(costo);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label="Eliminar costo"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCosto ? 'Editar Costo Operativo' : 'Nuevo Costo Operativo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Concepto"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Ej: Electricidad CFE, Agua potable, Salario enfermeros"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.categoria}
                  label="Categoría"
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  {CATEGORIAS.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cat.icon}
                        {cat.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Periodo (Mes/Año)"
                type="date"
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.recurrente}
                    onChange={(e) => setFormData({ ...formData, recurrente: e.target.checked })}
                  />
                }
                label="Costo recurrente mensual"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional del costo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Guardando...' : (editingCosto ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de eliminar el costo "{costoToDelete?.concepto}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostsPage;
