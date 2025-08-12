import * as yup from 'yup';

// Schema para crear nueva cuenta de paciente
export const newAccountSchema = yup.object({
  pacienteId: yup
    .number()
    .required('Debe seleccionar un paciente')
    .positive('Debe seleccionar un paciente válido'),
  
  tipoAtencion: yup
    .string()
    .required('El tipo de atención es requerido')
    .oneOf(['consulta_general', 'urgencia', 'hospitalizacion'], 'Tipo de atención no válido'),
  
  anticipo: yup
    .number()
    .optional()
    .min(0, 'El anticipo no puede ser negativo')
    .default(0),
  
  medicoTratanteId: yup
    .number()
    .optional()
    .positive('ID de médico inválido'),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
    .default('')
});

// Schema para transacciones POS (individual)
export const transactionItemSchema = yup.object({
  tipo: yup
    .string()
    .required('El tipo es requerido')
    .oneOf(['servicio', 'producto'], 'Tipo de transacción no válido'),
  
  itemId: yup
    .number()
    .required('Debe seleccionar un item')
    .positive('ID de item inválido'),
  
  servicioId: yup
    .number()
    .when('tipo', {
      is: 'servicio',
      then: (schema) => schema.required('ID de servicio requerido').positive(),
      otherwise: (schema) => schema.optional()
    }),
  
  productoId: yup
    .number()
    .when('tipo', {
      is: 'producto', 
      then: (schema) => schema.required('ID de producto requerido').positive(),
      otherwise: (schema) => schema.optional()
    }),
  
  cantidad: yup
    .number()
    .required('La cantidad es requerida')
    .positive('La cantidad debe ser mayor a 0')
    .integer('La cantidad debe ser un número entero'),
  
  // Validaciones dinámicas para stock disponible
  stockDisponible: yup
    .number()
    .when('tipo', {
      is: 'producto',
      then: (schema) => schema.optional(),
      otherwise: (schema) => schema.optional()
    })
});

// Schema para múltiples transacciones POS
export const posTransactionSchema = yup.object({
  cuentaId: yup
    .number()
    .required('ID de cuenta requerido')
    .positive('ID de cuenta inválido'),
  
  transacciones: yup
    .array()
    .of(transactionItemSchema)
    .min(1, 'Debe agregar al menos un item')
    .required('Las transacciones son requeridas'),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
    .default('')
});

// Schema para items del carrito (frontend)
export const cartItemSchema = yup.object({
  id: yup
    .string()
    .required('ID del item requerido'),
  
  tipo: yup
    .string()
    .required('Tipo requerido')
    .oneOf(['servicio', 'producto'], 'Tipo no válido'),
  
  itemId: yup
    .number()
    .required('ID del item requerido')
    .positive('ID inválido'),
  
  nombre: yup
    .string()
    .required('Nombre requerido')
    .min(2, 'Mínimo 2 caracteres'),
  
  precio: yup
    .number()
    .required('Precio requerido')
    .min(0, 'El precio no puede ser negativo'),
  
  cantidad: yup
    .number()
    .required('Cantidad requerida')
    .positive('La cantidad debe ser mayor a 0')
    .integer('La cantidad debe ser un entero'),
  
  subtotal: yup
    .number()
    .required('Subtotal requerido')
    .min(0, 'Subtotal inválido'),
  
  disponible: yup
    .number()
    .optional()
    .min(0, 'Stock disponible inválido')
});

// Schema para el carrito completo
export const cartSchema = yup.object({
  items: yup
    .array()
    .of(cartItemSchema)
    .min(1, 'El carrito debe tener al menos un item')
    .required('Items del carrito requeridos')
});

// Tipos inferidos para TypeScript
export type NewAccountFormValues = yup.InferType<typeof newAccountSchema>;
export type TransactionItemFormValues = yup.InferType<typeof transactionItemSchema>;
export type POSTransactionFormValues = yup.InferType<typeof posTransactionSchema>;
export type CartItemFormValues = yup.InferType<typeof cartItemSchema>;
export type CartFormValues = yup.InferType<typeof cartSchema>;