/**
 * Campo de texto controlado reutilizable
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField } from '@mui/material';
import { ControlledTextFieldProps } from '@/types/forms.types';

const ControlledTextField: React.FC<ControlledTextFieldProps> = ({
  name,
  control,
  label,
  required = false,
  disabled = false,
  fullWidth = true,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 1,
  maxLength,
  inputProps,
  ...rest
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={required ? `${label} *` : label}
          type={type}
          placeholder={placeholder}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          fullWidth={fullWidth}
          required={required}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{
            maxLength,
            ...inputProps
          }}
          {...rest}
        />
      )}
    />
  );
};

export default ControlledTextField;