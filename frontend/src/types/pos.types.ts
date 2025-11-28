import { Patient } from './patients.types';
import { Employee } from './employee.types';

export interface Service {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: ServiceType;
  precio: number;
  activo: boolean;
  createdAt: string;
}

export type ServiceType = 'consulta_general' | 'consulta_especialidad' | 'urgencia' | 'curacion' | 'hospitalizacion';

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: ProductCategory;
  unidadMedida: string;
  precioCompra?: number;
  precioVenta: number;
  precio?: number; // Alias de precioVenta para compatibilidad
  stockMinimo: number;
  stockActual: number;
  activo: boolean;
  createdAt: string;
}

export type ProductCategory = 'medicamento' | 'material_medico' | 'insumo';

export interface PatientAccount {
  id: number;
  pacienteId: number;
  tipoAtencion: AttentionType;
  estado: AccountState;
  anticipo: number;
  totalServicios: number;
  totalProductos: number;
  totalCuenta: number;
  saldoPendiente: number;
  habitacionId?: number;
  medicoTratanteId?: number;
  cajeroAperturaId: number;
  cajeroCierreId?: number;
  fechaApertura: string;
  fechaCierre?: string;
  observaciones?: string;
  transacciones: Transaction[];
  facturada?: boolean; // Indica si la cuenta fue facturada

  // Datos enriquecidos desde la API
  paciente?: Patient;
  medicoTratante?: Employee;
}

export type AttentionType = 'consulta_general' | 'urgencia' | 'hospitalizacion';
export type AccountState = 'abierta' | 'cerrada';

export interface Transaction {
  id: number;
  tipo: TransactionType;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  servicioId?: number;
  productoId?: number;
  fechaTransaccion: string;
}

export type TransactionType = 'servicio' | 'producto' | 'anticipo' | 'pago';

export interface PatientAccountFormData {
  pacienteId: number;
  tipoAtencion: AttentionType;
  anticipo?: number;
  medicoTratanteId?: number;
  habitacionId?: number;
  observaciones?: string;
}

export interface AddTransactionData {
  tipo: 'servicio' | 'producto';
  cantidad: number;
  servicioId?: number;
  productoId?: number;
}

export interface CloseAccountData {
  montoPagado?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  observaciones?: string;
  cuentaPorCobrar?: boolean;
  motivoCuentaPorCobrar?: string;
}

export interface POSStats {
  cuentasAbiertas: number;
  cuentasCerradas: number;
  totalVentasHoy: number;
  totalVentasMes: number;
  serviciosVendidos: number;
  productosVendidos: number;
  saldosAFavor: number;
  saldosPorCobrar: number;
}

export interface CartItem {
  id: string; // Para el carrito, usamos string para servicios y productos
  tipo: 'servicio' | 'producto';
  itemId: number; // ID real del servicio o producto
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  disponible?: number; // Para productos, stock disponible
}

// === COBROS PARCIALES (FASE 9) ===
export interface PartialPaymentData {
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones?: string;
}

// === CUENTAS POR COBRAR (FASE 9) ===
export type EstadoCPC = 'pendiente' | 'pagado_parcial' | 'pagado_total' | 'cancelado';

export interface CuentaPorCobrar {
  id: number;
  cuentaPacienteId: number;
  montoOriginal: number;
  saldoPendiente: number;
  montoPagado: number;
  estado: EstadoCPC;
  autorizadoPorId: number;
  motivoAutorizacion: string;
  fechaCreacion: string;
  fechaUltimoPago?: string;
  // Datos enriquecidos
  paciente?: Patient;
  autorizadoPor?: Employee;
  cuentaPaciente?: PatientAccount;
}

export interface CPCPaymentData {
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones?: string;
}

export interface CPCStats {
  totalCPCActivas: number;
  montoPendienteTotal: number;
  montoRecuperadoTotal: number;
  porcentajeRecuperacion: number;
  distribucionPorEstado: {
    pendiente: { cantidad: number; monto: number };
    pagado_parcial: { cantidad: number; monto: number };
    pagado_total: { cantidad: number; monto: number };
    cancelado: { cantidad: number; monto: number };
  };
  topDeudores: Array<{
    id: number;
    paciente: Patient;
    montoOriginal: number;
    saldoPendiente: number;
    fechaCreacion: string;
  }>;
}