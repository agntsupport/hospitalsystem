// ABOUTME: Hook centralizado para notificaciones UI usando react-toastify como estándar único
// Reemplaza el uso inconsistente de Alert/Snackbar por toast unificado

import { useCallback } from 'react';
import { toast, ToastOptions, Id } from 'react-toastify';

interface NotificationOptions extends Partial<ToastOptions> {
  /** Duración en ms (default: 5000 para error, 3000 para otros) */
  duration?: number;
}

interface UseNotificationReturn {
  /** Muestra notificación de éxito */
  showSuccess: (message: string, options?: NotificationOptions) => Id;
  /** Muestra notificación de error */
  showError: (message: string, options?: NotificationOptions) => Id;
  /** Muestra notificación de advertencia */
  showWarning: (message: string, options?: NotificationOptions) => Id;
  /** Muestra notificación informativa */
  showInfo: (message: string, options?: NotificationOptions) => Id;
  /** Muestra notificación de carga con promesa */
  showLoading: (message: string) => Id;
  /** Actualiza una notificación existente */
  updateToast: (toastId: Id, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  /** Descarta una notificación específica */
  dismiss: (toastId?: Id) => void;
  /** Descarta todas las notificaciones */
  dismissAll: () => void;
}

/**
 * Hook centralizado para manejo de notificaciones UI
 * @example
 * const { showSuccess, showError } = useNotification();
 *
 * // Uso básico
 * showSuccess('Operación completada');
 * showError('Ocurrió un error');
 *
 * // Con opciones personalizadas
 * showWarning('Datos incompletos', { duration: 5000 });
 *
 * // Notificación de carga con actualización
 * const toastId = showLoading('Guardando...');
 * // ... después de completar operación async
 * updateToast(toastId, 'Guardado exitosamente', 'success');
 */
export const useNotification = (): UseNotificationReturn => {
  const showSuccess = useCallback((message: string, options?: NotificationOptions): Id => {
    return toast.success(message, {
      position: 'top-right',
      autoClose: options?.duration ?? 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showError = useCallback((message: string, options?: NotificationOptions): Id => {
    return toast.error(message, {
      position: 'top-right',
      autoClose: options?.duration ?? 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showWarning = useCallback((message: string, options?: NotificationOptions): Id => {
    return toast.warning(message, {
      position: 'top-right',
      autoClose: options?.duration ?? 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showInfo = useCallback((message: string, options?: NotificationOptions): Id => {
    return toast.info(message, {
      position: 'top-right',
      autoClose: options?.duration ?? 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showLoading = useCallback((message: string): Id => {
    return toast.loading(message, {
      position: 'top-right'
    });
  }, []);

  const updateToast = useCallback((
    toastId: Id,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ): void => {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      autoClose: type === 'error' ? 5000 : 3000,
      hideProgressBar: false,
      closeOnClick: true
    });
  }, []);

  const dismiss = useCallback((toastId?: Id): void => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  }, []);

  const dismissAll = useCallback((): void => {
    toast.dismiss();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateToast,
    dismiss,
    dismissAll
  };
};

export default useNotification;
