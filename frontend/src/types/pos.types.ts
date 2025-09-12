import { Patient } from './patient.types';
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
  montoRecibido?: number;
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