// Tipos para el módulo de facturación y cuentas abiertas

import { Patient } from './patients.types';

// Estados de las facturas
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';

// Métodos de pago
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'insurance';

// Estados de pago
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// Interface principal de Factura
export interface Invoice {
  id: number;
  folio: string; // Número de folio consecutivo (ej: FAC-2024-001)
  cuentaPacienteId: number; // Referencia a la cuenta POS original
  paciente: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    numeroExpediente: string;
  };
  fechaEmision: string;
  fechaVencimiento: string;
  estado: InvoiceStatus;
  
  // Totales
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  saldoPendiente: number; // Para pagos parciales
  
  // Conceptos facturados
  conceptos: InvoiceItem[];
  
  // Información adicional
  observaciones?: string;
  terminosPago: string; // ej: "30 días", "Inmediato"
  moneda: string;
  
  // Auditoría
  creadoPor: {
    id: number;
    nombre: string;
    username: string;
  };
  fechaCreacion: string;
  fechaActualizacion: string;
  
  // Pagos relacionados
  pagos: Payment[];
}

// Conceptos/items de la factura
export interface InvoiceItem {
  id: number;
  facturaId: number;
  tipo: 'servicio' | 'producto' | 'habitacion';
  concepto: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  
  // Referencias opcionales
  servicioId?: number;
  productoId?: number;
  habitacionId?: number;
  
  // Información del concepto original
  codigoConcepto?: string;
  categoria?: string;
}

// Interface de Pago
export interface Payment {
  id: number;
  facturaId: number;
  folioPago: string; // Número de recibo de pago
  fechaPago: string;
  monto: number;
  metodoPago: PaymentMethod;
  estado: PaymentStatus;
  
  // Información del pago
  referencia?: string; // Número de referencia bancaria, cheque, etc.
  banco?: string;
  autorizacion?: string; // Código de autorización para tarjetas
  
  // Información adicional
  observaciones?: string;
  comprobante?: string; // URL o path del comprobante
  
  // Auditoría
  registradoPor: {
    id: number;
    nombre: string;
    username: string;
  };
  fechaRegistro: string;
}

// Filtros para búsqueda de facturas
export interface InvoiceFilters {
  estado?: InvoiceStatus;
  fechaInicio?: string;
  fechaFin?: string;
  pacienteId?: number;
  folio?: string;
  numeroExpediente?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  soloVencidas?: boolean;
  limit?: number;
  offset?: number;
}

// Filtros para búsqueda de pagos
export interface PaymentFilters {
  facturaId?: number;
  metodoPago?: PaymentMethod;
  estado?: PaymentStatus;
  fechaInicio?: string;
  fechaFin?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  limit?: number;
  offset?: number;
}

// Resumen de cuentas por cobrar
export interface AccountsReceivable {
  totalFacturado: number;
  totalCobrado: number;
  saldoPendiente: number;
  facturasPendientes: number;
  facturasVencidas: number;
  promedioCobranza: number; // días promedio de cobranza
  
  // Desglose por antigüedad
  vencimiento: {
    corriente: number; // 0-30 días
    vencido30: number; // 31-60 días
    vencido60: number; // 61-90 días
    vencido90: number; // 91+ días
  };
  
  // Por método de pago
  porMetodoPago: Record<PaymentMethod, number>;
}

// Estadísticas de facturación
export interface BillingStats {
  totalFacturado: number;
  totalCobrado: number;
  facturasPendientes: number;
  promedioFactura: number;
  crecimientoMensual: number;
  
  // Tendencias
  facturasPorMes: Array<{
    mes: string;
    facturas: number;
    monto: number;
  }>;
  
  // Top pacientes
  topPacientes: Array<{
    paciente: {
      id: number;
      nombre: string;
      numeroExpediente: string;
    };
    totalFacturado: number;
    facturas: number;
  }>;
}

// Request para crear factura
export interface CreateInvoiceRequest {
  cuentaPacienteId: number;
  fechaVencimiento?: string;
  terminosPago?: string;
  observaciones?: string;
  descuentoGlobal?: number;
}

// Request para registrar pago
export interface CreatePaymentRequest {
  facturaId: number;
  monto: number;
  metodoPago: PaymentMethod;
  fechaPago?: string;
  referencia?: string;
  banco?: string;
  autorizacion?: string;
  observaciones?: string;
}

// Response genérico para operaciones de facturación
export interface BillingResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Response para listas con paginación
export interface BillingListResponse<T> extends BillingResponse<{
  items: T[];
  total: number;
  limit: number;
  offset: number;
}> {}

// Constantes para el módulo
export const INVOICE_STATUSES: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  partial: 'Pago Parcial'
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  insurance: 'Seguro Médico'
};

export const PAYMENT_STATUSES: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado'
};

// Configuración de términos de pago predefinidos
export const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Inmediato', days: 0 },
  { value: '15_days', label: '15 días', days: 15 },
  { value: '30_days', label: '30 días', days: 30 },
  { value: '45_days', label: '45 días', days: 45 },
  { value: '60_days', label: '60 días', days: 60 }
];