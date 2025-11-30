// ABOUTME: Service para el módulo de Descuentos Autorizados
// ABOUTME: Maneja políticas de descuento, solicitudes y autorizaciones

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api.types';

// Tipos
export type TipoDescuento = 'cortesia_medica' | 'empleado_hospital' | 'convenio_empresa' | 'promocion_temporal' | 'ajuste_precio' | 'redondeo' | 'otro';
export type TipoCalculo = 'porcentaje' | 'monto_fijo';
export type EstadoDescuento = 'pendiente' | 'autorizado' | 'rechazado' | 'aplicado' | 'revertido';

export interface PoliticaDescuento {
  id: number;
  nombre: string;
  tipo: TipoDescuento;
  porcentajeMaximo: number;
  montoMaximo?: number | null;
  rolesPermitidos: string[];
  requiereAutorizacion: boolean;
  rolesAutorizadores: string[];
  activo: boolean;
  fechaCreacion: string;
}

export interface DescuentoAplicado {
  id: number;
  numero: string;
  cuentaId: number;
  politicaId?: number;
  tipo: TipoDescuento;
  tipoCalculo: TipoCalculo;
  valorDescuento: number;
  montoDescuento: number;
  montoBaseCalculo: number;
  estado: EstadoDescuento;
  solicitanteId: number;
  autorizadorId?: number;
  motivoSolicitud: string;
  fechaSolicitud: string;
  fechaAutorizacion?: string;
  fechaAplicacion?: string;
  motivoRechazo?: string;
  observaciones?: string;
  cuenta?: {
    id: number;
    numero: string;
    paciente: {
      nombre: string;
      apellidoPaterno: string;
    };
  };
  politica?: PoliticaDescuento;
  solicitante?: {
    id: number;
    username: string;
    nombre: string;
  };
  autorizador?: {
    id: number;
    username: string;
    nombre: string;
  };
}

export interface CrearDescuentoData {
  cuentaId: number;
  politicaId?: number;
  tipo: TipoDescuento;
  tipoCalculo: TipoCalculo;
  valorDescuento: number;
  motivoSolicitud: string;
  observaciones?: string;
}

export const descuentosService = {
  // Obtener políticas de descuento
  async getPoliticas(): Promise<ApiResponse<PoliticaDescuento[]>> {
    return api.get('/descuentos/politicas');
  },

  // Crear política (admin)
  async crearPolitica(data: Partial<PoliticaDescuento>): Promise<ApiResponse<{ data: PoliticaDescuento }>> {
    return api.post('/descuentos/politicas', data);
  },

  // Actualizar política (admin)
  async actualizarPolitica(id: number, data: Partial<PoliticaDescuento>): Promise<ApiResponse<{ data: PoliticaDescuento }>> {
    return api.put(`/descuentos/politicas/${id}`, data);
  },

  // Eliminar política (admin)
  async eliminarPolitica(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/descuentos/politicas/${id}`);
  },

  // Solicitar descuento
  async solicitarDescuento(data: CrearDescuentoData): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.post('/descuentos', data);
  },

  // Listar descuentos
  async getDescuentos(params: {
    page?: number;
    limit?: number;
    estado?: EstadoDescuento;
    cuentaId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<{ items: DescuentoAplicado[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/descuentos${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Obtener descuentos pendientes de autorización (admin)
  async getPendientes(): Promise<ApiResponse<DescuentoAplicado[]>> {
    return api.get('/descuentos/pendientes');
  },

  // Obtener detalle de descuento
  async getDescuentoById(id: number): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.get(`/descuentos/${id}`);
  },

  // Autorizar descuento (admin)
  async autorizar(id: number, observaciones?: string): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.put(`/descuentos/${id}/autorizar`, { observaciones });
  },

  // Rechazar descuento (admin)
  async rechazar(id: number, motivoRechazo: string): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.put(`/descuentos/${id}/rechazar`, { motivoRechazo });
  },

  // Aplicar descuento (cajero)
  async aplicar(id: number): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.put(`/descuentos/${id}/aplicar`);
  },

  // Revertir descuento (admin)
  async revertir(id: number, motivo: string): Promise<ApiResponse<{ data: DescuentoAplicado }>> {
    return api.put(`/descuentos/${id}/revertir`, { motivo });
  },

  // Calcular descuento (helper)
  calcularDescuento(baseAmount: number, tipoCalculo: TipoCalculo, valor: number): number {
    if (tipoCalculo === 'porcentaje') {
      return (baseAmount * valor) / 100;
    }
    return Math.min(valor, baseAmount);
  },
};

export default descuentosService;
