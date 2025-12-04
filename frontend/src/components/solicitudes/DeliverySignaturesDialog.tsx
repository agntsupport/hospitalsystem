// ABOUTME: Diálogo para capturar firmas digitales del almacenista y receptor.
// ABOUTME: Genera el acta de entrega COFEPRIS con ambas firmas y PDF almacenado.

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  TextField,
  Paper,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Draw as DrawIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import SignaturePad, { SignaturePadRef } from '../common/SignaturePad';
import solicitudesService, { SolicitudProducto, ItemVerificado } from '../../services/solicitudesService';

interface DeliverySignaturesDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  solicitud: SolicitudProducto | null;
  itemsVerificados: ItemVerificado[];
}

const DeliverySignaturesDialog: React.FC<DeliverySignaturesDialogProps> = ({
  open,
  onClose,
  onBack,
  onSuccess,
  solicitud,
  itemsVerificados,
}) => {
  const [loading, setLoading] = useState(false);
  const [nombreAlmacenista, setNombreAlmacenista] = useState('');
  const [nombreEnfermero, setNombreEnfermero] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [firmaAlmacenistaConfirmada, setFirmaAlmacenistaConfirmada] = useState(false);
  const [firmaEnfermeroConfirmada, setFirmaEnfermeroConfirmada] = useState(false);

  const firmaAlmacenistaRef = useRef<SignaturePadRef>(null);
  const firmaEnfermeroRef = useRef<SignaturePadRef>(null);

  // Inicializar nombres cuando se abre el diálogo
  React.useEffect(() => {
    if (open && solicitud) {
      // Pre-llenar nombre del almacenista si existe
      if (solicitud.almacenista) {
        const nombreCompleto = `${solicitud.almacenista.nombre || ''} ${solicitud.almacenista.apellidos || ''}`.trim();
        setNombreAlmacenista(nombreCompleto);
      }
      // Pre-llenar nombre del solicitante (enfermero/médico)
      if (solicitud.solicitante) {
        const nombreCompleto = `${solicitud.solicitante.nombre || ''} ${solicitud.solicitante.apellidos || ''}`.trim();
        setNombreEnfermero(nombreCompleto);
      }
    }

    if (!open) {
      setNombreAlmacenista('');
      setNombreEnfermero('');
      setObservaciones('');
      setFirmaAlmacenistaConfirmada(false);
      setFirmaEnfermeroConfirmada(false);
    }
  }, [open, solicitud]);

  // Manejar confirmación de firma del almacenista
  const handleFirmaAlmacenistaChange = useCallback((signature: string | null) => {
    setFirmaAlmacenistaConfirmada(!!signature);
  }, []);

  // Manejar confirmación de firma del enfermero
  const handleFirmaEnfermeroChange = useCallback((signature: string | null) => {
    setFirmaEnfermeroConfirmada(!!signature);
  }, []);

  // Validar formulario
  const isFormValid = useCallback(() => {
    return (
      nombreAlmacenista.trim() !== '' &&
      nombreEnfermero.trim() !== '' &&
      firmaAlmacenistaConfirmada &&
      firmaEnfermeroConfirmada
    );
  }, [nombreAlmacenista, nombreEnfermero, firmaAlmacenistaConfirmada, firmaEnfermeroConfirmada]);

  // Generar documento
  const handleGenerarDocumento = useCallback(async () => {
    if (!solicitud || !isFormValid()) return;

    const firmaAlmacenista = firmaAlmacenistaRef.current?.getSignature();
    const firmaEnfermero = firmaEnfermeroRef.current?.getSignature();

    if (!firmaAlmacenista || !firmaEnfermero) {
      toast.error('Ambas firmas son requeridas');
      return;
    }

    setLoading(true);
    try {
      const response = await solicitudesService.createDeliveryDocument(solicitud.id, {
        itemsVerificados,
        firmaAlmacenista,
        nombreAlmacenista: nombreAlmacenista.trim(),
        firmaEnfermero,
        nombreEnfermero: nombreEnfermero.trim(),
        observaciones: observaciones.trim() || undefined,
      });

      toast.success(`Acta de entrega generada: ${response.documento.folio}`);
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al generar documento: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [solicitud, isFormValid, itemsVerificados, nombreAlmacenista, nombreEnfermero, observaciones, onSuccess]);

  if (!solicitud) {
    return null;
  }

  const pacienteNombre = `${solicitud.paciente.nombre} ${solicitud.paciente.apellidoPaterno} ${solicitud.paciente.apellidoMaterno || ''}`.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DrawIcon color="primary" />
          <Typography variant="h6">
            Firmas Digitales - Acta de Entrega COFEPRIS
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información de la solicitud */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                <strong>Solicitud:</strong> {solicitud.numero}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                <strong>Paciente:</strong> {pacienteNombre}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                <strong>Productos:</strong> {itemsVerificados.length} items verificados
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Resumen de productos */}
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{itemsVerificados.length} productos verificados:</strong>{' '}
            {itemsVerificados.map((item) => `${item.nombre} (${item.cantidad})`).join(', ')}
          </Typography>
        </Alert>

        {/* Instrucciones */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> Ambas partes deben firmar el documento.
            El almacenista confirma la entrega y el receptor (enfermero/médico) confirma la recepción.
            Este documento cumple con los requisitos de COFEPRIS para auditorías.
          </Typography>
        </Alert>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={4}>
          {/* Firma del Almacenista */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Firma del Almacenista (Entrega)
              {firmaAlmacenistaConfirmada && <Chip icon={<CheckIcon />} label="Firmado" color="success" size="small" />}
            </Typography>

            <TextField
              label="Nombre completo del almacenista"
              value={nombreAlmacenista}
              onChange={(e) => setNombreAlmacenista(e.target.value)}
              fullWidth
              required
              disabled={loading}
              sx={{ mb: 2 }}
              placeholder="Ingrese el nombre completo"
            />

            <SignaturePad
              ref={firmaAlmacenistaRef}
              label="Firma del Almacenista"
              width={350}
              height={150}
              onSignatureChange={handleFirmaAlmacenistaChange}
              disabled={loading}
              required
            />
          </Grid>

          {/* Firma del Receptor */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Firma del Receptor (Recepción)
              {firmaEnfermeroConfirmada && <Chip icon={<CheckIcon />} label="Firmado" color="success" size="small" />}
            </Typography>

            <TextField
              label="Nombre completo del receptor"
              value={nombreEnfermero}
              onChange={(e) => setNombreEnfermero(e.target.value)}
              fullWidth
              required
              disabled={loading}
              sx={{ mb: 2 }}
              placeholder="Ingrese el nombre completo"
            />

            <SignaturePad
              ref={firmaEnfermeroRef}
              label="Firma del Receptor (Enfermero/Médico)"
              width={350}
              height={150}
              onSignatureChange={handleFirmaEnfermeroChange}
              disabled={loading}
              required
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Observaciones generales */}
        <TextField
          label="Observaciones generales (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={loading}
          placeholder="Ingrese observaciones adicionales si es necesario..."
        />

        {/* Validación */}
        {!isFormValid() && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Complete todos los campos requeridos:
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              {!nombreAlmacenista.trim() && <li>Nombre del almacenista</li>}
              {!nombreEnfermero.trim() && <li>Nombre del receptor</li>}
              {!firmaAlmacenistaConfirmada && <li>Firma del almacenista</li>}
              {!firmaEnfermeroConfirmada && <li>Firma del receptor</li>}
            </ul>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onBack}
          disabled={loading}
          startIcon={<BackIcon />}
        >
          Volver al Checklist
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleGenerarDocumento}
          disabled={!isFormValid() || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
        >
          {loading ? 'Generando Acta...' : 'Generar Acta de Entrega'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliverySignaturesDialog;
