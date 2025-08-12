import { api } from '@/utils/api';

export interface AuditRecord {
  id: number;
  modulo: string;
  tipoOperacion: string;
  entidadTipo: string;
  entidadId: number;
  usuarioId: number;
  usuarioNombre: string;
  rolUsuario: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  motivo?: string;
  causaCancelacionId?: number;
  ipAddress?: string;
  createdAt: string;
  usuario: {
    id: number;
    username: string;
    rol: string;
  };
  causaCancelacion?: {
    codigo: string;
    descripcion: string;
    categoria?: string;
  };
}

export interface CancellationCause {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: string;
  requiereNota: boolean;
  requiereAutorizacion: boolean;
  activo: boolean;
}

export interface AuditStats {
  totalOperaciones: number;
  cancelaciones: number;
  operacionesPorModulo: Array<{
    modulo: string;
    _count: { id: number };
  }>;
  operacionesPorUsuario: Array<{
    usuarioId: number;
    usuarioNombre: string;
    rolUsuario: string;
    operaciones: number;
  }>;
}

class AuditService {
  /**
   * Obtener historial de auditoría para una entidad específica
   */
  async getAuditTrail(entityType: string, entityId: number): Promise<AuditRecord[]> {
    try {
      const response = await api.get(`/audit/trail/${entityType}/${entityId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw new Error('Error al obtener el historial de auditoría');
    }
  }

  /**
   * Obtener auditoría por módulo
   */
  async getModuleAudit(
    module: string, 
    filters?: {
      limit?: number;
      offset?: number;
      userId?: number;
      startDate?: string;
      endDate?: string;
      tipoOperacion?: string;
    }
  ): Promise<{
    records: AuditRecord[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get(`/audit/module/${module}`, {
        params: filters
      });
      return response.data?.data || { records: [], total: 0, hasMore: false };
    } catch (error) {
      console.error('Error fetching module audit:', error);
      throw new Error('Error al obtener auditoría del módulo');
    }
  }

  /**
   * Obtener actividad de un usuario
   */
  async getUserActivity(userId: number, options?: { limit?: number; offset?: number }): Promise<AuditRecord[]> {
    try {
      const response = await api.get(`/audit/user/${userId}`, {
        params: options
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Error al obtener actividad del usuario');
    }
  }

  /**
   * Obtener estadísticas de auditoría (solo admin)
   */
  async getAuditStats(dateRange?: { startDate?: string; endDate?: string }): Promise<AuditStats> {
    try {
      const response = await api.get('/audit/stats', {
        params: dateRange
      });
      return response.data?.data || {
        totalOperaciones: 0,
        cancelaciones: 0,
        operacionesPorModulo: [],
        operacionesPorUsuario: []
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw new Error('Error al obtener estadísticas de auditoría');
    }
  }

  /**
   * Obtener causas de cancelación disponibles
   */
  async getCancellationCauses(): Promise<CancellationCause[]> {
    try {
      const response = await api.get('/audit/cancellation-causes');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching cancellation causes:', error);
      throw new Error('Error al obtener causas de cancelación');
    }
  }

  /**
   * Formatear tipo de operación para mostrar
   */
  formatOperationType(tipoOperacion: string): string {
    const operations: { [key: string]: string } = {
      'POST': 'Creación',
      'PUT': 'Modificación',
      'DELETE': 'Eliminación',
      'PATCH': 'Actualización',
      'GET': 'Consulta'
    };

    const method = tipoOperacion.split(' ')[0];
    const path = tipoOperacion.split(' ')[1] || '';

    let operation = operations[method] || tipoOperacion;
    
    // Agregar contexto específico basado en la ruta
    if (path.includes('cancel')) operation = 'Cancelación';
    if (path.includes('descuento')) operation = 'Aplicar Descuento';
    if (path.includes('discharge')) operation = 'Alta Médica';
    if (path.includes('close')) operation = 'Cierre de Cuenta';

    return operation;
  }

  /**
   * Obtener color para el tipo de operación
   */
  getOperationColor(tipoOperacion: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' {
    if (tipoOperacion.includes('POST')) return 'success';
    if (tipoOperacion.includes('PUT') || tipoOperacion.includes('PATCH')) return 'warning';
    if (tipoOperacion.includes('DELETE') || tipoOperacion.includes('cancel')) return 'error';
    if (tipoOperacion.includes('descuento')) return 'secondary';
    return 'primary';
  }

  /**
   * Obtener ícono para el tipo de operación
   */
  getOperationIcon(tipoOperacion: string): string {
    if (tipoOperacion.includes('POST')) return 'add';
    if (tipoOperacion.includes('PUT') || tipoOperacion.includes('PATCH')) return 'edit';
    if (tipoOperacion.includes('DELETE') || tipoOperacion.includes('cancel')) return 'delete';
    if (tipoOperacion.includes('descuento')) return 'money_off';
    if (tipoOperacion.includes('discharge')) return 'exit_to_app';
    if (tipoOperacion.includes('close')) return 'lock';
    return 'info';
  }

  /**
   * Exportar auditoría a CSV
   */
  exportToCSV(records: AuditRecord[], filename: string = 'auditoria.csv'): void {
    try {
      const headers = [
        'Fecha',
        'Módulo',
        'Operación',
        'Usuario',
        'Rol',
        'Entidad',
        'ID Entidad',
        'Motivo',
        'IP'
      ];

      const csvContent = [
        headers.join(','),
        ...records.map(record => [
          new Date(record.createdAt).toLocaleString(),
          record.modulo,
          this.formatOperationType(record.tipoOperacion),
          record.usuarioNombre,
          record.rolUsuario,
          record.entidadTipo,
          record.entidadId,
          record.motivo || '',
          record.ipAddress || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Error al exportar auditoría a CSV');
    }
  }
}

export default new AuditService();