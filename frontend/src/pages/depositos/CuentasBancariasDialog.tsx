// ABOUTME: Diálogo para gestionar cuentas bancarias (solo admin)
// ABOUTME: Permite crear, editar y desactivar cuentas bancarias

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
  Collapse,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountBalance,
  ExpandLess,
} from '@mui/icons-material';

import { bancosService, CuentaBancaria, TipoCuenta } from '@/services/bancosService';

interface CuentasBancariasDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface CuentaForm {
  banco: string;
  numeroCuenta: string;
  clabe: string;
  alias: string;
  tipo: TipoCuenta;
  moneda: string;
  activa: boolean;
}

const initialForm: CuentaForm = {
  banco: '',
  numeroCuenta: '',
  clabe: '',
  alias: '',
  tipo: 'corriente',
  moneda: 'MXN',
  activa: true,
};

const CuentasBancariasDialog: React.FC<CuentasBancariasDialogProps> = ({
  open,
  onClose,
  onUpdate,
}) => {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CuentaForm>(initialForm);

  const loadCuentas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bancosService.getCuentas();
      if (response.success && response.data) {
        setCuentas(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando cuentas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadCuentas();
    }
  }, [open, loadCuentas]);

  const getTipoLabel = (tipo: TipoCuenta): string => {
    const labels: Record<TipoCuenta, string> = {
      corriente: 'Corriente',
      ahorro: 'Ahorro',
      inversion: 'Inversión',
    };
    return labels[tipo] || tipo;
  };

  const handleEdit = (cuenta: CuentaBancaria) => {
    setEditingId(cuenta.id);
    setForm({
      banco: cuenta.banco,
      numeroCuenta: cuenta.numeroCuenta,
      clabe: cuenta.clabe || '',
      alias: cuenta.alias,
      tipo: cuenta.tipo,
      moneda: cuenta.moneda,
      activa: cuenta.activa,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de desactivar esta cuenta bancaria?')) {
      return;
    }

    try {
      await bancosService.desactivarCuenta(id);
      loadCuentas();
      onUpdate();
    } catch (err) {
      console.error('Error desactivando cuenta:', err);
      setError('Error al desactivar la cuenta');
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.banco.trim() || !form.numeroCuenta.trim() || !form.alias.trim()) {
      setError('Banco, número de cuenta y alias son requeridos');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...form,
        clabe: form.clabe.trim() || undefined,
      };

      if (editingId) {
        await bancosService.actualizarCuenta(editingId, data);
      } else {
        await bancosService.crearCuenta(data);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadCuentas();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cuenta');
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
        <AccountBalance color="primary" />
        Gestión de Cuentas Bancarias
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
            {showForm ? 'Cancelar' : 'Nueva Cuenta'}
          </Button>
        </Box>

        {/* Formulario */}
        <Collapse in={showForm}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Banco"
                  value={form.banco}
                  onChange={(e) => setForm({ ...form, banco: e.target.value })}
                  fullWidth
                  required
                  placeholder="Ej: BBVA, Santander, Banorte"
                />

                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.tipo}
                    label="Tipo"
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCuenta })}
                  >
                    <MenuItem value="corriente">Corriente</MenuItem>
                    <MenuItem value="ahorro">Ahorro</MenuItem>
                    <MenuItem value="inversion">Inversión</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Número de Cuenta"
                  value={form.numeroCuenta}
                  onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })}
                  fullWidth
                  required
                />

                <TextField
                  label="CLABE (opcional)"
                  value={form.clabe}
                  onChange={(e) => setForm({ ...form, clabe: e.target.value })}
                  fullWidth
                  inputProps={{ maxLength: 18 }}
                  helperText="18 dígitos"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Alias"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  fullWidth
                  required
                  placeholder="Ej: Cuenta Principal, Cuenta Nómina"
                />

                <FormControl sx={{ minWidth: 100 }}>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={form.moneda}
                    label="Moneda"
                    onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                  >
                    <MenuItem value="MXN">MXN</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCancel}>Cancelar</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Collapse>

        {/* Tabla de cuentas */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Alias</TableCell>
                <TableCell>Banco</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : cuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay cuentas bancarias configuradas
                  </TableCell>
                </TableRow>
              ) : (
                cuentas.map((cuenta) => (
                  <TableRow key={cuenta.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{cuenta.alias}</Typography>
                    </TableCell>
                    <TableCell>{cuenta.banco}</TableCell>
                    <TableCell>{cuenta.numeroCuenta}</TableCell>
                    <TableCell>
                      <Chip label={getTipoLabel(cuenta.tipo)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cuenta.activa ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={cuenta.activa ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(cuenta)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {cuenta.activa && (
                        <Tooltip title="Desactivar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(cuenta.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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

export default CuentasBancariasDialog;
