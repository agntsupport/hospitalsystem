// ABOUTME: Componente de diálogo para detalle de hospitalización
// ABOUTME: Extraído de HospitalizationPage para mejorar mantenibilidad

import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box
} from '@mui/material';
import hospitalizationService from '@/services/hospitalizationService';
import { HospitalAdmission } from '@/types/hospitalization.types';

interface AdmissionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
}

const AdmissionDetailDialog: React.FC<AdmissionDetailDialogProps> = ({
  open,
  onClose,
  admission
}) => {
  if (!admission) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      closeAfterTransition={false}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            Detalle de Hospitalización
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {admission.paciente?.nombre || 'Paciente'} • {admission.numeroIngreso}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Información del Paciente
            </Typography>
            <Typography><strong>Nombre:</strong> {admission.paciente?.nombre || 'No especificado'}</Typography>
            <Typography><strong>Expediente:</strong> {admission.paciente?.numeroExpediente || 'No especificado'}</Typography>
            <Typography><strong>Edad:</strong> {admission.paciente?.edad ? `${admission.paciente.edad} años` : 'No especificada'}</Typography>
            <Typography><strong>Género:</strong> {admission.paciente?.genero || 'No especificado'}</Typography>
            <Typography><strong>Tipo de Sangre:</strong> {admission.paciente?.tipoSangre || 'No especificado'}</Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Contacto de Emergencia
            </Typography>
            <Typography><strong>Nombre:</strong> {admission.paciente.contactoEmergencia?.nombre || 'No especificado'}</Typography>
            <Typography><strong>Teléfono:</strong> {admission.paciente.contactoEmergencia?.telefono || 'No especificado'}</Typography>
            <Typography><strong>Relación:</strong> {admission.paciente.contactoEmergencia?.relacion || 'No especificado'}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Información del Ingreso
            </Typography>
            <Typography><strong>Fecha de Ingreso:</strong> {admission.fechaIngreso ? hospitalizationService.formatDateTime(admission.fechaIngreso, admission.horaIngreso || '00:00') : 'No especificada'}</Typography>
            <Typography><strong>Motivo:</strong> {admission.motivoIngreso}</Typography>
            <Typography><strong>Diagnóstico:</strong> {admission.diagnosticoIngreso}</Typography>
            <Typography><strong>Tipo:</strong> {hospitalizationService.formatAdmissionType(admission.tipoHospitalizacion)}</Typography>
            <Typography><strong>Especialidad:</strong> {admission.especialidad}</Typography>
            <Typography><strong>Estado General:</strong> {hospitalizationService.formatGeneralStatus(admission.estadoGeneral)}</Typography>
            <Typography><strong>Días de Estancia:</strong> {admission.diasEstancia}</Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Habitación y Médico
            </Typography>
            <Typography><strong>Habitación:</strong> {admission.habitacion?.numero || 'No asignada'} {admission.habitacion?.tipo ? `(${admission.habitacion.tipo})` : ''}</Typography>
            <Typography><strong>Médico Tratante:</strong> {admission.medicoTratante?.nombre || 'No asignado'}</Typography>
            <Typography><strong>Especialidad:</strong> {admission.medicoTratante?.especialidad || 'No especificada'}</Typography>
          </Grid>

          {admission.observacionesIngreso && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Observaciones
              </Typography>
              <Typography>{admission.observacionesIngreso}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(AdmissionDetailDialog);
