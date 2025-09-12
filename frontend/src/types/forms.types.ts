/**
 * Tipos base para formularios de diálogos
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

// Interface base para todos los formularios de dialog
export interface BaseFormDialogProps<T = any> {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entity?: T | null;
}

// Estados comunes de formularios
export interface BaseFormState {
  loading: boolean;
  error: string | null;
}

// Configuración base para useForm
export interface BaseFormConfig<T = any> {
  schema: any; // Yup schema
  defaultValues: T;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

// Props para campos controlados reutilizables
export interface BaseFieldProps {
  name: string;
  control: any; // Control de react-hook-form
  label: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

// Extender BaseFieldProps para TextField
export interface ControlledTextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  inputProps?: any;
}

// Extender BaseFieldProps para Select
export interface ControlledSelectProps extends BaseFieldProps {
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  emptyLabel?: string;
  multiple?: boolean;
}

// Extender BaseFieldProps para Autocomplete
export interface ControlledAutocompleteProps extends BaseFieldProps {
  options: Array<any>;
  getOptionLabel?: (option: any) => string;
  getOptionValue?: (option: any) => any;
  loading?: boolean;
  onInputChange?: (value: string) => void;
}

// Configuración para dialogs
export interface BaseDialogConfig {
  title: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  fullScreen?: boolean;
}

// Props para botones de acción
export interface DialogActionsProps {
  loading?: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  disabled?: boolean;
}