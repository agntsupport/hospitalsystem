/**
 * Campo select controlado reutilizable
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

import React from 'react';
import { Controller } from 'react-hook-form';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { ControlledSelectProps } from '@/types/forms.types';

const ControlledSelect: React.FC<ControlledSelectProps> = ({
  name,
  control,
  label,
  options,
  required = false,
  disabled = false,
  fullWidth = true,
  emptyLabel = 'Seleccionar...',
  multiple = false,
  ...rest
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth={fullWidth} error={!!fieldState.error} disabled={disabled}>
          <InputLabel>{required ? `${label} *` : label}</InputLabel>
          <Select
            {...field}
            label={required ? `${label} *` : label}
            multiple={multiple}
            value={field.value || (multiple ? [] : '')}
            {...rest}
          >
            {!multiple && !required && (
              <MenuItem value="">
                <em>{emptyLabel}</em>
              </MenuItem>
            )}
            {options.map((option) => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default ControlledSelect;