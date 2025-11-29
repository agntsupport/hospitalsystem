import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { Patient } from '@/types/patients.types';
import { usePatientForm } from '@/hooks/usePatientForm';
import PersonalInfoStep from './PersonalInfoStep';
import ContactInfoStep from './ContactInfoStep';
import MedicalInfoStep from './MedicalInfoStep';

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onPatientCreated: () => void;
  editingPatient?: Patient | null;
}

const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  onClose,
  onPatientCreated,
  editingPatient,
}) => {
  const {
    activeStep,
    loading,
    error,
    useAddressAutocomplete,
    setUseAddressAutocomplete,
    control,
    handleSubmit,
    errors,
    watchedValues,
    formKey,
    resetForm,
    handleAddressSelected,
    handleNext,
    handleBack,
    onFormSubmit
  } = usePatientForm(open, editingPatient, onPatientCreated, onClose);

  const steps = useMemo(() => [
    'Datos Personales',
    'Información de Contacto',
    'Información Médica'
  ], []);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoStep
            control={control}
            errors={errors}
            formKey={formKey}
          />
        );
      case 1:
        return (
          <ContactInfoStep
            control={control}
            errors={errors}
            formKey={formKey}
            useAddressAutocomplete={useAddressAutocomplete}
            setUseAddressAutocomplete={setUseAddressAutocomplete}
            handleAddressSelected={handleAddressSelected}
            watchedValues={watchedValues}
            loading={loading}
          />
        );
      case 2:
        return (
          <MedicalInfoStep
            control={control}
            errors={errors}
            formKey={formKey}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      key={editingPatient?.id || 'new'}
    >
      <DialogTitle>
        {editingPatient ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { resetForm(); onClose(); }} disabled={loading}>
          <CancelIcon sx={{ mr: 1 }} />
          Cancelar
        </Button>

        <Box sx={{ flex: '1 1 auto' }} />

        {activeStep !== 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        )}

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit(async (validatedData) => {
              await onFormSubmit(validatedData);
            })}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading
              ? (editingPatient ? 'Actualizando...' : 'Guardando...')
              : (editingPatient ? 'Actualizar Paciente' : 'Guardar Paciente')
            }
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatientFormDialog;
