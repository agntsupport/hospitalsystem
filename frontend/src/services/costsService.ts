// ABOUTME: Servicio para gestionar costos operativos del hospital
// ABOUTME: Proporciona CRUD para costos fijos como agua, luz, nómina, etc.

import { api } from '@/utils/api';

// Tipo que coincide con el modelo real del backend (Prisma)
export interface CostoOperativo {
  id: number;
  categoria: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  periodo: string; // ISO date string
  recurrente: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostoOperativoFormData {
  categoria: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  periodo: string; // ISO date string (YYYY-MM-DD)
  recurrente?: boolean;
  activo?: boolean;
}

export interface CostosConfig {
  porcentajeCostoServicio: number;
}

export interface CostosStats {
  totalMensual: number;
  totalAnual: number;
  porCategoria: Record<string, number>;
  desglose: {
    serviciosBasicos: number;
    nomina: number;
    mantenimiento: number;
    suministros: number;
    administrativo: number;
    otro: number;
  };
}

class CostsService {
  // Obtener lista de costos operativos
  async getCostosOperativos(filters: { categoria?: string; activo?: boolean; periodo?: string } = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      const response = await api.get(`/costs/operational?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener costos operativos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener costos operativos');
    }
  }

  // Obtener estadísticas de costos
  async getCostosStats(): Promise<CostosStats> {
    try {
      const response = await api.get('/costs/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas de costos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  // Crear nuevo costo operativo
  async createCostoOperativo(data: CostoOperativoFormData) {
    try {
      const response = await api.post('/costs/operational', data);
      return response;
    } catch (error: any) {
      console.error('Error al crear costo operativo:', error);
      throw new Error(error.response?.data?.message || 'Error al crear costo operativo');
    }
  }

  // Actualizar costo operativo
  async updateCostoOperativo(id: number, data: Partial<CostoOperativoFormData>) {
    try {
      const response = await api.put(`/costs/operational/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error al actualizar costo operativo:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar costo operativo');
    }
  }

  // Eliminar costo operativo
  async deleteCostoOperativo(id: number) {
    try {
      const response = await api.delete(`/costs/operational/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error al eliminar costo operativo:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar costo operativo');
    }
  }

  // Obtener configuración de costos
  async getConfig(): Promise<CostosConfig> {
    try {
      const response = await api.get('/costs/config');
      // La config viene como array, buscar el porcentaje
      const configArray = response.data || [];
      const porcentajeConfig = configArray.find((c: any) => c.clave === 'porcentaje_costo_servicio');
      return {
        porcentajeCostoServicio: porcentajeConfig ? parseFloat(porcentajeConfig.valor) : 60
      };
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      // Retornar valor por defecto en caso de error
      return { porcentajeCostoServicio: 60 };
    }
  }

  // Actualizar configuración de costos
  async updateConfig(config: Partial<CostosConfig>) {
    try {
      const response = await api.put('/costs/config/porcentaje_costo_servicio', {
        valor: config.porcentajeCostoServicio
      });
      return response;
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar configuración');
    }
  }

  // Utilidades para el frontend
  getCategoriaLabel(categoria: string): string {
    const categorias: Record<string, string> = {
      nomina: 'Nómina',
      servicios_publicos: 'Servicios Públicos',
      mantenimiento: 'Mantenimiento',
      insumos_generales: 'Insumos Generales',
      renta_inmueble: 'Renta de Inmueble',
      seguros: 'Seguros',
      depreciacion: 'Depreciación',
      marketing: 'Marketing',
      capacitacion: 'Capacitación',
      otros: 'Otros'
    };
    return categorias[categoria] || categoria;
  }

  getCategoriaIcon(categoria: string): string {
    const iconos: Record<string, string> = {
      nomina: '👥',
      servicios_publicos: '💡',
      mantenimiento: '🔧',
      insumos_generales: '📦',
      renta_inmueble: '🏠',
      seguros: '🛡️',
      depreciacion: '📉',
      marketing: '📢',
      capacitacion: '📚',
      otros: '📌'
    };
    return iconos[categoria] || '📌';
  }

  // Formatear fecha de periodo para mostrar
  formatPeriodo(periodoISO: string): string {
    const date = new Date(periodoISO);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  }

  // Obtener fecha actual para nuevo costo
  getCurrentPeriodo(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
}

export default new CostsService();
