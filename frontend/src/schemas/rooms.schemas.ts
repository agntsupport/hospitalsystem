import * as yup from 'yup';

// Schema para formulario de habitación
export const roomFormSchema = yup.object({
  numero: yup
    .string()
    .required('El número de habitación es requerido')
    .max(20, 'Máximo 20 caracteres'),
  
  tipo: yup
    .string()
    .required('El tipo de habitación es requerido')
    .oneOf(['individual', 'doble', 'suite', 'uci', 'urgencias'], 'Tipo de habitación no válido'),
  
  precioPorDia: yup
    .number()
    .required('El precio por día es requerido')
    .min(0, 'El precio por día debe ser mayor a 0')
    .max(99999, 'Precio máximo excedido'),

  costoPorDia: yup
    .number()
    .nullable()
    .optional()
    .min(0, 'El costo por día debe ser mayor o igual a 0')
    .max(99999, 'Costo máximo excedido'),

  estado: yup
    .string()
    .required('El estado es requerido')
    .oneOf(['disponible', 'ocupada', 'mantenimiento', 'limpieza'], 'Estado no válido'),
  
  descripcion: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
});

// Schema para formulario de consultorio
export const officeFormSchema = yup.object({
  numero: yup
    .string()
    .required('El número de consultorio es requerido')
    .max(20, 'Máximo 20 caracteres'),
  
  tipo: yup
    .string()
    .required('El tipo de consultorio es requerido')
    .oneOf(['consulta_general', 'especialidad', 'procedimientos', 'diagnostico'], 'Tipo de consultorio no válido'),
  
  especialidad: yup
    .string()
    .when('tipo', {
      is: 'especialidad',
      then: (schema) => schema
        .required('La especialidad es requerida para consultorios de especialidad')
        .min(2, 'Mínimo 2 caracteres'),
      otherwise: (schema) => schema.optional()
    }),
  
  estado: yup
    .string()
    .required('El estado es requerido')
    .oneOf(['disponible', 'ocupado', 'mantenimiento', 'limpieza'], 'Estado no válido'),
  
  descripcion: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
});

// Tipos inferidos
export type RoomFormValues = yup.InferType<typeof roomFormSchema>;
export type OfficeFormValues = yup.InferType<typeof officeFormSchema>;