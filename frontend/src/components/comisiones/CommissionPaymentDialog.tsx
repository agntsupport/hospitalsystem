// ABOUTME: Diálogo para pagar comisiones con firma del médico y admin.
// ABOUTME: Incluye captura de firma digital y genera PDF de comprobante.

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Draw as DrawIcon,
  PictureAsPdf as PdfIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import SignaturePad, { SignaturePadRef } from '../common/SignaturePad';
import comisionesService, { ComisionMedica } from '../../services/comisionesService';

interface CommissionPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comision: ComisionMedica | null;
}

const CommissionPaymentDialog: React.FC<CommissionPaymentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  comision,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [nombreMedico, setNombreMedico] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [firmaMedicoConfirmada, setFirmaMedicoConfirmada] = useState(false);
  const [firmaAdminConfirmada, setFirmaAdminConfirmada] = useState(false);

  const firmaMedicoRef = useRef<SignaturePadRef>(null);
  const firmaAdminRef = useRef<SignaturePadRef>(null);

  // Inicializar nombre del médico
  useEffect(() => {
    if (open && comision) {
      setNombreMedico(comision.nombreMedico || '');
      setActiveStep(comision.firmaMedico ? 1 : 0);
      setFirmaMedicoConfirmada(!!comision.firmaMedico);
    }

    if (!open) {
      setNombreMedico('');
      setNombreAdmin('');
      setFirmaMedicoConfirmada(false);
      setFirmaAdminConfirmada(false);
      setActiveStep(0);
    }
  }, [open, comision]);

  // Manejar cambio de firma del médico
  const handleFirmaMedicoChange = useCallback((signature: string | null) => {
    setFirmaMedicoConfirmada(!!signature);
  }, []);

  // Manejar cambio de firma del admin
  const handleFirmaAdminChange = useCallback((signature: string | null) => {
    setFirmaAdminConfirmada(!!signature);
  }, []);

  // Firmar como médico (Paso 1)
  const handleFirmarMedico = useCallback(async () => {
    if (!comision || !nombreMedico.trim()) return;

    const firmaMedico = firmaMedicoRef.current?.getSignature();
    if (!firmaMedico) {
      toast.error('La firma del médico es requerida');
      return;
    }

    setLoading(true);
    try {
      await comisionesService.firmarMedico(comision.id, firmaMedico, nombreMedico.trim());
      toast.success('Firma del médico registrada');
      setActiveStep(1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al registrar firma: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [comision, nombreMedico]);

  // Pagar comisión (Paso 2)
  const handlePagarComision = useCallback(async () => {
    if (!comision || !nombreAdmin.trim()) return;

    const firmaAdmin = firmaAdminRef.current?.getSignature();
    if (!firmaAdmin) {
      toast.error('La firma del administrador es requerida');
      return;
    }

    setLoading(true);
    try {
      await comisionesService.pagarComision(comision.id, firmaAdmin, nombreAdmin.trim());
      toast.success('Comisión pagada exitosamente');
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al pagar comisión: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [comision, nombreAdmin, onSuccess]);

  if (!comision) {
    return null;
  }

  const steps = ['Firma del Médico', 'Firma del Administrador y Pago'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon color="success" />
          <Typography variant="h6">
            Pagar Comisión Médica
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información de la comisión */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Médico:</strong> {comision.nombreMedico}
              </Typography>
              {comision.especialidad && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Especialidad:</strong> {comision.especialidad}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Periodo:</strong> {comisionesService.formatPeriodo(comision.fechaInicio, comision.fechaFin)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Cuentas:</strong> {comision.totalCuentas}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h5" color="success.dark" fontWeight="bold">
                Monto a Pagar: {comisionesService.formatCurrency(comision.montoComision)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({comision.porcentaje}% de {comisionesService.formatCurrency(comision.montoFacturado)} facturados)
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep || (index === 0 && !!comision.firmaMedico)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Paso 1: Firma del Médico */}
        {activeStep === 0 && !comision.firmaMedico && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                El médico debe firmar para confirmar la recepción de la comisión correspondiente al periodo.
              </Typography>
            </Alert>

            <TextField
              label="Nombre completo del médico"
              value={nombreMedico}
              onChange={(e) => setNombreMedico(e.target.value)}
              fullWidth
              required
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <SignaturePad
              ref={firmaMedicoRef}
              label="Firma del Médico"
              width={400}
              height={150}
              onSignatureChange={handleFirmaMedicoChange}
              disabled={loading}
              required
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFirmarMedico}
                disabled={!nombreMedico.trim() || !firmaMedicoConfirmada || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DrawIcon />}
              >
                {loading ? 'Firmando...' : 'Registrar Firma del Médico'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 2: Firma del Admin y Pago */}
        {(activeStep === 1 || comision.firmaMedico) && (
          <Box>
            {comision.firmaMedico && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon />
                  <Typography variant="body2">
                    Firma del médico registrada el {comision.fechaFirmaMedico && comisionesService.formatDate(comision.fechaFirmaMedico)}
                  </Typography>
                </Box>
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                El administrador firma para autorizar el pago de la comisión.
                Se generará un comprobante PDF archivado automáticamente.
              </Typography>
            </Alert>

            <TextField
              label="Nombre completo del administrador"
              value={nombreAdmin}
              onChange={(e) => setNombreAdmin(e.target.value)}
              fullWidth
              required
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <SignaturePad
              ref={firmaAdminRef}
              label="Firma del Administrador"
              width={400}
              height={150}
              onSignatureChange={handleFirmaAdminChange}
              disabled={loading}
              required
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        {(activeStep === 1 || comision.firmaMedico) && (
          <Button
            variant="contained"
            color="success"
            onClick={handlePagarComision}
            disabled={!nombreAdmin.trim() || !firmaAdminConfirmada || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
          >
            {loading ? 'Procesando Pago...' : 'Autorizar Pago y Generar Comprobante'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CommissionPaymentDialog;
