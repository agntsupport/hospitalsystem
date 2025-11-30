// ABOUTME: Diálogo para gestionar políticas de descuento (solo admin)
// ABOUTME: Permite crear, editar y desactivar políticas de descuento

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

import {
  descuentosService,
  PoliticaDescuento,
  TipoDescuento,
} from '@/services/descuentosService';

interface PoliticasDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface PoliticaForm {
  nombre: string;
  tipo: TipoDescuento;
  porcentajeMaximo: number;
  montoMaximo: number | null;
  rolesPermitidos: string[];
  requiereAutorizacion: boolean;
  rolesAutorizadores: string[];
  activo: boolean;
}

const initialForm: PoliticaForm = {
  nombre: '',
  tipo: 'cortesia_medica',
  porcentajeMaximo: 10,
  montoMaximo: null,
  rolesPermitidos: ['cajero', 'administrador'],
  requiereAutorizacion: true,
  rolesAutorizadores: ['administrador'],
  activo: true,
};

const ROLES_DISPONIBLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'medico_especialista', label: 'Médico Especialista' },
  { value: 'medico_residente', label: 'Médico Residente' },
];

const PoliticasDialog: React.FC<PoliticasDialogProps> = ({
  open,
  onClose,
  onUpdate,
}) => {
  const [politicas, setPoliticas] = useState<PoliticaDescuento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PoliticaForm>(initialForm);

  const loadPoliticas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await descuentosService.getPoliticas();
      if (response.success && response.data) {
        setPoliticas(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando políticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadPoliticas();
    }
  }, [open, loadPoliticas]);

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'cortesia_medica': 'Cortesía Médica',
      'empleado_hospital': 'Empleado Hospital',
      'convenio_empresa': 'Convenio Empresa',
      'promocion_temporal': 'Promoción Temporal',
      'ajuste_precio': 'Ajuste de Precio',
      'redondeo': 'Redondeo',
      'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  };

  const handleEdit = (politica: PoliticaDescuento) => {
    setEditingId(politica.id);
    setForm({
      nombre: politica.nombre,
      tipo: politica.tipo,
      porcentajeMaximo: politica.porcentajeMaximo,
      montoMaximo: politica.montoMaximo || null,
      rolesPermitidos: politica.rolesPermitidos,
      requiereAutorizacion: politica.requiereAutorizacion,
      rolesAutorizadores: politica.rolesAutorizadores,
      activo: politica.activo,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta política?')) {
      return;
    }

    try {
      await descuentosService.eliminarPolitica(id);
      loadPoliticas();
      onUpdate();
    } catch (err) {
      console.error('Error eliminando política:', err);
      setError('Error al eliminar la política');
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (form.porcentajeMaximo <= 0 || form.porcentajeMaximo > 100) {
      setError('El porcentaje debe estar entre 1 y 100');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await descuentosService.actualizarPolitica(editingId, form);
      } else {
        await descuentosService.crearPolitica(form);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadPoliticas();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Error al guardar política');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        Gestión de Políticas de Descuento
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Botón para agregar */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant={showForm ? 'outlined' : 'contained'}
            startIcon={showForm ? <ExpandLess /> : <Add />}
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm ? 'Cancelar' : 'Nueva Política'}
          </Button>
        </Box>

        {/* Formulario */}
        <Collapse in={showForm}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {editingId ? 'Editar Política' : 'Nueva Política'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                fullWidth
                required
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.tipo}
                    label="Tipo"
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDescuento })}
                  >
                    <MenuItem value="cortesia_medica">Cortesía Médica</MenuItem>
                    <MenuItem value="empleado_hospital">Empleado Hospital</MenuItem>
                    <MenuItem value="convenio_empresa">Convenio Empresa</MenuItem>
                    <MenuItem value="promocion_temporal">Promoción Temporal</MenuItem>
                    <MenuItem value="ajuste_precio">Ajuste de Precio</MenuItem>
                    <MenuItem value="redondeo">Redondeo</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="% Máximo"
                  type="number"
                  value={form.porcentajeMaximo}
                  onChange={(e) => setForm({ ...form, porcentajeMaximo: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ width: 150 }}
                />

                <TextField
                  label="Monto Máximo"
                  type="number"
                  value={form.montoMaximo || ''}
                  onChange={(e) => setForm({ ...form, montoMaximo: e.target.value ? parseFloat(e.target.value) : null })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ width: 150 }}
                  placeholder="Sin límite"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Roles Permitidos</InputLabel>
                  <Select
                    multiple
                    value={form.rolesPermitidos}
                    label="Roles Permitidos"
                    onChange={(e) => setForm({ ...form, rolesPermitidos: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={ROLES_DISPONIBLES.find(r => r.value === value)?.label || value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {ROLES_DISPONIBLES.map((rol) => (
                      <MenuItem key={rol.value} value={rol.value}>
                        {rol.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Roles Autorizadores</InputLabel>
                  <Select
                    multiple
                    value={form.rolesAutorizadores}
                    label="Roles Autorizadores"
                    onChange={(e) => setForm({ ...form, rolesAutorizadores: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={ROLES_DISPONIBLES.find(r => r.value === value)?.label || value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {ROLES_DISPONIBLES.map((rol) => (
                      <MenuItem key={rol.value} value={rol.value}>
                        {rol.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.requiereAutorizacion}
                      onChange={(e) => setForm({ ...form, requiereAutorizacion: e.target.checked })}
                    />
                  }
                  label="Requiere Autorización"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                  }
                  label="Activo"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Collapse>

        {/* Tabla de políticas */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">% Máx.</TableCell>
                <TableCell>Autorización</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Cargando...</TableCell>
                </TableRow>
              ) : politicas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay políticas configuradas
                  </TableCell>
                </TableRow>
              ) : (
                politicas.map((politica) => (
                  <TableRow key={politica.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{politica.nombre}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTipoLabel(politica.tipo)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {politica.porcentajeMaximo}%
                    </TableCell>
                    <TableCell>
                      {politica.requiereAutorizacion ? (
                        <Chip label="Sí" size="small" color="warning" />
                      ) : (
                        <Chip label="No" size="small" color="success" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={politica.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={politica.activo ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(politica)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(politica.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PoliticasDialog;
