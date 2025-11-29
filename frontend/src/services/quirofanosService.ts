import { api } from '@/utils/api';

export interface Quirofano {
  id: number;
  numero: string;
  tipo: 'cirugia_general' | 'cirugia_cardiaca' | 'cirugia_neurologica' | 'cirugia_ortopedica' | 'cirugia_ambulatoria';
  especialidad?: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento' | 'limpieza' | 'preparacion';
  descripcion?: string;
  equipamiento?: string;
  capacidadEquipo: number;
  precioHora?: number;
  costoHora?: number | null; // Costo operativo por hora (editable por admin)
  ocupado?: boolean;
  citasActivas?: number;
  cirugiasActivas?: number;
}

export interface QuirofanoStats {
  resumen: {
    totalQuirofanos: number;
    disponibles: number;
    ocupados: number;
    mantenimiento: number;
    cirugiasHoy: number;
    porcentajeOcupacion: number;
  };
  distribucion: {
    porTipo: Record<string, number>;
    porEstado: Record<string, number>;
  };
}

export interface QuirofanoFormData {
  numero: string;
  tipo: string;
  especialidad?: string | null;
  descripcion?: string | null;
  equipamiento?: string | null;
  capacidadEquipo: number;
  precioHora?: number | null;
  costoHora?: number | null;
}

export interface QuirofanoFilters {
  estado?: string;
  tipo?: string;
  especialidad?: string;
  disponible?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Tipos para Cirugías
export type EstadoCirugia = 'programada' | 'en_progreso' | 'completada' | 'cancelada' | 'reprogramada';

export interface CirugiaQuirofano {
  id: number;
  quirofanoId: number;
  pacienteId: number;
  medicoId: number;
  tipoIntervencion: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: EstadoCirugia;
  observaciones?: string;
  equipoMedico?: number[];
  equipoMedicoDetalle?: any[];
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  quirofano?: Quirofano;
  paciente?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    telefono?: string;
  };
  medico?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    especialidad?: string;
    telefono?: string;
    email?: string;
  };
}

export interface CirugiaFormData {
  quirofanoId: number;
  pacienteId: number;
  medicoId: number;
  tipoIntervencion: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  equipoMedico?: number[];
}

export interface CirugiaFilters {
  estado?: string;
  quirofanoId?: number;
  medicoId?: number;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class QuirofanosService {
  // Obtener lista de quirófanos con filtros
  async getQuirofanos(filters: QuirofanoFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/quirofanos?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener quirófanos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener quirófanos');
    }
  }

  // Obtener estadísticas de quirófanos
  async getQuirofanosStats(): Promise<QuirofanoStats> {
    try {
      const response = await api.get('/quirofanos/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas de quirófanos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  // Obtener quirófano por ID
  async getQuirofanoById(id: number) {
    try {
      const response = await api.get(`/quirofanos/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener quirófano:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener quirófano');
    }
  }

  // Crear nuevo quirófano
  async createQuirofano(data: QuirofanoFormData) {
    try {
      const response = await api.post('/quirofanos', data);
      return response;
    } catch (error: any) {
      console.error('Error al crear quirófano:', error);
      throw new Error(error.response?.data?.message || 'Error al crear quirófano');
    }
  }

  // Actualizar quirófano
  async updateQuirofano(id: number, data: Partial<QuirofanoFormData>) {
    try {
      const response = await api.put(`/quirofanos/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error al actualizar quirófano:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar quirófano');
    }
  }

  // Cambiar estado del quirófano
  async updateQuirofanoStatus(id: number, estado: string, motivo?: string) {
    try {
      const response = await api.put(`/quirofanos/${id}/estado`, { estado, motivo });
      return response;
    } catch (error: any) {
      console.error('Error al cambiar estado del quirófano:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar estado');
    }
  }

  // Eliminar quirófano (soft delete)
  async deleteQuirofano(id: number) {
    try {
      const response = await api.delete(`/quirofanos/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error al eliminar quirófano:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar quirófano');
    }
  }

  // Obtener números disponibles y sugerencias
  async getAvailableNumbers() {
    try {
      const response = await api.get('/quirofanos/available-numbers');
      return response;
    } catch (error: any) {
      console.error('Error al obtener números disponibles:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener números disponibles');
    }
  }

  // Obtener quirófanos disponibles para una fecha/hora
  async getQuirofanosDisponibles(fecha: string, horaInicio: string, horaFin: string, tipo?: string) {
    try {
      const params = new URLSearchParams({
        fecha,
        horaInicio,
        horaFin,
        ...(tipo && { tipo })
      });

      const response = await api.get(`/quirofanos/disponibles/horario?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener quirófanos disponibles:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar disponibilidad');
    }
  }

  // Utilidades para el frontend
  getTipoLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      cirugia_general: 'Cirugía General',
      cirugia_cardiaca: 'Cirugía Cardíaca',
      cirugia_neurologica: 'Neurocirugía',
      cirugia_ortopedica: 'Cirugía Ortopédica',
      cirugia_ambulatoria: 'Cirugía Ambulatoria'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoLabel(estado: string): string {
    const estados: Record<string, string> = {
      disponible: 'Disponible',
      ocupado: 'Ocupado',
      mantenimiento: 'Mantenimiento',
      limpieza: 'En Limpieza',
      preparacion: 'En Preparación'
    };
    return estados[estado] || estado;
  }

  getEstadoColor(estado: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    const colores: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      disponible: 'success',
      ocupado: 'error',
      mantenimiento: 'warning',
      limpieza: 'info',
      preparacion: 'info'
    };
    return colores[estado] || 'default';
  }

  // ==============================================
  // FUNCIONES PARA CIRUGÍAS
  // ==============================================

  // Programar nueva cirugía
  async programarCirugia(data: CirugiaFormData) {
    try {
      const response = await api.post('/quirofanos/cirugias', data);
      return response;
    } catch (error: any) {
      console.error('Error al programar cirugía:', error);
      throw new Error(error.response?.data?.message || 'Error al programar cirugía');
    }
  }

  // Obtener lista de cirugías
  async getCirugias(filters: CirugiaFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/quirofanos/cirugias?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener cirugías:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener cirugías');
    }
  }

  // Obtener cirugía por ID
  async getCirugiaById(id: number) {
    try {
      const response = await api.get(`/quirofanos/cirugias/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error al obtener cirugía:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener cirugía');
    }
  }

  // Actualizar cirugía
  async actualizarCirugia(id: number, data: Partial<CirugiaFormData>) {
    try {
      const response = await api.put(`/quirofanos/cirugias/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error al actualizar cirugía:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar cirugía');
    }
  }

  // Actualizar estado de cirugía
  async actualizarEstadoCirugia(id: number, estado: EstadoCirugia, observaciones?: string, motivo?: string) {
    try {
      const response = await api.put(`/quirofanos/cirugias/${id}/estado`, { 
        estado, 
        observaciones,
        motivo 
      });
      return response;
    } catch (error: any) {
      console.error('Error al actualizar estado de cirugía:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar estado');
    }
  }

  // Cancelar cirugía
  async cancelarCirugia(id: number, motivo: string) {
    try {
      const response = await api.delete(`/quirofanos/cirugias/${id}`, {
        data: { motivo }
      });
      return response;
    } catch (error: any) {
      console.error('Error al cancelar cirugía:', error);
      throw new Error(error.response?.data?.message || 'Error al cancelar cirugía');
    }
  }
}

export default new QuirofanosService();