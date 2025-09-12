/**
 * Componente base para diálogos de formularios
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { BaseDialogConfig, DialogActionsProps } from '@/types/forms.types';

interface FormDialogProps extends BaseDialogConfig {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  error?: string | null;
  loading?: boolean;
  isEditing?: boolean;
}

interface DefaultActionsProps extends DialogActionsProps {
  isEditing?: boolean;
}

// Componente principal del diálogo
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  error,
  loading = false,
  isEditing = false,
  maxWidth = 'md',
  fullWidth = true,
  fullScreen = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      closeAfterTransition={false}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isEditing ? <EditIcon /> : <AddIcon />}
        {title}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

// Componente para acciones por defecto
export const DefaultFormActions: React.FC<DefaultActionsProps> = ({
  loading = false,
  onCancel,
  onSubmit,
  cancelText = 'Cancelar',
  submitText,
  disabled = false,
  isEditing = false
}) => {
  const defaultSubmitText = isEditing ? 'Actualizar' : 'Crear';
  const finalSubmitText = submitText || defaultSubmitText;

  return (
    <>
      <Button 
        onClick={onCancel} 
        disabled={loading}
        startIcon={<CancelIcon />}
      >
        {cancelText}
      </Button>
      
      <Box sx={{ flex: '1 1 auto' }} />
      
      {onSubmit && (
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || disabled}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : finalSubmitText}
        </Button>
      )}
    </>
  );
};

export default FormDialog;