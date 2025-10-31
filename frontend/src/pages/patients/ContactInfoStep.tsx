import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
  Grid,
  TextField,
  Typography,
  Divider,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { ContactPhone as ContactIcon, LocationOn as LocationIcon } from '@mui/icons-material';

import { PatientFormValues } from '@/schemas/patients.schemas';
import PostalCodeAutocomplete from '@/components/common/PostalCodeAutocomplete';

interface ContactInfoStepProps {
  control: Control<PatientFormValues>;
  errors: FieldErrors<PatientFormValues>;
  formKey: string;
  useAddressAutocomplete: boolean;
  setUseAddressAutocomplete: (value: boolean) => void;
  handleAddressSelected: (addressInfo: {
    codigoPostal: string;
    estado: string;
    ciudad: string;
    municipio: string;
    colonia?: string;
  }) => void;
  watchedValues: PatientFormValues;
  loading: boolean;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  control,
  errors,
  formKey,
  useAddressAutocomplete,
  setUseAddressAutocomplete,
  handleAddressSelected,
  watchedValues,
  loading
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContactIcon />
          Información de Contacto
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`telefono-${formKey}`}
          name="telefono"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Teléfono"
              error={!!errors.telefono}
              helperText={errors.telefono?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`email-${formKey}`}
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </Grid>

      {/* Sección de Dirección con Autocompletado */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon />
            Dirección y Ubicación
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setUseAddressAutocomplete(!useAddressAutocomplete)}
          >
            {useAddressAutocomplete ? 'Llenar Manual' : 'Usar Autocompletado'}
          </Button>
        </Box>
      </Grid>

      {useAddressAutocomplete ? (
        <Grid item xs={12}>
          <PostalCodeAutocomplete
            onAddressSelected={handleAddressSelected}
            initialPostalCode={watchedValues.codigoPostal}
            disabled={loading}
          />
        </Grid>
      ) : (
        <>
          <Grid item xs={12} md={4}>
            <Controller
              key={`codigoPostal-${formKey}`}
              name="codigoPostal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Código Postal"
                  placeholder="5 dígitos"
                  inputProps={{ maxLength: 5 }}
                  error={!!errors.codigoPostal}
                  helperText={errors.codigoPostal?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              key={`ciudad-${formKey}`}
              name="ciudad"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Ciudad"
                  error={!!errors.ciudad}
                  helperText={errors.ciudad?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              key={`estado-${formKey}`}
              name="estado"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Estado"
                  error={!!errors.estado}
                  helperText={errors.estado?.message}
                />
              )}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Controller
          key={`direccion-${formKey}`}
          name="direccion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Dirección Completa"
              placeholder="Calle, número, colonia..."
              multiline
              rows={2}
              error={!!errors.direccion}
              helperText={
                errors.direccion?.message ||
                (useAddressAutocomplete
                  ? "La colonia se completará automáticamente. Agrega calle y número."
                  : "Ingresa la dirección completa: calle, número, colonia"
                )
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Contacto de Emergencia
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`contacto-nombre-${formKey}`}
          name="contactoEmergencia.nombre"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nombre del Contacto"
              error={!!errors.contactoEmergencia?.nombre}
              helperText={errors.contactoEmergencia?.nombre?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          key={`contacto-telefono-${formKey}`}
          name="contactoEmergencia.telefono"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Teléfono del Contacto"
              error={!!errors.contactoEmergencia?.telefono}
              helperText={errors.contactoEmergencia?.telefono?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          key={`contacto-relacion-${formKey}`}
          name="contactoEmergencia.relacion"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.contactoEmergencia?.relacion}>
              <InputLabel>Relación</InputLabel>
              <Select
                {...field}
                label="Relación"
                value={field.value || ''}
              >
                <MenuItem value="">Seleccionar relación</MenuItem>
                <MenuItem value="padre">Padre</MenuItem>
                <MenuItem value="madre">Madre</MenuItem>
                <MenuItem value="hijo">Hijo</MenuItem>
                <MenuItem value="hija">Hija</MenuItem>
                <MenuItem value="conyuge">Cónyuge</MenuItem>
                <MenuItem value="hermano">Hermano</MenuItem>
                <MenuItem value="hermana">Hermana</MenuItem>
                <MenuItem value="abuelo">Abuelo</MenuItem>
                <MenuItem value="abuela">Abuela</MenuItem>
                <MenuItem value="tio">Tío</MenuItem>
                <MenuItem value="tia">Tía</MenuItem>
                <MenuItem value="primo">Primo</MenuItem>
                <MenuItem value="prima">Prima</MenuItem>
                <MenuItem value="amigo">Amigo</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
              {errors.contactoEmergencia?.relacion && (
                <FormHelperText>{errors.contactoEmergencia.relacion.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default ContactInfoStep;
