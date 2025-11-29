// ABOUTME: Servicio para gestionar costos operativos del hospital
// ABOUTME: Proporciona CRUD para costos fijos como agua, luz, nómina, etc.

import { api } from '@/utils/api';

export interface CostoOperativo {
  id: number;
  nombre: string;
  categoria: 'servicios_basicos' | 'nomina' | 'mantenimiento' | 'suministros' | 'administrativo' | 'otro';
  monto: number;
  periodicidad: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostoOperativoFormData {
  nombre: string;
  categoria: string;
  monto: number;
  periodicidad: string;
  descripcion?: string;
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
  async getCostosOperativos(filters: { categoria?: string; activo?: boolean } = {}) {
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
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener configuración');
    }
  }

  // Actualizar configuración de costos
  async updateConfig(config: Partial<CostosConfig>) {
    try {
      const response = await api.put('/costs/config', config);
      return response;
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar configuración');
    }
  }

  // Utilidades para el frontend
  getCategoriaLabel(categoria: string): string {
    const categorias: Record<string, string> = {
      servicios_basicos: 'Servicios Básicos',
      nomina: 'Nómina',
      mantenimiento: 'Mantenimiento',
      suministros: 'Suministros',
      administrativo: 'Administrativo',
      otro: 'Otro'
    };
    return categorias[categoria] || categoria;
  }

  getPeriodicidadLabel(periodicidad: string): string {
    const periodicidades: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
      bimestral: 'Bimestral',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    };
    return periodicidades[periodicidad] || periodicidad;
  }

  getCategoriaIcon(categoria: string): string {
    const iconos: Record<string, string> = {
      servicios_basicos: '💡',
      nomina: '👥',
      mantenimiento: '🔧',
      suministros: '📦',
      administrativo: '📋',
      otro: '📌'
    };
    return iconos[categoria] || '📌';
  }

  // Calcular monto mensual equivalente
  calcularMontoMensual(monto: number, periodicidad: string): number {
    const factores: Record<string, number> = {
      diario: 30,
      semanal: 4.33,
      quincenal: 2,
      mensual: 1,
      bimestral: 0.5,
      trimestral: 0.333,
      semestral: 0.167,
      anual: 0.083
    };
    return monto * (factores[periodicidad] || 1);
  }
}

export default new CostsService();
