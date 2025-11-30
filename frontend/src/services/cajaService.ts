// ABOUTME: Service para el módulo de Caja Diaria
// Maneja apertura, cierre, arqueo y movimientos de caja

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api.types';

// Tipos
export type TurnoCaja = 'matutino' | 'vespertino' | 'nocturno';
export type EstadoCaja = 'abierta' | 'en_arqueo' | 'cerrada';
export type TipoMovimientoCaja = 'ingreso' | 'egreso' | 'fondo_inicial' | 'retiro_parcial' | 'deposito_banco';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque' | 'mixto';

export interface CajaDiaria {
  id: number;
  numero: string;
  cajeroId: number;
  turno: TurnoCaja;
  saldoInicial: number;
  saldoFinalSistema?: number;
  saldoFinalContado?: number;
  diferencia?: number;
  estado: EstadoCaja;
  fechaApertura: string;
  fechaCierre?: string;
  observaciones?: string;
  justificacionDif?: string;
  autorizadorId?: number;
  cajero?: {
    id: number;
    username: string;
    empleado?: {
      nombre: string;
      apellidos: string;
    };
  };
  autorizador?: {
    id: number;
    username: string;
  };
  movimientos?: MovimientoCaja[];
}

export interface MovimientoCaja {
  id: number;
  cajaId: number;
  tipo: TipoMovimientoCaja;
  monto: number;
  concepto: string;
  referencia?: string;
  metodoPago?: MetodoPago;
  cajeroId: number;
  fecha: string;
  observaciones?: string;
  cajero?: {
    username: string;
  };
}

export interface AbrirCajaData {
  turno: TurnoCaja;
  saldoInicial: number;
  observaciones?: string;
}

export interface CerrarCajaData {
  saldoFinalContado: number;
  justificacionDif?: string;
  observaciones?: string;
}

export interface MovimientoData {
  tipo: TipoMovimientoCaja;
  monto: number;
  concepto: string;
  referencia?: string;
  metodoPago?: MetodoPago;
  observaciones?: string;
}

export interface ArqueoData {
  saldoContado: number;
  observaciones?: string;
}

export interface ResumenCaja {
  cajaId: number;
  numero: string;
  estado: EstadoCaja;
  turno: TurnoCaja;
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoEsperado: number;
  cantidadMovimientos: number;
  movimientosPorTipo: Record<TipoMovimientoCaja, { cantidad: number; total: number }>;
  ultimoMovimiento?: MovimientoCaja;
}

export const cajaService = {
  // Abrir caja del día
  async abrirCaja(data: AbrirCajaData): Promise<ApiResponse<{ caja: CajaDiaria }>> {
    return api.post('/caja/abrir', data);
  },

  // Obtener caja actual del cajero logueado
  async getCajaActual(): Promise<ApiResponse<{ caja: CajaDiaria | null; tieneCajaAbierta: boolean }>> {
    return api.get('/caja/actual');
  },

  // Obtener resumen de la caja actual
  async getResumen(): Promise<ApiResponse<{ resumen: ResumenCaja }>> {
    return api.get('/caja/resumen');
  },

  // Registrar movimiento (ingreso/egreso)
  async registrarMovimiento(data: MovimientoData): Promise<ApiResponse<{ movimiento: MovimientoCaja; resumen: ResumenCaja }>> {
    return api.post('/caja/movimiento', data);
  },

  // Realizar arqueo (conteo físico)
  async realizarArqueo(data: ArqueoData): Promise<ApiResponse<{ caja: CajaDiaria; diferencia: number }>> {
    return api.post('/caja/arqueo', data);
  },

  // Cerrar caja
  async cerrarCaja(data: CerrarCajaData): Promise<ApiResponse<{ caja: CajaDiaria; resumenFinal: ResumenCaja }>> {
    return api.put('/caja/cerrar', data);
  },

  // Historial de cajas (para admin)
  async getHistorial(params: {
    cajeroId?: number;
    estado?: EstadoCaja;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{ cajas: CajaDiaria[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/caja/historial${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  // Detalle de una caja específica
  async getCajaById(id: number): Promise<ApiResponse<{ caja: CajaDiaria; resumen: ResumenCaja }>> {
    return api.get(`/caja/${id}`);
  },

  // Reporte diario (para impresión)
  async getReporteDiario(id: number): Promise<ApiResponse<{ reporte: any }>> {
    return api.get(`/caja/${id}/reporte-diario`);
  },
};

export default cajaService;
