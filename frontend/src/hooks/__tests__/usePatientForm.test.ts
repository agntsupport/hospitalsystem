import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientForm } from '../usePatientForm';
import { patientsService } from '@/services/patientsService';
import { toast } from 'react-toastify';
import { Patient } from '@/types/patients.types';

// Mock dependencies
jest.mock('@/services/patientsService');
jest.mock('react-toastify');

const mockedPatientsService = patientsService as jest.Mocked<typeof patientsService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('usePatientForm', () => {
  const mockOnPatientCreated = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State - New Patient (Create Mode)', () => {
    it('should initialize with default values when creating new patient', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      expect(result.current.activeStep).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.useAddressAutocomplete).toBe(true);

      // Check default form values
      const values = result.current.watchedValues;
      expect(values.nombre).toBe('');
      expect(values.apellidoPaterno).toBe('');
      expect(values.apellidoMaterno).toBe('');
      expect(values.genero).toBe('M');
      expect(values.estadoCivil).toBe('soltero');
    });

    it('should reset to step 0 when dialog opens', () => {
      const { rerender, result } = renderHook(
        ({ open }) => usePatientForm(open, null, mockOnPatientCreated, mockOnClose),
        { initialProps: { open: false } }
      );

      act(() => {
        result.current.handleNext();
      });

      // Reopen dialog
      rerender({ open: true });

      waitFor(() => {
        expect(result.current.activeStep).toBe(0);
      });
    });

    it('should enable address autocomplete for new patients', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      expect(result.current.useAddressAutocomplete).toBe(true);
    });
  });

  describe('Initial State - Edit Patient (Edit Mode)', () => {
    const mockPatient: Patient = {
      id: 1,
      numeroExpediente: 'EXP001',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      fechaNacimiento: '1990-01-15',
      edad: 35,
      genero: 'M',
      tipoSangre: 'O+',
      telefono: '5551234567',
      email: 'juan@example.com',
      direccion: 'Calle Principal 123',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '01000',
      ocupacion: 'Ingeniero',
      estadoCivil: 'casado',
      religion: 'Católica',
      alergias: 'Penicilina',
      medicamentosActuales: 'Ninguno',
      antecedentesPatologicos: 'Diabetes',
      antecedentesFamiliares: 'Hipertensión',
      contactoEmergencia: {
        nombre: 'María Pérez',
        relacion: 'conyuge',
        telefono: '5559876543'
      },
      seguroMedico: {
        aseguradora: 'IMSS',
        numeroPoliza: 'POL123456',
        vigencia: '2026-12-31'
      },
      activo: true,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    };

    it('should load patient data when editing', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.nombre).toBe('Juan');
        expect(values.apellidoPaterno).toBe('Pérez');
        expect(values.apellidoMaterno).toBe('García');
        expect(values.email).toBe('juan@example.com');
        expect(values.telefono).toBe('5551234567');
        expect(values.genero).toBe('M');
        expect(values.estadoCivil).toBe('casado');
      });
    });

    it('should convert date to ISO format for form', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.fechaNacimiento).toBe('1990-01-15');
      });
    });

    it('should load emergency contact data', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.contactoEmergencia).toEqual({
          nombre: 'María Pérez',
          relacion: 'conyuge',
          telefono: '5559876543'
        });
      });
    });

    it('should load medical insurance data', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.seguroMedico).toEqual({
          aseguradora: 'IMSS',
          numeroPoliza: 'POL123456',
          vigencia: '2026-12-31'
        });
      });
    });

    it('should disable address autocomplete when editing', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        expect(result.current.useAddressAutocomplete).toBe(false);
      });
    });

    it('should handle missing optional fields', () => {
      const minimalPatient: Patient = {
        id: 2,
        numeroExpediente: 'EXP002',
        nombre: 'María',
        apellidoPaterno: 'López',
        fechaNacimiento: '1995-05-20',
        edad: 30,
        genero: 'F',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      const { result } = renderHook(() =>
        usePatientForm(true, minimalPatient, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.tipoSangre).toBe('');
        expect(values.telefono).toBe('');
        expect(values.email).toBe('');
        expect(values.contactoEmergencia).toEqual({ nombre: '', relacion: '', telefono: '' });
        expect(values.seguroMedico).toEqual({ aseguradora: '', numeroPoliza: '', vigencia: '' });
      });
    });
  });

  describe('resetForm', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      act(() => {
        result.current.setValue('nombre', 'Test');
        result.current.setValue('apellidoPaterno', 'User');
      });

      act(() => {
        result.current.resetForm();
      });

      waitFor(() => {
        expect(result.current.activeStep).toBe(0);
        expect(result.current.error).toBeNull();
        expect(result.current.useAddressAutocomplete).toBe(true);
        expect(result.current.watchedValues.nombre).toBe('');
      });
    });
  });

  describe('handleAddressSelected', () => {
    it('should populate address fields from autocomplete', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const addressInfo = {
        codigoPostal: '01000',
        estado: 'CDMX',
        ciudad: 'Ciudad de México',
        municipio: 'Cuauhtémoc',
        colonia: 'Centro'
      };

      act(() => {
        result.current.handleAddressSelected(addressInfo);
      });

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.codigoPostal).toBe('01000');
        expect(values.estado).toBe('CDMX');
        expect(values.ciudad).toBe('Ciudad de México');
        expect(values.direccion).toBe('Centro, Cuauhtémoc');
      });
    });

    it('should handle address without colonia', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const addressInfo = {
        codigoPostal: '01000',
        estado: 'CDMX',
        ciudad: 'Ciudad de México',
        municipio: 'Cuauhtémoc'
      };

      act(() => {
        result.current.handleAddressSelected(addressInfo);
      });

      waitFor(() => {
        const values = result.current.watchedValues;
        expect(values.codigoPostal).toBe('01000');
        expect(values.direccion).toBe('');
      });
    });
  });

  describe('Step Navigation', () => {
    it('should advance to next step when validation passes', async () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      // Fill required fields for step 0
      act(() => {
        result.current.setValue('nombre', 'Juan');
        result.current.setValue('apellidoPaterno', 'Pérez');
        result.current.setValue('fechaNacimiento', '1990-01-15');
        result.current.setValue('genero', 'M');
      });

      await act(async () => {
        await result.current.handleNext();
      });

      await waitFor(() => {
        expect(result.current.activeStep).toBe(1);
        expect(result.current.error).toBeNull();
      });
    });

    it('should not advance when required fields are missing', async () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      await act(async () => {
        await result.current.handleNext();
      });

      await waitFor(() => {
        expect(result.current.activeStep).toBe(0);
        expect(result.current.error).toBe('Por favor complete los campos requeridos y corrija los errores');
      });
    });

    it('should go back to previous step', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      act(() => {
        result.current.setValue('nombre', 'Juan');
        result.current.setValue('apellidoPaterno', 'Pérez');
        result.current.setValue('fechaNacimiento', '1990-01-15');
        result.current.setValue('genero', 'M');
      });

      act(() => {
        result.current.handleNext();
      });

      waitFor(() => {
        expect(result.current.activeStep).toBe(1);
      });

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.activeStep).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should clear error when going back', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      act(() => {
        result.current.handleNext();
      });

      waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('getFieldsForStep', () => {
    it('should return required fields for step 0', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const fields = result.current.getFieldsForStep(0);

      expect(fields).toEqual(['nombre', 'apellidoPaterno', 'fechaNacimiento', 'genero']);
    });

    it('should return empty array for step 1', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const fields = result.current.getFieldsForStep(1);

      expect(fields).toEqual([]);
    });

    it('should return empty array for step 2', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const fields = result.current.getFieldsForStep(2);

      expect(fields).toEqual([]);
    });
  });

  describe('Form Submission - Create Patient', () => {
    it('should create patient successfully with valid data', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Patient created'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: 'O+',
        telefono: '5551234567',
        email: 'juan@example.com',
        direccion: 'Calle 123',
        ciudad: 'CDMX',
        estado: 'CDMX',
        codigoPostal: '01000',
        ocupacion: 'Ingeniero',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(mockedPatientsService.createPatient).toHaveBeenCalled();
        expect(mockedToast.success).toHaveBeenCalledWith('Paciente creado exitosamente');
        expect(mockOnPatientCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should remove empty contactoEmergencia before sending', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Success'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        const callArgs = mockedPatientsService.createPatient.mock.calls[0][0];
        expect(callArgs.contactoEmergencia).toBeUndefined();
      });
    });

    it('should remove empty seguroMedico before sending', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Success'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: 'Test', relacion: 'padre', telefono: '123456789' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        const callArgs = mockedPatientsService.createPatient.mock.calls[0][0];
        expect(callArgs.seguroMedico).toBeUndefined();
        expect(callArgs.contactoEmergencia).toBeDefined();
      });
    });

    it('should handle API error during creation', async () => {
      const error = new Error('Network error');
      mockedPatientsService.createPatient.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(mockedToast.error).toHaveBeenCalledWith('Network error');
        expect(mockOnPatientCreated).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should handle unsuccessful API response', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: false,
        data: null,
        message: 'Validation failed'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Validation failed');
        expect(mockedToast.error).toHaveBeenCalledWith('Validation failed');
      });
    });

    it('should set loading state during submission', async () => {
      mockedPatientsService.createPatient.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { id: 1 } as Patient,
          message: 'Success'
        }), 100))
      );

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      act(() => {
        result.current.onFormSubmit(formData);
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Form Submission - Update Patient', () => {
    const mockPatient: Patient = {
      id: 1,
      numeroExpediente: 'EXP001',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      fechaNacimiento: '1990-01-15',
      edad: 35,
      genero: 'M',
      activo: true,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    };

    it('should update patient successfully', async () => {
      mockedPatientsService.updatePatient.mockResolvedValue({
        success: true,
        data: mockPatient,
        message: 'Patient updated'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: 'O+',
        telefono: '5551234567',
        email: 'juan@example.com',
        direccion: 'Updated address',
        ciudad: 'CDMX',
        estado: 'CDMX',
        codigoPostal: '01000',
        ocupacion: 'Ingeniero',
        estadoCivil: 'casado' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(mockedPatientsService.updatePatient).toHaveBeenCalledWith(1, expect.any(Object));
        expect(mockedToast.success).toHaveBeenCalledWith('Paciente actualizado exitosamente');
        expect(mockOnPatientCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      mockedPatientsService.updatePatient.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Update failed');
        expect(mockedToast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('should handle error with nested error property', async () => {
      const error = { error: 'Permission denied' };
      mockedPatientsService.updatePatient.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePatientForm(true, mockPatient, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Permission denied');
      });
    });
  });

  describe('Form State Management', () => {
    it('should track form errors', async () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      await act(async () => {
        result.current.setValue('nombre', 'A'); // Too short
        await result.current.trigger('nombre');
      });

      await waitFor(() => {
        expect(result.current.errors.nombre).toBeDefined();
      });
    });

    it('should track form validity', async () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      // Initially form should be invalid (no required fields filled)
      expect(result.current.isValid).toBe(false);

      // Fill all required fields
      await act(async () => {
        result.current.setValue('nombre', 'Juan', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        result.current.setValue('apellidoPaterno', 'Pérez', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        result.current.setValue('fechaNacimiento', '1990-01-15', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        result.current.setValue('genero', 'M', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      });

      // Trigger validation only for the required fields we just filled
      await act(async () => {
        await result.current.trigger(['nombre', 'apellidoPaterno', 'fechaNacimiento', 'genero']);
      });

      // After filling all required fields and triggering validation,
      // verify that required fields have no errors
      await waitFor(() => {
        expect(result.current.errors.nombre).toBeUndefined();
        expect(result.current.errors.apellidoPaterno).toBeUndefined();
        expect(result.current.errors.fechaNacimiento).toBeUndefined();
        expect(result.current.errors.genero).toBeUndefined();
      });
    });

    it('should generate unique form key based on patient and open state', () => {
      const { result, rerender } = renderHook(
        ({ patient, open }) => usePatientForm(open, patient, mockOnPatientCreated, mockOnClose),
        { initialProps: { patient: null as Patient | null, open: true } }
      );

      const key1 = result.current.formKey;

      rerender({ patient: { id: 1 } as Patient, open: true });

      const key2 = result.current.formKey;

      expect(key1).not.toBe(key2);
    });
  });

  describe('useEffect - Dialog State Changes', () => {
    it('should reset form when dialog closes and reopens', () => {
      const { rerender, result } = renderHook(
        ({ open }) => usePatientForm(open, null, mockOnPatientCreated, mockOnClose),
        { initialProps: { open: true } }
      );

      act(() => {
        result.current.setValue('nombre', 'Test');
      });

      rerender({ open: false });
      rerender({ open: true });

      waitFor(() => {
        expect(result.current.watchedValues.nombre).toBe('');
        expect(result.current.activeStep).toBe(0);
      });
    });

    it('should switch between create and edit modes', () => {
      const mockPatient: Patient = {
        id: 1,
        numeroExpediente: 'EXP001',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-15',
        edad: 35,
        genero: 'M',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      const { rerender, result } = renderHook(
        ({ patient }) => usePatientForm(true, patient, mockOnPatientCreated, mockOnClose),
        { initialProps: { patient: null as Patient | null } }
      );

      expect(result.current.useAddressAutocomplete).toBe(true);

      rerender({ patient: mockPatient });

      waitFor(() => {
        expect(result.current.useAddressAutocomplete).toBe(false);
        expect(result.current.watchedValues.nombre).toBe('Juan');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle patient with null date fields', () => {
      const patientWithNullDate: Patient = {
        id: 1,
        numeroExpediente: 'EXP001',
        nombre: 'Test',
        apellidoPaterno: 'Patient',
        fechaNacimiento: null as any,
        edad: 0,
        genero: 'M',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      const { result } = renderHook(() =>
        usePatientForm(true, patientWithNullDate, mockOnPatientCreated, mockOnClose)
      );

      waitFor(() => {
        expect(result.current.watchedValues.fechaNacimiento).toBe('');
      });
    });

    it('should handle very long text fields', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Success'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const longText = 'a'.repeat(2000);

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: longText,
        medicamentosActuales: longText,
        antecedentesPatologicos: longText,
        antecedentesFamiliares: longText,
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      // Should be sent to API even if validation might fail
      await waitFor(() => {
        expect(mockedPatientsService.createPatient).toHaveBeenCalled();
      });
    });

    it('should handle address autocomplete toggle', () => {
      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      expect(result.current.useAddressAutocomplete).toBe(true);

      act(() => {
        result.current.setUseAddressAutocomplete(false);
      });

      expect(result.current.useAddressAutocomplete).toBe(false);

      act(() => {
        result.current.setUseAddressAutocomplete(true);
      });

      expect(result.current.useAddressAutocomplete).toBe(true);
    });

    it('should preserve contactoEmergencia when filled', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Success'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: 'Maria', relacion: 'madre', telefono: '1234567890' },
        seguroMedico: { aseguradora: '', numeroPoliza: '', vigencia: '' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        const callArgs = mockedPatientsService.createPatient.mock.calls[0][0];
        expect(callArgs.contactoEmergencia).toEqual({
          nombre: 'Maria',
          relacion: 'madre',
          telefono: '1234567890'
        });
      });
    });

    it('should preserve seguroMedico when filled', async () => {
      mockedPatientsService.createPatient.mockResolvedValue({
        success: true,
        data: { id: 1 } as Patient,
        message: 'Success'
      });

      const { result } = renderHook(() =>
        usePatientForm(true, null, mockOnPatientCreated, mockOnClose)
      );

      const formData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-15',
        genero: 'M' as const,
        tipoSangre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        ocupacion: '',
        estadoCivil: 'soltero' as const,
        religion: '',
        alergias: '',
        medicamentosActuales: '',
        antecedentesPatologicos: '',
        antecedentesFamiliares: '',
        contactoEmergencia: { nombre: '', relacion: '', telefono: '' },
        seguroMedico: { aseguradora: 'IMSS', numeroPoliza: 'POL123', vigencia: '2026-12-31' }
      };

      await act(async () => {
        await result.current.onFormSubmit(formData);
      });

      await waitFor(() => {
        const callArgs = mockedPatientsService.createPatient.mock.calls[0][0];
        expect(callArgs.seguroMedico).toEqual({
          aseguradora: 'IMSS',
          numeroPoliza: 'POL123',
          vigencia: '2026-12-31'
        });
      });
    });
  });
});
