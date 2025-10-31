import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormHelperText
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

import { PatientFormValues } from '@/schemas/patients.schemas';
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPES } from '@/types/patients.types';

interface PersonalInfoStepProps {
  control: Control<PatientFormValues>;
  errors: FieldErrors<PatientFormValues>;
  formKey: string;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ control, errors, formKey }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Datos Personales
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`nombre-${formKey}`}
          name="nombre"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nombre *"
              required
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`apellidoPaterno-${formKey}`}
          name="apellidoPaterno"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Apellido Paterno *"
              required
              error={!!errors.apellidoPaterno}
              helperText={errors.apellidoPaterno?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`apellidoMaterno-${formKey}`}
          name="apellidoMaterno"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Apellido Materno"
              error={!!errors.apellidoMaterno}
              helperText={errors.apellidoMaterno?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`fechaNacimiento-${formKey}`}
          name="fechaNacimiento"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Fecha de Nacimiento *"
              type="date"
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.fechaNacimiento}
              helperText={errors.fechaNacimiento?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`genero-${formKey}`}
          name="genero"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={!!errors.genero}>
              <InputLabel>Género *</InputLabel>
              <Select
                {...field}
                label="Género *"
              >
                {Object.entries(GENDER_OPTIONS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.genero && (
                <FormHelperText>{errors.genero.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`tipoSangre-${formKey}`}
          name="tipoSangre"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.tipoSangre}>
              <InputLabel>Tipo de Sangre</InputLabel>
              <Select
                {...field}
                label="Tipo de Sangre"
              >
                <MenuItem value="">No especificado</MenuItem>
                {BLOOD_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.tipoSangre && (
                <FormHelperText>{errors.tipoSangre.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`estadoCivil-${formKey}`}
          name="estadoCivil"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.estadoCivil}>
              <InputLabel>Estado Civil</InputLabel>
              <Select
                {...field}
                label="Estado Civil"
              >
                {Object.entries(CIVIL_STATUS_OPTIONS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.estadoCivil && (
                <FormHelperText>{errors.estadoCivil.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`ocupacion-${formKey}`}
          name="ocupacion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Ocupación"
              error={!!errors.ocupacion}
              helperText={errors.ocupacion?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`religion-${formKey}`}
          name="religion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Religión"
              error={!!errors.religion}
              helperText={errors.religion?.message}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PersonalInfoStep;
