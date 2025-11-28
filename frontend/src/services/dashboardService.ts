// ABOUTME: Servicio API para obtener métricas del dashboard según el rol del usuario
// ABOUTME: Incluye métricas financieras, operativas y resumen ejecutivo para admin/socio

import axios from 'axios';
import { APP_CONFIG } from '../utils/constants';

const API_URL = APP_CONFIG.API_BASE_URL;

// Tipos de respuesta del dashboard
export interface OcupacionMetrics {
  habitaciones: {
    total: number;
    ocupadas: number;
    disponibles: number;
    mantenimiento: number;
  };
  quirofanos: {
    total: number;
    ocupados: number;
    disponibles: number;
    limpieza: number;
  };
  consultorios: {
    total: number;
    ocupados: number;
    disponibles: number;
  };
  general: {
    capacidadTotal: number;
    ocupadosTotal: number;
    porcentajeOcupacion: string | number;
  };
}

export interface FinancieroMetrics {
  ingresosMes: number;
  ingresosMesAnterior: number;
  crecimientoMensual: number;
  cuentasAbiertas: number;
  cuentasPorCobrar: {
    cantidad: number;
    monto: number;
  };
}

export interface OperativoMetrics {
  pacientesHospitalizados: number;
  totalPacientes: number;
  totalEmpleados: number;
}

export interface CajeroMetrics {
  cuentasAbiertas: number;
  ventasHoy: {
    cantidad: number;
    monto: number;
  };
  cobrosPendientes: number;
}

export interface EnfermeroMetrics {
  pacientesActivos: number;
  solicitudesPendientes: number;
  notificacionesSinLeer: number;
}

export interface AlmacenistaMetrics {
  productosStockBajo: number;
  solicitudesPendientes: number;
  movimientosHoy: number;
}

export interface MedicoMetrics {
  pacientesAsignados: number;
  cirugiasProgramadas: number;
  notasHoy: number;
}

export interface DashboardMetrics {
  timestamp: string;
  rol: string;
  ocupacion: OcupacionMetrics;
  // Métricas por rol (pueden estar presentes o no según el rol)
  financiero?: FinancieroMetrics;
  operativo?: OperativoMetrics;
  // Cajero
  cuentasAbiertas?: number;
  ventasHoy?: {
    cantidad: number;
    monto: number;
  };
  cobrosPendientes?: number;
  // Enfermero
  pacientesActivos?: number;
  solicitudesPendientes?: number;
  notificacionesSinLeer?: number;
  // Almacenista
  productosStockBajo?: number;
  movimientosHoy?: number;
  // Médico
  pacientesAsignados?: number;
  cirugiasProgramadas?: number;
  notasHoy?: number;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: DashboardMetrics;
  message: string;
}

export interface ExecutiveSummary {
  resumenEjecutivo: {
    ingresosTotales: number;
    utilidadNeta: number;
    pacientesAtendidos: number;
    ocupacionPromedio: number;
    satisfaccionGeneral: number;
  };
  detalles: {
    totalHabitaciones: number;
    habitacionesOcupadas: number;
    empleadosActivos: number;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface ExecutiveSummaryResponse {
  success: boolean;
  data: ExecutiveSummary;
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const dashboardService = {
  /**
   * Obtener métricas del dashboard según el rol del usuario
   * @returns {Promise<DashboardMetricsResponse>} Métricas personalizadas por rol
   */
  async getMetrics(): Promise<DashboardMetricsResponse> {
    const response = await axios.get<DashboardMetricsResponse>(
      `${API_URL}/dashboard/metrics`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  /**
   * Obtener resumen ejecutivo (solo admin y socio)
   * @returns {Promise<ExecutiveSummaryResponse>} Resumen ejecutivo con métricas financieras
   */
  async getSummary(): Promise<ExecutiveSummaryResponse> {
    const response = await axios.get<ExecutiveSummaryResponse>(
      `${API_URL}/dashboard/summary`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  /**
   * Formatear moneda MXN
   * @param value Valor numérico
   * @returns String formateado en MXN
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Formatear porcentaje
   * @param value Valor numérico
   * @returns String con porcentaje
   */
  formatPercentage(value: number): string {
    return `${Number(value).toFixed(1)}%`;
  },

  /**
   * Formatear número con separadores de miles
   * @param value Valor numérico
   * @returns String formateado
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX').format(value);
  },
};

export default dashboardService;
