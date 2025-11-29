import * as yup from 'yup';

// Schema para formulario de quirófano
export const quirofanoFormSchema = yup.object({
  numero: yup
    .string()
    .required('El número de quirófano es requerido')
    .matches(/^Q?\d+$/, 'Formato válido: Q1, Q2, 01, 02, etc.')
    .max(10, 'Máximo 10 caracteres'),
  
  tipo: yup
    .string()
    .required('El tipo es requerido')
    .oneOf([
      'cirugia_general',
      'cirugia_cardiaca',
      'cirugia_neurologica',
      'cirugia_ortopedica',
      'cirugia_ambulatoria'
    ], 'Tipo de quirófano no válido'),
  
  especialidad: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  descripcion: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  equipamiento: yup
    .string()
    .optional()
    .max(1000, 'Máximo 1000 caracteres'),
  
  capacidadEquipo: yup
    .number()
    .required('La capacidad es requerida')
    .min(2, 'Mínimo 2 personas')
    .max(20, 'Máximo 20 personas')
    .integer('Debe ser un número entero'),
  
  precioHora: yup
    .number()
    .optional()
    .nullable()
    .min(0, 'El precio no puede ser negativo')
    .max(999999, 'Precio máximo excedido'),

  costoHora: yup
    .number()
    .optional()
    .nullable()
    .min(0, 'El costo no puede ser negativo')
    .max(999999, 'Costo máximo excedido')
});

// Tipo inferido del schema
export type QuirofanoFormValues = yup.InferType<typeof quirofanoFormSchema>;