import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { patientsService } from '@/services/patientsService';
import { Patient } from '@/types/patients.types';
import { patientFormSchema, PatientFormValues } from '@/schemas/patients.schemas';
import { toast } from 'react-toastify';

const defaultValues: PatientFormValues = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  genero: 'M',
  tipoSangre: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  estado: '',
  codigoPostal: '',
  ocupacion: '',
  estadoCivil: 'soltero',
  religion: '',
  alergias: '',
  medicamentosActuales: '',
  antecedentesPatologicos: '',
  antecedentesFamiliares: '',
  contactoEmergencia: {
    nombre: '',
    relacion: '',
    telefono: ''
  },
  seguroMedico: {
    aseguradora: '',
    numeroPoliza: '',
    vigencia: ''
  }
};

export const usePatientForm = (
  open: boolean,
  editingPatient: Patient | null | undefined,
  onPatientCreated: () => void,
  onClose: () => void
) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAddressAutocomplete, setUseAddressAutocomplete] = useState(true);

  const formKey = `patient-form-${editingPatient?.id || 'new'}-${open}`;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<PatientFormValues>({
    resolver: yupResolver(patientFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const watchedValues = watch();

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setError(null);
      setUseAddressAutocomplete(!editingPatient);

      if (editingPatient) {
        const editingData: PatientFormValues = {
          nombre: editingPatient.nombre || '',
          apellidoPaterno: editingPatient.apellidoPaterno || '',
          apellidoMaterno: editingPatient.apellidoMaterno || '',
          fechaNacimiento: editingPatient.fechaNacimiento
            ? new Date(editingPatient.fechaNacimiento).toISOString().split('T')[0]
            : '',
          genero: editingPatient.genero || 'M',
          tipoSangre: editingPatient.tipoSangre || '',
          telefono: editingPatient.telefono || '',
          email: editingPatient.email || '',
          direccion: editingPatient.direccion || '',
          ciudad: editingPatient.ciudad || '',
          estado: editingPatient.estado || '',
          codigoPostal: editingPatient.codigoPostal || '',
          ocupacion: editingPatient.ocupacion || '',
          estadoCivil: editingPatient.estadoCivil || 'soltero',
          religion: editingPatient.religion || '',
          alergias: editingPatient.alergias || '',
          medicamentosActuales: editingPatient.medicamentosActuales || '',
          antecedentesPatologicos: editingPatient.antecedentesPatologicos || '',
          antecedentesFamiliares: editingPatient.antecedentesFamiliares || '',
          contactoEmergencia: editingPatient.contactoEmergencia || {
            nombre: '',
            relacion: '',
            telefono: ''
          },
          seguroMedico: editingPatient.seguroMedico || {
            aseguradora: '',
            numeroPoliza: '',
            vigencia: ''
          }
        };
        reset(editingData);
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editingPatient, reset]);

  const resetForm = useCallback(() => {
    setActiveStep(0);
    setError(null);
    setUseAddressAutocomplete(true);
    reset();
    setTimeout(() => reset(defaultValues), 0);
  }, [reset]);

  const handleAddressSelected = useCallback((addressInfo: {
    codigoPostal: string;
    estado: string;
    ciudad: string;
    municipio: string;
    colonia?: string;
  }) => {
    setValue('codigoPostal', addressInfo.codigoPostal);
    setValue('estado', addressInfo.estado);
    setValue('ciudad', addressInfo.ciudad);

    if (addressInfo.colonia) {
      setValue('direccion', `${addressInfo.colonia}, ${addressInfo.municipio}`);
    }
  }, [setValue]);

  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(step);
    const result = await trigger(fieldsToValidate);
    return result;
  }, [trigger]);

  const getFieldsForStep = useCallback((step: number): (keyof PatientFormValues)[] => {
    switch (step) {
      case 0:
        return ['nombre', 'apellidoPaterno', 'fechaNacimiento', 'genero'];
      case 1:
        return [];
      case 2:
        return [];
      default:
        return [];
    }
  }, []);

  const handleNext = useCallback(async () => {
    const isStepValid = await validateStep(activeStep);

    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    } else {
      setError('Por favor complete los campos requeridos y corrija los errores');
    }
  }, [activeStep, validateStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => Math.max(0, prevActiveStep - 1));
    setError(null);
  }, []);

  const onFormSubmit = useCallback(async (data: PatientFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const cleanFormData: any = { ...data };

      if (!cleanFormData.contactoEmergencia?.nombre) {
        delete cleanFormData.contactoEmergencia;
      }

      if (!cleanFormData.seguroMedico?.aseguradora) {
        delete cleanFormData.seguroMedico;
      }

      let response;
      if (editingPatient) {
        response = await patientsService.updatePatient(editingPatient.id, cleanFormData);
      } else {
        response = await patientsService.createPatient(cleanFormData);
      }

      if (response.success) {
        toast.success(editingPatient ? 'Paciente actualizado exitosamente' : 'Paciente creado exitosamente');
        onPatientCreated();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error(`Error ${editingPatient ? 'updating' : 'creating'} patient:`, error);
      const errorMessage = error?.message || error?.error || `Error al ${editingPatient ? 'actualizar' : 'crear'} paciente`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [editingPatient, onPatientCreated, onClose]);

  return {
    activeStep,
    loading,
    error,
    useAddressAutocomplete,
    setUseAddressAutocomplete,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    errors,
    isValid,
    watchedValues,
    formKey,
    resetForm,
    handleAddressSelected,
    handleNext,
    handleBack,
    onFormSubmit,
    getFieldsForStep
  };
};
