// ABOUTME: Service para el módulo de Depósitos Bancarios
// ABOUTME: Maneja cuentas bancarias, depósitos y conciliación

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api.types';

// Tipos
export type TipoCuenta = 'corriente' | 'ahorro' | 'inversion';
export type EstadoDeposito = 'preparado' | 'depositado' | 'confirmado' | 'rechazado';

export interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  clabe?: string | null;
  alias: string;
  tipo: TipoCuenta;
  moneda: string;
  activa: boolean;
  fechaCreacion: string;
}

export interface DepositoBancario {
  id: number;
  numero: string;
  cuentaBancariaId: number;
  cajaId?: number;
  montoEfectivo: number;
  montoCheques: number;
  montoTotal: number;
  estado: EstadoDeposito;
  preparadoPorId: number;
  confirmadoPorId?: number;
  fechaPreparacion: string;
  fechaDeposito?: string;
  fechaConfirmacion?: string;
  numeroFicha?: string;
  observaciones?: string;
  motivoRechazo?: string;
  cuentaBancaria?: CuentaBancaria;
  preparadoPor?: {
    id: number;
    username: string;
    nombre: string;
  };
  confirmadoPor?: {
    id: number;
    username: string;
    nombre: string;
  };
}

export interface CrearDepositoData {
  cuentaBancariaId: number;
  cajaId?: number;
  montoEfectivo: number;
  montoCheques?: number;
  observaciones?: string;
}

export interface ConfirmarDepositoData {
  numeroFicha: string;
  fechaDeposito?: string;
  observaciones?: string;
}

export const bancosService = {
  // === CUENTAS BANCARIAS ===

  // Listar cuentas bancarias
  async getCuentas(params: { activa?: boolean } = {}): Promise<ApiResponse<CuentaBancaria[]>> {
    const queryParams = new URLSearchParams();
    if (params.activa !== undefined) queryParams.append('activa', params.activa.toString());
    return api.get(`/bancos/cuentas${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Crear cuenta bancaria (admin)
  async crearCuenta(data: Partial<CuentaBancaria>): Promise<ApiResponse<{ data: CuentaBancaria }>> {
    return api.post('/bancos/cuentas', data);
  },

  // Actualizar cuenta (admin)
  async actualizarCuenta(id: number, data: Partial<CuentaBancaria>): Promise<ApiResponse<{ data: CuentaBancaria }>> {
    return api.put(`/bancos/cuentas/${id}`, data);
  },

  // Desactivar cuenta (admin)
  async desactivarCuenta(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/bancos/cuentas/${id}`);
  },

  // === DEPÓSITOS BANCARIOS ===

  // Preparar depósito
  async prepararDeposito(data: CrearDepositoData): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.post('/bancos/depositos', data);
  },

  // Listar depósitos
  async getDepositos(params: {
    page?: number;
    limit?: number;
    estado?: EstadoDeposito;
    cuentaBancariaId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<{ items: DepositoBancario[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/bancos/depositos${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Obtener depósitos pendientes de confirmación
  async getPendientes(): Promise<ApiResponse<DepositoBancario[]>> {
    return api.get('/bancos/depositos/pendientes');
  },

  // Obtener detalle de depósito
  async getDepositoById(id: number): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.get(`/bancos/depositos/${id}`);
  },

  // Marcar como depositado (cajero confirma que llevó al banco)
  async marcarDepositado(id: number, data?: { observaciones?: string }): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.put(`/bancos/depositos/${id}/depositado`, data || {});
  },

  // Confirmar depósito (admin con ficha bancaria)
  async confirmar(id: number, data: ConfirmarDepositoData): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.put(`/bancos/depositos/${id}/confirmar`, data);
  },

  // Rechazar depósito (admin)
  async rechazar(id: number, motivo: string): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.put(`/bancos/depositos/${id}/rechazar`, { motivo });
  },

  // Cancelar depósito (antes de depositar)
  async cancelar(id: number, motivo?: string): Promise<ApiResponse<{ data: DepositoBancario }>> {
    return api.put(`/bancos/depositos/${id}/cancelar`, { motivo });
  },

  // Reporte de conciliación
  async getReporteConciliacion(params: {
    cuentaBancariaId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/bancos/conciliacion${queryParams.toString() ? `?${queryParams}` : ''}`);
  },
};

export default bancosService;
