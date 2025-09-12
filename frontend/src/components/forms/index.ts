/**
 * Índice de componentes de formularios reutilizables
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

export { default as ControlledTextField } from './ControlledTextField';
export { default as ControlledSelect } from './ControlledSelect';
export { default as FormDialog, DefaultFormActions } from './FormDialog';

// Re-exportar tipos
export type {
  BaseFormDialogProps,
  BaseFormState,
  BaseFormConfig,
  BaseFieldProps,
  ControlledTextFieldProps,
  ControlledSelectProps,
  BaseDialogConfig,
  DialogActionsProps
} from '@/types/forms.types';

// Re-exportar hooks
export { default as useBaseFormDialog } from '@/hooks/useBaseFormDialog';