/**
 * Hook base para formularios de diálogos
 * Sistema de Gestión Hospitalaria
 * Desarrollado por: Alfredo Manuel Reyes - agnt_ Software Development Company
 */

import { useEffect, useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { BaseFormConfig, BaseFormState } from '@/types/forms.types';

interface UseBaseFormDialogProps<T extends FieldValues> extends BaseFormConfig<T> {
  open: boolean;
  entity?: T | null;
  onSuccess: () => void;
  onClose: () => void;
}

interface UseBaseFormDialogReturn<T extends FieldValues> {
  // React Hook Form
  control: any;
  handleSubmit: any;
  reset: any;
  watch: any;
  setValue: any;
  trigger: any;
  formState: any;
  
  // Estado del formulario
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  
  // Funciones de utilidad
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleFormSubmit: (apiCall: (data: T) => Promise<any>) => (data: T) => Promise<void>;
  resetForm: () => void;
}

export const useBaseFormDialog = <T extends FieldValues = any>({
  schema,
  defaultValues,
  mode = 'onChange',
  open,
  entity,
  onSuccess,
  onClose
}: UseBaseFormDialogProps<T>): UseBaseFormDialogReturn<T> => {
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = !!entity;

  // Configurar React Hook Form
  const form = useForm<T>({
    resolver: yupResolver(schema) as any,
    defaultValues: defaultValues as any,
    mode
  });

  const { control, handleSubmit, reset, watch, setValue, trigger, formState } = form;

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setError(null);
      
      if (entity) {
        // Modo edición: cargar datos del entity
        reset(entity as T);
      } else {
        // Modo creación: usar valores por defecto
        reset(defaultValues);
      }
    } else {
      // Resetear cuando se cierra
      reset(defaultValues);
      setError(null);
      setLoading(false);
    }
  }, [open, entity, reset, defaultValues]);

  // Función para manejar submit del formulario
  const handleFormSubmit = (apiCall: (data: T) => Promise<any>) => 
    async (data: T) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall(data);

        if (response.success) {
          const actionText = isEditing ? 'actualizado' : 'creado';
          toast.success(`Elemento ${actionText} exitosamente`);
          onSuccess();
          onClose();
        } else {
          throw new Error(response.message || 'Error en la operación');
        }
      } catch (error: any) {
        console.error('❌ Error en el formulario:', error);
        
        const errorMessage = error?.message || 
                            error?.error || 
                            error?.response?.data?.message ||
                            'Error desconocido en la operación';
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

  // Función para resetear formulario
  const resetForm = () => {
    reset(defaultValues);
    setError(null);
    setLoading(false);
  };

  return {
    // React Hook Form
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState,
    
    // Estado del formulario
    loading,
    error,
    isEditing,
    
    // Funciones de utilidad
    setLoading,
    setError,
    handleFormSubmit,
    resetForm
  };
};

export default useBaseFormDialog;