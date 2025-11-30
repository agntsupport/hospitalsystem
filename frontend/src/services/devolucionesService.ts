// ABOUTME: Service para el módulo de Devoluciones y Reembolsos
// ABOUTME: Maneja solicitudes, autorizaciones y procesamiento de devoluciones

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api.types';

// Tipos
export type TipoDevolucion = 'producto' | 'servicio' | 'total_cuenta';
export type EstadoDevolucion = 'pendiente_autorizacion' | 'autorizada' | 'procesada' | 'rechazada' | 'cancelada';
export type CategoriaMotivo = 'error_captura' | 'error_medico' | 'paciente_rechaza' | 'producto_defectuoso' | 'duplicado' | 'otro';
export type EstadoProducto = 'bueno' | 'dañado' | 'no_apto';

export interface MotivoDevolucion {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: CategoriaMotivo;
  requiereAutorizacion: boolean;
  activo: boolean;
}

export interface ProductoDevuelto {
  id: number;
  devolucionId: number;
  productoId: number;
  cantidadOriginal: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  subtotal: number;
  estadoProducto: EstadoProducto;
  regresaInventario: boolean;
  producto?: {
    id: number;
    nombre: string;
    codigo: string;
    precioVenta: number;
  };
}

export interface Devolucion {
  id: number;
  numero: string;
  cuentaId: number;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  montoDevolucion: number;
  motivoId: number;
  motivoDetalle?: string;
  cajeroSolicitaId: number;
  autorizadorId?: number;
  fechaSolicitud: string;
  fechaAutorizacion?: string;
  fechaProceso?: string;
  metodoPagoDevolucion?: string;
  observaciones?: string;
  cuenta?: {
    id: number;
    numero: string;
    paciente: {
      nombre: string;
      apellidoPaterno: string;
    };
  };
  motivo?: MotivoDevolucion;
  cajeroSolicita?: {
    id: number;
    username: string;
    nombre: string;
  };
  autorizador?: {
    id: number;
    username: string;
    nombre: string;
  };
  productosDevueltos?: ProductoDevuelto[];
}

export interface CrearDevolucionData {
  cuentaId: number;
  tipo: TipoDevolucion;
  motivoId: number;
  motivoDetalle?: string;
  montoDevolucion?: number; // Requerido para servicios
  productos?: Array<{
    productoId: number;
    cantidad: number;
    estadoProducto?: EstadoProducto;
    regresaInventario?: boolean;
  }>;
  observaciones?: string;
}

export interface EstadisticasDevolucion {
  total: number;
  montoTotalDevuelto: number;
  porEstado: Array<{
    estado: EstadoDevolucion;
    cantidad: number;
    monto: number;
  }>;
  porMotivo: Array<{
    motivo: string;
    cantidad: number;
    monto: number;
  }>;
}

export const devolucionesService = {
  // Obtener motivos de devolución
  async getMotivos(): Promise<ApiResponse<MotivoDevolucion[]>> {
    return api.get('/devoluciones/motivos');
  },

  // Crear solicitud de devolución
  async crearDevolucion(data: CrearDevolucionData): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.post('/devoluciones', data);
  },

  // Listar devoluciones
  async getDevoluciones(params: {
    page?: number;
    limit?: number;
    estado?: EstadoDevolucion;
    cuentaId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<{ items: Devolucion[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/devoluciones${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Obtener devoluciones pendientes (admin)
  async getPendientes(): Promise<ApiResponse<Devolucion[]>> {
    return api.get('/devoluciones/pendientes');
  },

  // Obtener detalle de devolución
  async getDevolucionById(id: number): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.get(`/devoluciones/${id}`);
  },

  // Autorizar devolución (admin)
  async autorizar(id: number, observaciones?: string): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.put(`/devoluciones/${id}/autorizar`, { observaciones });
  },

  // Rechazar devolución (admin)
  async rechazar(id: number, motivoRechazo: string): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.put(`/devoluciones/${id}/rechazar`, { motivoRechazo });
  },

  // Procesar devolución (cajero con caja abierta)
  async procesar(id: number, metodoPago: string = 'efectivo'): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.put(`/devoluciones/${id}/procesar`, { metodoPago });
  },

  // Cancelar solicitud
  async cancelar(id: number, motivo?: string): Promise<ApiResponse<{ data: Devolucion }>> {
    return api.put(`/devoluciones/${id}/cancelar`, { motivo });
  },

  // Obtener estadísticas/reporte
  async getEstadisticas(params: {
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<{ data: EstadisticasDevolucion }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/devoluciones/reporte/estadisticas${queryParams.toString() ? `?${queryParams}` : ''}`);
  },
};

export default devolucionesService;
