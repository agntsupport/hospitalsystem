// ABOUTME: Diálogo para verificar productos antes de la entrega con checklist.
// ABOUTME: Parte del flujo COFEPRIS - requiere verificar cada producto antes de firmar.

import React, { useState, useCallback, useMemo } from 'react';
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
  Checkbox,
  TextField,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ArrowForward as NextIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

import { SolicitudProducto } from '../../services/solicitudesService';

interface ItemVerificado {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  verificado: boolean;
  observacion: string;
}

interface DeliveryChecklistDialogProps {
  open: boolean;
  onClose: () => void;
  onContinue: (items: ItemVerificado[]) => void;
  solicitud: SolicitudProducto | null;
  loading?: boolean;
}

const DeliveryChecklistDialog: React.FC<DeliveryChecklistDialogProps> = ({
  open,
  onClose,
  onContinue,
  solicitud,
  loading = false,
}) => {
  const [itemsVerificados, setItemsVerificados] = useState<ItemVerificado[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Inicializar items cuando se abre el diálogo
  React.useEffect(() => {
    if (open && solicitud && !initialized) {
      const items = solicitud.detalles.map((detalle) => ({
        productoId: detalle.productoId,
        codigo: detalle.producto.codigo,
        nombre: detalle.producto.nombre,
        cantidad: detalle.cantidadSolicitada,
        verificado: false,
        observacion: '',
      }));
      setItemsVerificados(items);
      setInitialized(true);
    }

    if (!open) {
      setInitialized(false);
    }
  }, [open, solicitud, initialized]);

  // Verificar si todos los items están marcados
  const todosVerificados = useMemo(() => {
    return itemsVerificados.length > 0 && itemsVerificados.every((item) => item.verificado);
  }, [itemsVerificados]);

  // Contar verificados
  const conteoVerificados = useMemo(() => {
    return itemsVerificados.filter((item) => item.verificado).length;
  }, [itemsVerificados]);

  // Manejar cambio de verificación
  const handleVerificadoChange = useCallback((productoId: number, verificado: boolean) => {
    setItemsVerificados((prev) =>
      prev.map((item) =>
        item.productoId === productoId ? { ...item, verificado } : item
      )
    );
  }, []);

  // Manejar cambio de observación
  const handleObservacionChange = useCallback((productoId: number, observacion: string) => {
    setItemsVerificados((prev) =>
      prev.map((item) =>
        item.productoId === productoId ? { ...item, observacion } : item
      )
    );
  }, []);

  // Marcar todos como verificados
  const handleMarcarTodos = useCallback(() => {
    setItemsVerificados((prev) =>
      prev.map((item) => ({ ...item, verificado: true }))
    );
  }, []);

  // Desmarcar todos
  const handleDesmarcarTodos = useCallback(() => {
    setItemsVerificados((prev) =>
      prev.map((item) => ({ ...item, verificado: false }))
    );
  }, []);

  // Continuar a firmas
  const handleContinue = useCallback(() => {
    if (todosVerificados) {
      onContinue(itemsVerificados);
    }
  }, [todosVerificados, itemsVerificados, onContinue]);

  if (!solicitud) {
    return null;
  }

  const pacienteNombre = `${solicitud.paciente.nombre} ${solicitud.paciente.apellidoPaterno} ${solicitud.paciente.apellidoMaterno || ''}`.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">
            Verificación de Productos - Solicitud {solicitud.numero}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información del paciente */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Paciente:</strong> {pacienteNombre}
          </Typography>
        </Box>

        {/* Instrucciones */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Instrucciones COFEPRIS:</strong> Verifique cada producto físicamente antes de marcarlo.
            Agregue observaciones si hay discrepancias en cantidad, estado o lote.
          </Typography>
        </Alert>

        {/* Progreso */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2">
            Productos verificados: <strong>{conteoVerificados} de {itemsVerificados.length}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={handleMarcarTodos}>
              Marcar todos
            </Button>
            <Button size="small" variant="outlined" color="secondary" onClick={handleDesmarcarTodos}>
              Desmarcar todos
            </Button>
          </Box>
        </Box>

        {/* Tabla de productos */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', width: 60 }}>Verificar</TableCell>
                <TableCell sx={{ color: 'white', width: 100 }}>Código</TableCell>
                <TableCell sx={{ color: 'white' }}>Producto</TableCell>
                <TableCell sx={{ color: 'white', width: 80, textAlign: 'center' }}>Cantidad</TableCell>
                <TableCell sx={{ color: 'white', width: 120 }}>Estado</TableCell>
                <TableCell sx={{ color: 'white' }}>Observaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsVerificados.map((item) => (
                <TableRow
                  key={item.productoId}
                  sx={{
                    bgcolor: item.verificado ? 'success.light' : 'inherit',
                    '&:hover': { bgcolor: item.verificado ? 'success.light' : 'action.hover' },
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={item.verificado}
                      onChange={(e) => handleVerificadoChange(item.productoId, e.target.checked)}
                      disabled={loading}
                      color="success"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.nombre}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.cantidad}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.verificado ? (
                      <Tooltip title="Verificado">
                        <Chip
                          icon={<CheckIcon />}
                          label="OK"
                          size="small"
                          color="success"
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Pendiente de verificar">
                        <Chip
                          icon={<CancelIcon />}
                          label="Pendiente"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Observaciones..."
                      value={item.observacion}
                      onChange={(e) => handleObservacionChange(item.productoId, e.target.value)}
                      disabled={loading}
                      fullWidth
                      variant="outlined"
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Alerta si no todos verificados */}
        {!todosVerificados && itemsVerificados.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Debe verificar todos los productos antes de continuar con las firmas.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleContinue}
          disabled={!todosVerificados || loading}
          endIcon={loading ? <CircularProgress size={20} /> : <NextIcon />}
        >
          {loading ? 'Procesando...' : 'Continuar a Firmas'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryChecklistDialog;
