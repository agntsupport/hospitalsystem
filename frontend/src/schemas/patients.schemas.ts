import * as yup from 'yup';

// Validaciones comunes reutilizables
const phoneRegex = /^[\d\s\-\+\(\)]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Schema para contacto de emergencia
const contactoEmergenciaSchema = yup.object({
  nombre: yup
    .string()
    .optional()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  relacion: yup
    .string()
    .optional()
    .oneOf(['padre', 'madre', 'hijo', 'hija', 'conyuge', 'hermano', 'hermana', 'abuelo', 'abuela', 'tio', 'tia', 'primo', 'prima', 'amigo', 'otro'], 'Relación no válida'),
  
  telefono: yup
    .string()
    .optional()
    .matches(phoneRegex, 'Formato de teléfono no válido')
    .min(8, 'Mínimo 8 caracteres')
});

// Schema para seguro médico
const seguroMedicoSchema = yup.object({
  aseguradora: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  numeroPoliza: yup
    .string()
    .optional()
    .max(50, 'Máximo 50 caracteres'),
  
  vigencia: yup
    .string()
    .optional()
    .test('fecha-futura', 'La fecha de vigencia debe ser futura', function(value) {
      if (!value) return true;
      return new Date(value) > new Date();
    })
});

// Schema principal para formulario de paciente
export const patientFormSchema = yup.object({
  // Información Personal
  nombre: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Solo se permiten letras y espacios'),
  
  apellidoPaterno: yup
    .string()
    .required('El apellido paterno es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Solo se permiten letras y espacios'),
  
  apellidoMaterno: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]*$/, 'Solo se permiten letras y espacios'),
  
  fechaNacimiento: yup
    .string()
    .required('La fecha de nacimiento es requerida')
    .test('edad-valida', 'La fecha de nacimiento no puede ser futura', function(value) {
      if (!value) return false;
      return new Date(value) <= new Date();
    })
    .test('edad-maxima', 'La edad no puede ser mayor a 150 años', function(value) {
      if (!value) return false;
      const edad = new Date().getFullYear() - new Date(value).getFullYear();
      return edad <= 150;
    }),
  
  genero: yup
    .string()
    .required('El género es requerido')
    .oneOf(['M', 'F', 'Otro'], 'Género no válido'),
  
  tipoSangre: yup
    .string()
    .optional()
    .oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], 'Tipo de sangre no válido'),
  
  estadoCivil: yup
    .string()
    .optional()
    .oneOf(['soltero', 'casado', 'divorciado', 'viudo', 'union_libre', ''], 'Estado civil no válido'),
  
  ocupacion: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  religion: yup
    .string()
    .optional()
    .max(50, 'Máximo 50 caracteres'),
  
  // Información de Contacto
  telefono: yup
    .string()
    .optional()
    .matches(phoneRegex, 'Formato de teléfono no válido')
    .min(8, 'Mínimo 8 caracteres')
    .max(20, 'Máximo 20 caracteres'),
  
  email: yup
    .string()
    .optional()
    .email('Email no válido')
    .max(100, 'Máximo 100 caracteres'),
  
  direccion: yup
    .string()
    .optional()
    .min(5, 'Mínimo 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  
  ciudad: yup
    .string()
    .optional()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  estado: yup
    .string()
    .optional()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  codigoPostal: yup
    .string()
    .optional()
    .matches(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  
  // Información Médica
  alergias: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  medicamentosActuales: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  antecedentesPatologicos: yup
    .string()
    .optional()
    .max(1000, 'Máximo 1000 caracteres'),
  
  antecedentesFamiliares: yup
    .string()
    .optional()
    .max(1000, 'Máximo 1000 caracteres'),
  
  // Contacto de Emergencia
  contactoEmergencia: contactoEmergenciaSchema,
  
  // Seguro Médico
  seguroMedico: seguroMedicoSchema
});

// Tipo inferido del schema
export type PatientFormValues = yup.InferType<typeof patientFormSchema>;