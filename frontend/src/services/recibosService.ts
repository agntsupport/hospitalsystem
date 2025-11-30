// ABOUTME: Service para el módulo de Recibos y Comprobantes Formales
// ABOUTME: Maneja emisión, consulta, cancelación y reimpresión de recibos

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api.types';

// Tipos
export type TipoRecibo = 'cobro_cuenta' | 'pago_parcial' | 'anticipo' | 'devolucion';
export type EstadoRecibo = 'emitido' | 'reimpreso' | 'cancelado';
export type MetodoPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'cheque';

export interface Concepto {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Recibo {
  id: number;
  folio: string;
  serie: string;
  tipo: TipoRecibo;
  paciente?: {
    id: number;
    nombre: string;
  };
  cuenta?: {
    id: number;
    tipoAtencion: string;
    estado: string;
  };
  montoRecibido: number;
  cambio: number;
  metodoPago: MetodoPago;
  conceptos: Concepto[];
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision: string;
  estado: EstadoRecibo;
  cajero?: {
    id: number;
    username: string;
    apellidos: string;
  };
  canceladoPor?: {
    id: number;
    username: string;
    apellidos: string;
  };
  fechaCancelacion?: string;
  motivoCancelacion?: string;
}

export interface CrearReciboData {
  tipo: TipoRecibo;
  cuentaId: number;
  pacienteId: number;
  pagoId?: number;
  montoRecibido: number;
  cambio?: number;
  metodoPago: MetodoPago;
  conceptos: Concepto[];
  subtotal: number;
  iva?: number;
  total: number;
  serie?: string;
}

export interface RecibosStats {
  totalRecibos: number;
  montoTotalEmitido: number;
  montoCancelado: number;
  porTipo: {
    [key: string]: {
      cantidad: number;
      monto: number;
    };
  };
  porEstado: {
    [key: string]: number;
  };
}

export const recibosService = {
  // Listar recibos con filtros
  async getRecibos(params: {
    page?: number;
    limit?: number;
    tipo?: TipoRecibo;
    estado?: EstadoRecibo;
    pacienteId?: number;
    cuentaId?: number;
    cajeroId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<{ recibos: Recibo[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/recibos${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Obtener recibo por ID
  async getReciboById(id: number): Promise<ApiResponse<Recibo>> {
    return api.get(`/recibos/${id}`);
  },

  // Buscar recibo por folio
  async getReciboByFolio(folio: string): Promise<ApiResponse<Recibo>> {
    return api.get(`/recibos/folio/${folio}`);
  },

  // Obtener recibos de un paciente
  async getRecibosPaciente(pacienteId: number, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{ recibos: Recibo[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/recibos/paciente/${pacienteId}${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Obtener recibos de una cuenta
  async getRecibosCuenta(cuentaId: number): Promise<ApiResponse<{
    recibos: Recibo[];
    resumen: {
      totalRecibos: number;
      emitidos: number;
      cancelados: number;
      montoTotal: number;
    };
  }>> {
    return api.get(`/recibos/cuenta/${cuentaId}`);
  },

  // Emitir nuevo recibo
  async emitirRecibo(data: CrearReciboData): Promise<ApiResponse<{ data: Recibo }>> {
    return api.post('/recibos', data);
  },

  // Cancelar recibo (admin)
  async cancelar(id: number, motivo: string): Promise<ApiResponse<{ data: Recibo }>> {
    return api.put(`/recibos/${id}/cancelar`, { motivo });
  },

  // Marcar como reimpreso
  async reimprimir(id: number): Promise<ApiResponse<{ data: Recibo }>> {
    return api.put(`/recibos/${id}/reimprimir`);
  },

  // Obtener estadísticas (admin, socio)
  async getEstadisticas(params: {
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<RecibosStats>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/recibos/stats${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Helpers
  getTipoLabel(tipo: TipoRecibo): string {
    const labels: Record<TipoRecibo, string> = {
      'cobro_cuenta': 'Cobro de Cuenta',
      'pago_parcial': 'Pago Parcial',
      'anticipo': 'Anticipo',
      'devolucion': 'Devolución'
    };
    return labels[tipo] || tipo;
  },

  getEstadoLabel(estado: EstadoRecibo): string {
    const labels: Record<EstadoRecibo, string> = {
      'emitido': 'Emitido',
      'reimpreso': 'Reimpreso',
      'cancelado': 'Cancelado'
    };
    return labels[estado] || estado;
  },

  getMetodoPagoLabel(metodo: MetodoPago): string {
    const labels: Record<MetodoPago, string> = {
      'efectivo': 'Efectivo',
      'tarjeta_debito': 'Tarjeta de Débito',
      'tarjeta_credito': 'Tarjeta de Crédito',
      'transferencia': 'Transferencia',
      'cheque': 'Cheque'
    };
    return labels[metodo] || metodo;
  },

  getEstadoColor(estado: EstadoRecibo): 'success' | 'warning' | 'error' | 'default' {
    const colors: Record<EstadoRecibo, 'success' | 'warning' | 'error' | 'default'> = {
      'emitido': 'success',
      'reimpreso': 'warning',
      'cancelado': 'error'
    };
    return colors[estado] || 'default';
  },

  getTipoColor(tipo: TipoRecibo): 'primary' | 'secondary' | 'success' | 'error' | 'default' {
    const colors: Record<TipoRecibo, 'primary' | 'secondary' | 'success' | 'error' | 'default'> = {
      'cobro_cuenta': 'primary',
      'pago_parcial': 'secondary',
      'anticipo': 'success',
      'devolucion': 'error'
    };
    return colors[tipo] || 'default';
  },
};

export default recibosService;
