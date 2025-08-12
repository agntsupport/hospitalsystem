import * as yup from 'yup';

// Validaciones comunes
const phoneRegex = /^[\d\s\-\+\(\)]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

// Schema para formulario de empleado
export const employeeFormSchema = yup.object({
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
    .test('edad-minima', 'El empleado debe ser mayor de 18 años', function(value) {
      if (!value) return false;
      const edad = new Date().getFullYear() - new Date(value).getFullYear();
      return edad >= 18;
    })
    .test('edad-maxima', 'La edad no puede ser mayor a 75 años', function(value) {
      if (!value) return false;
      const edad = new Date().getFullYear() - new Date(value).getFullYear();
      return edad <= 75;
    }),
  
  genero: yup
    .string()
    .required('El género es requerido')
    .oneOf(['M', 'F', 'Otro'], 'Género no válido'),
  
  // Información de Contacto
  telefono: yup
    .string()
    .required('El teléfono es requerido')
    .matches(phoneRegex, 'Formato de teléfono no válido')
    .min(8, 'Mínimo 8 caracteres')
    .max(20, 'Máximo 20 caracteres'),
  
  email: yup
    .string()
    .required('El email es requerido')
    .email('Email no válido')
    .max(100, 'Máximo 100 caracteres'),
  
  direccion: yup
    .string()
    .required('La dirección es requerida')
    .min(5, 'Mínimo 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  
  // Información Laboral
  tipo: yup
    .string()
    .required('El tipo de empleado es requerido')
    .oneOf(['enfermero', 'medico_residente', 'medico_especialista'], 'Tipo de empleado no válido'),
  
  especialidad: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  numeroLicencia: yup
    .string()
    .optional()
    .max(50, 'Máximo 50 caracteres'),
  
  fechaIngreso: yup
    .string()
    .required('La fecha de ingreso es requerida')
    .test('fecha-valida', 'La fecha de ingreso no puede ser futura', function(value) {
      if (!value) return false;
      return new Date(value) <= new Date();
    }),
  
  salario: yup
    .number()
    .required('El salario es requerido')
    .min(0, 'El salario no puede ser negativo')
    .max(999999, 'Salario máximo excedido'),
  
  turno: yup
    .string()
    .required('El turno es requerido')
    .oneOf(['matutino', 'vespertino', 'nocturno', 'mixto'], 'Turno no válido'),
  
  // Información de Usuario (solo para nuevos empleados)
  username: yup
    .string()
    .when('$isNew', {
      is: true,
      then: (schema) => schema
        .required('El nombre de usuario es requerido')
        .min(4, 'Mínimo 4 caracteres')
        .max(30, 'Máximo 30 caracteres')
        .matches(usernameRegex, 'Solo se permiten letras, números y guión bajo'),
      otherwise: (schema) => schema.optional()
    }),
  
  password: yup
    .string()
    .when('$isNew', {
      is: true,
      then: (schema) => schema
        .required('La contraseña es requerida')
        .min(6, 'Mínimo 6 caracteres')
        .max(100, 'Máximo 100 caracteres'),
      otherwise: (schema) => schema.optional()
    }),
  
  confirmPassword: yup
    .string()
    .when('$isNew', {
      is: true,
      then: (schema) => schema
        .required('Confirme la contraseña')
        .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
      otherwise: (schema) => schema.optional()
    }),
  
  rol: yup
    .string()
    .required('El rol es requerido')
    .oneOf([
      'cajero',
      'enfermero',
      'almacenista',
      'administrador',
      'socio',
      'medico_residente',
      'medico_especialista'
    ], 'Rol no válido'),
  
  activo: yup
    .boolean()
    .default(true)
});

// Tipo inferido del schema
export type EmployeeFormValues = yup.InferType<typeof employeeFormSchema>;