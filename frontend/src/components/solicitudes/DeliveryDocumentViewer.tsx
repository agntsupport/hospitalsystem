// ABOUTME: Diálogo para visualizar y descargar documentos de entrega COFEPRIS.
// ABOUTME: Muestra información del acta, firmas y permite descargar el PDF.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Description as DocIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import solicitudesService, { DeliveryDocument } from '../../services/solicitudesService';

interface DeliveryDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  solicitudId: number | null;
}

const DeliveryDocumentViewer: React.FC<DeliveryDocumentViewerProps> = ({
  open,
  onClose,
  solicitudId,
}) => {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [documento, setDocumento] = useState<DeliveryDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar documento
  useEffect(() => {
    if (open && solicitudId) {
      loadDocument();
    }

    if (!open) {
      setDocumento(null);
      setError(null);
    }
  }, [open, solicitudId]);

  const loadDocument = async () => {
    if (!solicitudId) return;

    setLoading(true);
    setError(null);
    try {
      const doc = await solicitudesService.getDeliveryDocument(solicitudId);
      setDocumento(doc);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Descargar PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!solicitudId || !documento?.tienePdf) return;

    setDownloading(true);
    try {
      const blob = await solicitudesService.downloadDeliveryPdf(solicitudId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documento.folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado exitosamente');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al descargar PDF: ${errorMessage}`);
    } finally {
      setDownloading(false);
    }
  }, [solicitudId, documento]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          <DocIcon color="primary" />
          <Typography variant="h6">
            Documento de Entrega COFEPRIS
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando documento...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && documento && (
          <>
            {/* Encabezado del documento */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" color="success.dark" fontWeight="bold">
                    {documento.folio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Solicitud: {documento.solicitudNumero}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                  <Chip
                    icon={<CheckIcon />}
                    label="ACTA FIRMADA"
                    color="success"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Información del paciente */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                INFORMACIÓN DEL PACIENTE
              </Typography>
              <Typography variant="body1">
                {documento.paciente?.nombre} {documento.paciente?.apellidoPaterno} {documento.paciente?.apellidoMaterno || ''}
              </Typography>
              {documento.paciente?.numeroExpediente && (
                <Typography variant="body2" color="text.secondary">
                  Expediente: {documento.paciente.numeroExpediente}
                </Typography>
              )}
            </Paper>

            {/* Productos verificados */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              PRODUCTOS VERIFICADOS
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(documento.itemsVerificados as Array<{
                    codigo: string;
                    nombre: string;
                    cantidad: number;
                    verificado: boolean;
                    observacion?: string;
                  }>).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {item.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell align="center">{item.cantidad}</TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<CheckIcon />}
                          label="Verificado"
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.observacion || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Firmas */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    FIRMA DEL ALMACENISTA
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body1" fontWeight="bold">
                    {documento.nombreAlmacenista}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <DateIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {documento.fechaFirmaAlmacenista && formatDate(documento.fechaFirmaAlmacenista)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckIcon />}
                    label="Firma digital registrada"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    FIRMA DEL RECEPTOR
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body1" fontWeight="bold">
                    {documento.nombreEnfermero}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <DateIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {documento.fechaFirmaEnfermero && formatDate(documento.fechaFirmaEnfermero)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckIcon />}
                    label="Firma digital registrada"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Observaciones */}
            {documento.observaciones && (
              <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'warning.light' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  OBSERVACIONES
                </Typography>
                <Typography variant="body1">{documento.observaciones}</Typography>
              </Paper>
            )}

            {/* Fecha de creación */}
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Documento generado el {formatDate(documento.createdAt)} - Cumplimiento COFEPRIS
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        {documento?.tienePdf && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadPdf}
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          >
            {downloading ? 'Descargando...' : 'Descargar PDF'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryDocumentViewer;
