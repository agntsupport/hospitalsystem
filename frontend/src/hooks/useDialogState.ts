// ABOUTME: Hook genérico para manejo de estados de diálogos CRUD
// Reduce de ~14 estados a 1 estado unificado por página

import { useState, useCallback } from 'react';

/** Modos de operación del diálogo */
export type DialogMode = 'create' | 'edit' | 'view' | 'delete' | 'confirm';

/** Estado interno del diálogo */
export interface DialogState<T> {
  /** Si el diálogo está abierto */
  isOpen: boolean;
  /** Modo de operación actual */
  mode: DialogMode;
  /** Elemento seleccionado para la operación */
  selectedItem: T | null;
  /** Datos adicionales del contexto */
  metadata?: Record<string, unknown>;
}

/** Valor de retorno del hook */
export interface UseDialogStateReturn<T> {
  /** Estado actual del diálogo */
  state: DialogState<T>;
  /** Verdadero si el diálogo está abierto */
  isOpen: boolean;
  /** Modo actual de operación */
  mode: DialogMode;
  /** Elemento seleccionado */
  selectedItem: T | null;
  /** Abre el diálogo en modo crear */
  openCreate: (metadata?: Record<string, unknown>) => void;
  /** Abre el diálogo en modo editar con el item seleccionado */
  openEdit: (item: T, metadata?: Record<string, unknown>) => void;
  /** Abre el diálogo en modo ver detalles */
  openView: (item: T, metadata?: Record<string, unknown>) => void;
  /** Abre el diálogo en modo eliminar con confirmación */
  openDelete: (item: T, metadata?: Record<string, unknown>) => void;
  /** Abre el diálogo en modo confirmación genérica */
  openConfirm: (item: T, metadata?: Record<string, unknown>) => void;
  /** Cierra el diálogo manteniendo el estado */
  close: () => void;
  /** Cierra y resetea el estado completamente */
  reset: () => void;
  /** Verifica si el modo es el especificado */
  isMode: (checkMode: DialogMode) => boolean;
}

const initialState = <T>(): DialogState<T> => ({
  isOpen: false,
  mode: 'create',
  selectedItem: null,
  metadata: undefined
});

/**
 * Hook para manejo unificado de estados de diálogos CRUD
 *
 * @example
 * // Uso básico
 * const employeeDialog = useDialogState<Employee>();
 *
 * // Abrir para crear
 * <Button onClick={employeeDialog.openCreate}>Nuevo Empleado</Button>
 *
 * // Abrir para editar
 * <IconButton onClick={() => employeeDialog.openEdit(employee)}>
 *   <EditIcon />
 * </IconButton>
 *
 * // En el diálogo
 * <EmployeeFormDialog
 *   open={employeeDialog.isOpen}
 *   mode={employeeDialog.mode}
 *   employee={employeeDialog.selectedItem}
 *   onClose={employeeDialog.close}
 * />
 *
 * @example
 * // Uso con metadata adicional
 * employeeDialog.openEdit(employee, { source: 'table', previousPage: 1 });
 * console.log(employeeDialog.state.metadata); // { source: 'table', previousPage: 1 }
 *
 * @example
 * // Verificar modo actual
 * if (employeeDialog.isMode('edit')) {
 *   // Lógica específica para edición
 * }
 */
const useDialogState = <T>(): UseDialogStateReturn<T> => {
  const [state, setState] = useState<DialogState<T>>(initialState<T>());

  const openCreate = useCallback((metadata?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      mode: 'create',
      selectedItem: null,
      metadata
    });
  }, []);

  const openEdit = useCallback((item: T, metadata?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      mode: 'edit',
      selectedItem: item,
      metadata
    });
  }, []);

  const openView = useCallback((item: T, metadata?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      mode: 'view',
      selectedItem: item,
      metadata
    });
  }, []);

  const openDelete = useCallback((item: T, metadata?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      mode: 'delete',
      selectedItem: item,
      metadata
    });
  }, []);

  const openConfirm = useCallback((item: T, metadata?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      mode: 'confirm',
      selectedItem: item,
      metadata
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState<T>());
  }, []);

  const isMode = useCallback((checkMode: DialogMode): boolean => {
    return state.mode === checkMode;
  }, [state.mode]);

  return {
    state,
    isOpen: state.isOpen,
    mode: state.mode,
    selectedItem: state.selectedItem,
    openCreate,
    openEdit,
    openView,
    openDelete,
    openConfirm,
    close,
    reset,
    isMode
  };
};

export default useDialogState;
