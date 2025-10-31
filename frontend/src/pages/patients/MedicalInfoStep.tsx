import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
  Grid,
  TextField,
  Typography,
  Divider
} from '@mui/material';
import { MedicalServices as MedicalIcon } from '@mui/icons-material';

import { PatientFormValues } from '@/schemas/patients.schemas';

interface MedicalInfoStepProps {
  control: Control<PatientFormValues>;
  errors: FieldErrors<PatientFormValues>;
  formKey: string;
}

const MedicalInfoStep: React.FC<MedicalInfoStepProps> = ({ control, errors, formKey }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalIcon />
          Información Médica
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          key={`alergias-${formKey}`}
          name="alergias"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Alergias"
              multiline
              rows={2}
              placeholder="Describa las alergias conocidas..."
              error={!!errors.alergias}
              helperText={errors.alergias?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          key={`medicamentosActuales-${formKey}`}
          name="medicamentosActuales"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Medicamentos Actuales"
              multiline
              rows={2}
              placeholder="Liste los medicamentos que toma actualmente..."
              error={!!errors.medicamentosActuales}
              helperText={errors.medicamentosActuales?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          key={`antecedentesPatologicos-${formKey}`}
          name="antecedentesPatologicos"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Antecedentes Patológicos"
              multiline
              rows={3}
              placeholder="Enfermedades o cirugías previas..."
              error={!!errors.antecedentesPatologicos}
              helperText={errors.antecedentesPatologicos?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          key={`antecedentesFamiliares-${formKey}`}
          name="antecedentesFamiliares"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Antecedentes Familiares"
              multiline
              rows={3}
              placeholder="Enfermedades hereditarias en la familia..."
              error={!!errors.antecedentesFamiliares}
              helperText={errors.antecedentesFamiliares?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Seguro Médico (Opcional)
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`seguroMedico.aseguradora-${formKey}`}
          name="seguroMedico.aseguradora"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Aseguradora"
              error={!!errors.seguroMedico?.aseguradora}
              helperText={errors.seguroMedico?.aseguradora?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`seguroMedico.numeroPoliza-${formKey}`}
          name="seguroMedico.numeroPoliza"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Número de Póliza"
              error={!!errors.seguroMedico?.numeroPoliza}
              helperText={errors.seguroMedico?.numeroPoliza?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`seguroMedico.vigencia-${formKey}`}
          name="seguroMedico.vigencia"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Vigencia"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors.seguroMedico?.vigencia}
              helperText={errors.seguroMedico?.vigencia?.message}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default MedicalInfoStep;
