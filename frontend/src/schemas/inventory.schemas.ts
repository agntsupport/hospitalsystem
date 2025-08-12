import * as yup from 'yup';

// Schema para formulario de proveedor
export const supplierFormSchema = yup.object({
  razonSocial: yup
    .string()
    .required('La razón social es requerida')
    .min(2, 'Mínimo 2 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  
  nombreComercial: yup
    .string()
    .optional()
    .max(150, 'Máximo 150 caracteres'),
  
  rfc: yup
    .string()
    .required('El RFC es requerido')
    .matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/, 'Formato del RFC no válido'),
  
  telefono: yup
    .string()
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono no válido')
    .min(8, 'Mínimo 8 caracteres'),
  
  email: yup
    .string()
    .optional()
    .email('Formato de email no válido'),
  
  direccion: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  ciudad: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  estado: yup
    .string()
    .optional()
    .max(100, 'Máximo 100 caracteres'),
  
  codigoPostal: yup
    .string()
    .optional()
    .matches(/^\d{5}$/, 'Código postal debe tener 5 dígitos'),
  
  contacto: yup.object({
    nombre: yup
      .string()
      .optional()
      .max(100, 'Máximo 100 caracteres'),
    
    cargo: yup
      .string()
      .optional()
      .max(100, 'Máximo 100 caracteres'),
    
    telefono: yup
      .string()
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono no válido'),
    
    email: yup
      .string()
      .optional()
      .email('Formato de email no válido')
  }).optional(),
  
  condicionesPago: yup
    .string()
    .optional()
    .max(50, 'Máximo 50 caracteres'),
  
  diasCredito: yup
    .number()
    .optional()
    .min(0, 'No puede ser negativo')
    .max(365, 'Máximo 365 días')
    .when('condicionesPago', {
      is: (value: string) => value && value !== 'Contado',
      then: (schema) => schema.min(1, 'Los días de crédito deben ser mayor a 0 para condiciones de pago a crédito'),
      otherwise: (schema) => schema
    })
});

// Schema para movimiento de inventario
export const stockMovementSchema = yup.object({
  productoId: yup
    .number()
    .required('El producto es requerido')
    .positive('Debe seleccionar un producto'),
  
  tipoMovimiento: yup
    .string()
    .required('El tipo de movimiento es requerido')
    .oneOf(['entrada', 'salida', 'ajuste', 'merma'], 'Tipo de movimiento no válido'),
  
  cantidad: yup
    .number()
    .required('La cantidad es requerida')
    .positive('La cantidad debe ser mayor a 0')
    .integer('La cantidad debe ser un número entero'),
  
  costo: yup
    .number()
    .when('tipoMovimiento', {
      is: 'entrada',
      then: (schema) => schema
        .required('El costo unitario es requerido para entradas')
        .min(0, 'El costo no puede ser negativo'),
      otherwise: (schema) => schema.optional().min(0, 'El costo no puede ser negativo')
    }),
  
  razon: yup
    .string()
    .required('La razón es requerida')
    .oneOf([
      'compra',
      'venta',
      'devolucion',
      'vencimiento',
      'danado',
      'ajuste_inventario',
      'traspaso',
      'consumo_interno',
      'donacion',
      'otro'
    ], 'Razón no válida'),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  referencia: yup
    .string()
    .when('tipoMovimiento', {
      is: 'entrada',
      then: (schema) => schema.optional().max(50, 'Máximo 50 caracteres'),
      otherwise: (schema) => schema.optional().max(50, 'Máximo 50 caracteres')
    })
});

// Tipos inferidos
export type SupplierFormValues = yup.InferType<typeof supplierFormSchema>;
export type StockMovementFormValues = yup.InferType<typeof stockMovementSchema>;