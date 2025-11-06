import { renderHook, act, waitFor } from '@testing-library/react';
import { useBaseFormDialog } from '../useBaseFormDialog';
import * as yup from 'yup';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('react-toastify');

const mockedToast = toast as jest.Mocked<typeof toast>;

// Mock schema de validación
const mockSchema = yup.object({
  nombre: yup.string().required('Nombre requerido').min(3, 'Mínimo 3 caracteres'),
  email: yup.string().email('Email inválido'),
  edad: yup.number().positive('Edad debe ser positiva').min(18, 'Mínimo 18 años')
});

interface MockFormData {
  nombre: string;
  email: string;
  edad: number;
}

const defaultValues: MockFormData = {
  nombre: '',
  email: '',
  edad: 18
};

describe('useBaseFormDialog', () => {
  const mockOnSuccess = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State - Create Mode', () => {
    it('should initialize with default values when creating new entity', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isEditing).toBe(false);
      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it('should use provided default values', () => {
      const customDefaults = {
        nombre: 'Test',
        email: 'test@test.com',
        edad: 25
      };

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues: customDefaults,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const values = result.current.watch();

      waitFor(() => {
        expect(values.nombre).toBe('Test');
        expect(values.email).toBe('test@test.com');
        expect(values.edad).toBe(25);
      });
    });

    it('should reset to default values when dialog opens', () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: false } }
      );

      act(() => {
        result.current.setValue('nombre', 'Changed');
      });

      rerender({ open: true });

      waitFor(() => {
        const values = result.current.watch();
        expect(values.nombre).toBe('');
      });
    });

    it('should clear error when dialog opens', () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setError('Some error');
      });

      rerender({ open: false });
      rerender({ open: true });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Initial State - Edit Mode', () => {
    const mockEntity = {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      edad: 30
    };

    it('should initialize with entity data when editing', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: mockEntity,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.isEditing).toBe(true);

      waitFor(() => {
        const values = result.current.watch();
        expect(values.nombre).toBe('Juan Pérez');
        expect(values.email).toBe('juan@example.com');
        expect(values.edad).toBe(30);
      });
    });

    it('should detect edit mode when entity is provided', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: mockEntity,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.isEditing).toBe(true);
    });

    it('should switch from create to edit mode', () => {
      const { result, rerender } = renderHook(
        ({ entity }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open: true,
            entity,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { entity: null as any } }
      );

      expect(result.current.isEditing).toBe(false);

      rerender({ entity: mockEntity });

      waitFor(() => {
        expect(result.current.isEditing).toBe(true);
      });
    });
  });

  describe('Form Submission - Success', () => {
    it('should submit form successfully in create mode', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 1 },
        message: 'Created successfully'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(formData);
        expect(mockedToast.success).toHaveBeenCalledWith('Elemento creado exitosamente');
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should submit form successfully in edit mode', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 1 },
        message: 'Updated successfully'
      });

      const mockEntity = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: mockEntity,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan Updated',
        email: 'juan.new@test.com',
        edad: 26
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(formData);
        expect(mockedToast.success).toHaveBeenCalledWith('Elemento actualizado exitosamente');
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should set loading state during submission', async () => {
      const mockApiCall = jest.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true, data: {}, message: 'Success' }), 100)
        )
      );

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      act(() => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        submitHandler(formData);
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error before submission', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        success: true,
        data: {},
        message: 'Success'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Form Submission - Error Handling', () => {
    it('should handle API error with message', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        success: false,
        data: null,
        message: 'Validation failed'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Validation failed');
        expect(mockedToast.error).toHaveBeenCalledWith('Validation failed');
        expect(mockOnSuccess).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should handle network error', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({
        message: 'Network error'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(mockedToast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle error with error property', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({
        error: 'Custom error message'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Custom error message');
      });
    });

    it('should handle error from response data', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({
        response: { data: { message: 'Server error' } }
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Server error');
      });
    });

    it('should handle unknown error format', async () => {
      const mockApiCall = jest.fn().mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Error desconocido en la operación');
      });
    });

    it('should set loading to false after error', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({
        message: 'Error'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('resetForm', () => {
    it('should reset form to default values', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setValue('nombre', 'Changed');
        result.current.setValue('email', 'changed@test.com');
      });

      act(() => {
        result.current.resetForm();
      });

      waitFor(() => {
        const values = result.current.watch();
        expect(values.nombre).toBe('');
        expect(values.email).toBe('');
      });
    });

    it('should clear error on reset', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading to false on reset', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Dialog State Management', () => {
    it('should reset form when dialog closes', () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setValue('nombre', 'Test');
      });

      rerender({ open: false });

      waitFor(() => {
        const values = result.current.watch();
        expect(values.nombre).toBe('');
      });
    });

    it('should clear loading state when dialog closes', () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setLoading(true);
      });

      rerender({ open: false });

      expect(result.current.loading).toBe(false);
    });

    it('should clear error state when dialog closes', () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setError('Error message');
      });

      rerender({ open: false });

      expect(result.current.error).toBeNull();
    });

    it('should reload entity data when reopening in edit mode', () => {
      const mockEntity = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      const { result, rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: mockEntity,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setValue('nombre', 'Changed');
      });

      rerender({ open: false });
      rerender({ open: true });

      waitFor(() => {
        const values = result.current.watch();
        expect(values.nombre).toBe('Juan');
      });
    });
  });

  describe('Form Validation', () => {
    it('should provide validation trigger function', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.trigger).toBeDefined();
      expect(typeof result.current.trigger).toBe('function');
    });

    it('should provide form state with errors', async () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      await act(async () => {
        result.current.setValue('nombre', 'AB'); // Too short
        await result.current.trigger('nombre');
      });

      await waitFor(() => {
        expect(result.current.formState.errors.nombre).toBeDefined();
      });
    });

    it('should validate on different modes', () => {
      const modes = ['onChange', 'onBlur', 'onSubmit'] as const;

      modes.forEach(mode => {
        const { result } = renderHook(() =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            mode,
            open: true,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          })
        );

        expect(result.current.control).toBeDefined();
      });
    });
  });

  describe('Form Control', () => {
    it('should provide setValue function', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setValue('nombre', 'New Value');
      });

      const values = result.current.watch();
      expect(values.nombre).toBe('New Value');
    });

    it('should provide watch function', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      act(() => {
        result.current.setValue('email', 'test@test.com');
      });

      const email = result.current.watch('email');
      expect(email).toBe('test@test.com');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.reset).toBeDefined();
      expect(typeof result.current.reset).toBe('function');
    });

    it('should provide handleSubmit function', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.handleSubmit).toBeDefined();
      expect(typeof result.current.handleSubmit).toBe('function');
    });
  });

  describe('Loading State Management', () => {
    it('should allow manual loading state control', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error State Management', () => {
    it('should allow manual error state control', () => {
      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Custom error');
      });

      expect(result.current.error).toBe('Custom error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close cycles', () => {
      const { rerender } = renderHook(
        ({ open }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open,
            entity: null,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { open: true } }
      );

      rerender({ open: false });
      rerender({ open: true });
      rerender({ open: false });
      rerender({ open: true });

      // Should not crash
      expect(true).toBe(true);
    });

    it('should handle switching between create and edit modes', () => {
      const mockEntity = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      const { result, rerender } = renderHook(
        ({ entity }) =>
          useBaseFormDialog({
            schema: mockSchema,
            defaultValues,
            open: true,
            entity,
            onSuccess: mockOnSuccess,
            onClose: mockOnClose
          }),
        { initialProps: { entity: null as any } }
      );

      expect(result.current.isEditing).toBe(false);

      rerender({ entity: mockEntity });
      expect(result.current.isEditing).toBe(true);

      rerender({ entity: null });
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle empty entity object', () => {
      const emptyEntity = {
        nombre: '',
        email: '',
        edad: 0
      };

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: emptyEntity,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      // Empty entity should still trigger edit mode
      expect(result.current.isEditing).toBe(true);
    });

    it('should handle multiple consecutive submissions', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        success: true,
        data: {},
        message: 'Success'
      });

      const { result } = renderHook(() =>
        useBaseFormDialog({
          schema: mockSchema,
          defaultValues,
          open: true,
          entity: null,
          onSuccess: mockOnSuccess,
          onClose: mockOnClose
        })
      );

      const formData = {
        nombre: 'Juan',
        email: 'juan@test.com',
        edad: 25
      };

      await act(async () => {
        const submitHandler = result.current.handleFormSubmit(mockApiCall);
        await submitHandler(formData);
        await submitHandler(formData);
        await submitHandler(formData);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(3);
      });
    });
  });
});
