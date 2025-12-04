// ABOUTME: Servicio para gestión de comisiones médicas del 5%.
// ABOUTME: Permite calcular, listar, generar y pagar comisiones a médicos.

import { api } from '@/utils/api';

// ==============================================
// TIPOS E INTERFACES
// ==============================================

export type EstadoComision = 'PENDIENTE' | 'PAGADA' | 'ANULADA';

export interface CuentaComision {
  cuentaId: number;
  paciente: string;
  expediente?: string;
  totalCuenta: number;
  fechaCierre: string;
}

export interface ComisionCalculada {
  medicoId: number;
  nombreMedico: string;
  especialidad?: string;
  cedulaProfesional?: string;
  cuentas: CuentaComision[];
  totalCuentas: number;
  totalFacturado: number;
  porcentaje: number;
  montoComision: number;
}

export interface ResumenCalculo {
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
  totalMedicos: number;
  totalCuentas: number;
  totalFacturado: number;
  totalComisiones: number;
}

export interface CalculoComisionesResponse {
  resumen: ResumenCalculo;
  comisiones: ComisionCalculada[];
}

export interface ComisionMedica {
  id: number;
  medicoId: number;
  fechaInicio: string;
  fechaFin: string;
  nombreMedico: string;
  especialidad?: string;
  cedulaProfesional?: string;
  totalCuentas: number;
  montoFacturado: number;
  porcentaje: number;
  montoComision: number;
  estado: EstadoComision;
  fechaPago?: string;
  firmaMedico?: string;
  fechaFirmaMedico?: string;
  firmaAdmin?: string;
  nombreAdmin?: string;
  fechaFirmaAdmin?: string;
  pdfComprobante?: string;
  createdAt: string;
  updatedAt: string;
  medico?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    especialidad?: string;
  };
  creadoPor?: {
    id: number;
    username: string;
  };
}

export interface ComisionesResponse {
  data: ComisionMedica[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ComisionStats {
  porEstado: {
    pendientes: number;
    pagadas: number;
    anuladas: number;
  };
  totalPagado: number;
  mesActual: {
    cantidad: number;
    monto: number;
  };
}

export interface GenerarComisionData {
  medicoId: number;
  fechaInicio: string;
  fechaFin: string;
  nombreMedico: string;
  especialidad?: string;
  cedulaProfesional?: string;
  totalCuentas: number;
  montoFacturado: number;
  montoComision: number;
}

export interface FirmaData {
  firma: string;
  nombre: string;
}

// ==============================================
// SERVICIO DE COMISIONES MÉDICAS
// ==============================================

class ComisionesService {

  /**
   * Calcular comisiones para un periodo
   */
  async calcularComisiones(fechaInicio: string, fechaFin: string): Promise<CalculoComisionesResponse> {
    const response = await api.get('/comisiones/calcular', {
      params: { fechaInicio, fechaFin }
    });
    return response.data as CalculoComisionesResponse;
  }

  /**
   * Generar registro de comisión para un médico
   */
  async generarComision(data: GenerarComisionData): Promise<{ message: string; data: ComisionMedica }> {
    const response = await api.post('/comisiones/generar', data);
    return response as unknown as { message: string; data: ComisionMedica };
  }

  /**
   * Listar comisiones con filtros
   */
  async getComisiones(params?: {
    estado?: EstadoComision;
    medicoId?: number;
    page?: number;
    limit?: number;
  }): Promise<ComisionesResponse> {
    const response = await api.get('/comisiones', { params });
    return response as unknown as ComisionesResponse;
  }

  /**
   * Obtener detalle de una comisión
   */
  async getComisionById(id: number): Promise<ComisionMedica> {
    const response = await api.get(`/comisiones/${id}`);
    return response.data as ComisionMedica;
  }

  /**
   * Registrar firma del médico
   */
  async firmarMedico(id: number, firmaMedico: string, nombreMedico: string): Promise<{ message: string; data: ComisionMedica }> {
    const response = await api.put(`/comisiones/${id}/firmar-medico`, { firmaMedico, nombreMedico });
    return response as unknown as { message: string; data: ComisionMedica };
  }

  /**
   * Pagar comisión con firma del admin
   */
  async pagarComision(id: number, firmaAdmin: string, nombreAdmin: string): Promise<{ message: string; data: ComisionMedica & { tienePdf: boolean } }> {
    const response = await api.put(`/comisiones/${id}/pagar`, { firmaAdmin, nombreAdmin });
    return response as unknown as { message: string; data: ComisionMedica & { tienePdf: boolean } };
  }

  /**
   * Anular comisión
   */
  async anularComision(id: number): Promise<{ message: string; data: ComisionMedica }> {
    const response = await api.put(`/comisiones/${id}/anular`);
    return response as unknown as { message: string; data: ComisionMedica };
  }

  /**
   * Descargar PDF del comprobante
   */
  async downloadPdf(id: number): Promise<Blob> {
    // Usar api.client directamente para peticiones blob ya que api.get retorna response.data
    // y para blob necesitamos que response.data sea el blob directamente
    const response = await api.client.get(`/comisiones/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }

  /**
   * Regenerar PDF de una comisión pagada que no tiene PDF
   */
  async regenerarPdf(id: number): Promise<{ message: string; data: ComisionMedica & { tienePdf: boolean } }> {
    const response = await api.put(`/comisiones/${id}/regenerar-pdf`);
    return response as unknown as { message: string; data: ComisionMedica & { tienePdf: boolean } };
  }

  /**
   * Obtener estadísticas de comisiones
   */
  async getStats(): Promise<ComisionStats> {
    const response = await api.get('/comisiones/stats/resumen');
    return response.data as ComisionStats;
  }

  // Helpers
  getEstadoLabel(estado: EstadoComision): string {
    const labels: Record<EstadoComision, string> = {
      PENDIENTE: 'Pendiente',
      PAGADA: 'Pagada',
      ANULADA: 'Anulada'
    };
    return labels[estado] || estado;
  }

  getEstadoColor(estado: EstadoComision): 'warning' | 'success' | 'error' | 'default' {
    const colors: Record<EstadoComision, 'warning' | 'success' | 'error' | 'default'> = {
      PENDIENTE: 'warning',
      PAGADA: 'success',
      ANULADA: 'error'
    };
    return colors[estado] || 'default';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPeriodo(fechaInicio: string, fechaFin: string): string {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return `${inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
}

export default new ComisionesService();
