import * as yup from 'yup';

// Schema para crear factura
export const invoiceFormSchema = yup.object({
  pacienteId: yup
    .number()
    .required('El paciente es requerido')
    .positive('Debe seleccionar un paciente'),
  
  cuentaId: yup
    .number()
    .optional()
    .positive('ID de cuenta inválido'),
  
  tipoFactura: yup
    .string()
    .required('El tipo de factura es requerido')
    .oneOf(['servicios', 'hospitalizacion', 'farmacia', 'laboratorio', 'mixta'], 'Tipo de factura no válido'),
  
  items: yup
    .array()
    .of(
      yup.object({
        descripcion: yup
          .string()
          .required('La descripción es requerida')
          .min(2, 'Mínimo 2 caracteres'),
        
        cantidad: yup
          .number()
          .required('La cantidad es requerida')
          .positive('La cantidad debe ser mayor a 0')
          .integer('La cantidad debe ser un número entero'),
        
        precioUnitario: yup
          .number()
          .required('El precio unitario es requerido')
          .min(0, 'El precio no puede ser negativo'),
        
        tipoItem: yup
          .string()
          .required('El tipo de item es requerido')
          .oneOf(['servicio', 'producto', 'honorario'], 'Tipo de item no válido')
      })
    )
    .min(1, 'Debe agregar al menos un item')
    .required('Los items son requeridos'),
  
  descuento: yup
    .number()
    .optional()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede ser mayor al 100%'),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres'),
  
  usarDatosFacturacion: yup
    .boolean()
    .default(false),
  
  datosFacturacion: yup
    .object()
    .when('usarDatosFacturacion', {
      is: true,
      then: (schema) => schema.shape({
        razonSocial: yup
          .string()
          .required('La razón social es requerida')
          .min(2, 'Mínimo 2 caracteres'),
        
        rfc: yup
          .string()
          .required('El RFC es requerido')
          .matches(/^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC no válido'),
        
        direccionFiscal: yup
          .string()
          .required('La dirección fiscal es requerida')
          .min(5, 'Mínimo 5 caracteres'),
        
        email: yup
          .string()
          .required('El email es requerido')
          .email('Email no válido')
      }),
      otherwise: (schema) => schema.optional()
    })
});

// Schema para registro de pago
export const paymentFormSchema = yup.object({
  facturaId: yup
    .number()
    .required('La factura es requerida')
    .positive('Debe seleccionar una factura'),
  
  monto: yup
    .number()
    .required('El monto es requerido')
    .positive('El monto debe ser mayor a 0'),
  
  metodoPago: yup
    .string()
    .required('El método de pago es requerido')
    .oneOf(['cash', 'card', 'transfer', 'check'], 'Método de pago no válido'),
  
  fechaPago: yup
    .string()
    .required('La fecha de pago es requerida')
    .test('fecha-valida', 'La fecha no puede ser futura', function(value) {
      if (!value) return false;
      return new Date(value) <= new Date();
    }),
  
  referencia: yup
    .string()
    .when('metodoPago', {
      is: (val: string) => val !== 'cash',
      then: (schema) => schema
        .required('La referencia es requerida')
        .min(4, 'Mínimo 4 caracteres'),
      otherwise: (schema) => schema.optional().default('')
    }),
  
  banco: yup
    .string()
    .when('metodoPago', {
      is: 'card',
      then: (schema) => schema.optional().default(''),
      otherwise: (schema) => schema.optional().default('')
    }),
  
  autorizacion: yup
    .string()
    .when('metodoPago', {
      is: 'card',
      then: (schema) => schema
        .required('El código de autorización es requerido')
        .min(4, 'Mínimo 4 caracteres'),
      otherwise: (schema) => schema.optional().default('')
    }),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
    .default('')
});

// Schema simplificado para crear factura desde cuenta POS
export const createInvoiceFromAccountSchema = yup.object({
  cuentaPacienteId: yup
    .number()
    .required('Debe seleccionar una cuenta POS')
    .positive('Debe seleccionar una cuenta válida'),
  
  fechaVencimiento: yup
    .string()
    .optional()
    .test('fecha-valida', 'La fecha no puede ser anterior a hoy', function(value) {
      if (!value) return true;
      return new Date(value) >= new Date();
    }),
  
  terminosPago: yup
    .string()
    .required('Los términos de pago son requeridos')
    .oneOf(['Inmediato', '15 días', '30 días', '45 días', '60 días'], 'Término de pago no válido'),
  
  observaciones: yup
    .string()
    .optional()
    .max(500, 'Máximo 500 caracteres')
    .default(''),
  
  descuentoGlobal: yup
    .number()
    .optional()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede ser mayor al 100%')
    .default(0)
});

// Tipos inferidos
export type InvoiceFormValues = yup.InferType<typeof invoiceFormSchema>;
export type PaymentFormValues = yup.InferType<typeof paymentFormSchema>;
export type CreateInvoiceFromAccountFormValues = yup.InferType<typeof createInvoiceFromAccountSchema>;