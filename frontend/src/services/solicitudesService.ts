import { api } from '@/utils/api';

// ==============================================
// TIPOS E INTERFACES
// ==============================================

export type EstadoSolicitud = 'SOLICITADO' | 'NOTIFICADO' | 'PREPARANDO' | 'LISTO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'APLICADO' | 'CANCELADO';
export type PrioridadSolicitud = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export interface SolicitudProducto {
  id: number;
  numero: string;
  pacienteId: number;
  cuentaPacienteId: number;
  solicitanteId: number;
  almacenistaId?: number;
  estado: EstadoSolicitud;
  prioridad: PrioridadSolicitud;
  observaciones?: string;
  fechaEntrega?: string;
  fechaConfirmacion?: string;
  createdAt: string;
  updatedAt: string;
  paciente: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    numeroExpediente?: string;
  };
  cuentaPaciente: {
    id: number;
    tipoAtencion: string;
    estado: string;
  };
  solicitante: {
    id: number;
    username: string;
    nombre?: string;
    apellidos?: string;
    rol: string;
  };
  almacenista?: {
    id: number;
    username: string;
    nombre?: string;
    apellidos?: string;
  };
  detalles: DetalleSolicitudProducto[];
  historial?: HistorialSolicitud[];
}

export interface DetalleSolicitudProducto {
  id: number;
  solicitudId: number;
  productoId: number;
  cantidadSolicitada: number;
  cantidadEntregada?: number;
  observaciones?: string;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo?: number;
  };
}

export interface HistorialSolicitud {
  id: number;
  solicitudId: number;
  estadoAnterior?: EstadoSolicitud;
  estadoNuevo: EstadoSolicitud;
  usuarioId: number;
  observaciones?: string;
  createdAt: string;
  usuario: {
    id: number;
    username: string;
    nombre?: string;
    apellidos?: string;
    rol: string;
  };
}

export interface CreateSolicitudData {
  pacienteId: number;
  cuentaPacienteId: number;
  prioridad?: PrioridadSolicitud;
  observaciones?: string;
  productos: {
    productoId: number;
    cantidadSolicitada: number;
    observaciones?: string;
  }[];
}

export interface SolicitudesResponse {
  data: SolicitudProducto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SolicitudStats {
  totalSolicitudes: number;
  solicitudesPorEstado: { estado: EstadoSolicitud; cantidad: number }[];
  solicitudesPorPrioridad: { prioridad: PrioridadSolicitud; cantidad: number }[];
  solicitudesHoy: number;
}

// ==============================================
// SERVICIO DE SOLICITUDES
// ==============================================

class SolicitudesService {
  
  // Obtener lista de solicitudes con filtros y paginación
  async getSolicitudes(params?: {
    estado?: EstadoSolicitud;
    prioridad?: PrioridadSolicitud;
    solicitanteId?: number;
    almacenistaId?: number;
    page?: number;
    limit?: number;
  }): Promise<SolicitudesResponse> {
    const response = await api.get('/solicitudes', { params });
    return response as unknown as SolicitudesResponse;
  }

  // Obtener una solicitud específica
  async getSolicitudById(id: number): Promise<SolicitudProducto> {
    const response = await api.get(`/solicitudes/${id}`);
    return response.data as SolicitudProducto;
  }

  // Crear nueva solicitud
  async createSolicitud(data: CreateSolicitudData): Promise<{ message: string; solicitud: SolicitudProducto }> {
    const response = await api.post('/solicitudes', data);
    return response as unknown as { message: string; solicitud: SolicitudProducto };
  }

  // Asignar solicitud a almacenista (solo almacenistas)
  async asignarSolicitud(id: number): Promise<{ message: string; solicitud: SolicitudProducto }> {
    const response = await api.put(`/solicitudes/${id}/asignar`);
    return response as unknown as { message: string; solicitud: SolicitudProducto };
  }

  // Marcar solicitud como lista para entrega (solo almacenistas)
  // Esto notifica al enfermero/médico que puede pasar a recoger
  async marcarListo(id: number): Promise<{ message: string; solicitud: SolicitudProducto }> {
    const response = await api.put(`/solicitudes/${id}/listo`);
    return response as unknown as { message: string; solicitud: SolicitudProducto };
  }

  // Marcar solicitud como entregada (solo almacenistas)
  async entregarSolicitud(id: number, observaciones?: string): Promise<{ message: string }> {
    const response = await api.put(`/solicitudes/${id}/entregar`, { observaciones });
    return response as unknown as { message: string };
  }

  // Confirmar recepción de solicitud (solo solicitantes)
  async confirmarSolicitud(id: number, observaciones?: string): Promise<{ message: string; solicitud: SolicitudProducto }> {
    const response = await api.put(`/solicitudes/${id}/confirmar`, { observaciones });
    return response as unknown as { message: string; solicitud: SolicitudProducto };
  }

  // Obtener estadísticas de solicitudes
  async getSolicitudStats(): Promise<SolicitudStats> {
    const response = await api.get('/solicitudes/stats/resumen');
    return response.data as SolicitudStats;
  }

  // Validar disponibilidad de productos
  async validarDisponibilidadProductos(productos: { productoId: number; cantidad: number }[]): Promise<{
    disponible: boolean;
    productos: { productoId: number; stockActual: number; stockSolicitado: number; disponible: boolean }[];
  }> {
    try {
      const productosIds = productos.map(p => p.productoId);
      const productosData = await api.get('/inventory/products', { 
        params: { ids: productosIds.join(',') } 
      });
      
      // Manejar la estructura de respuesta del backend: {success, data: {products: [...]}}
      const productosArray = productosData.data?.products || [];
      
      const validacion = productos.map(producto => {
        const productoData = productosArray.find((p: any) => p.id === producto.productoId);
        return {
          productoId: producto.productoId,
          stockActual: productoData?.stockActual || 0,
          stockSolicitado: producto.cantidad,
          disponible: (productoData?.stockActual || 0) >= producto.cantidad
        };
      });

      return {
        disponible: validacion.every(v => v.disponible),
        productos: validacion
      };
    } catch (error) {
      console.error('Error validando disponibilidad:', error);
      return {
        disponible: false,
        productos: []
      };
    }
  }

  // Obtener productos más solicitados
  async getProductosMasSolicitados(limit: number = 10): Promise<{
    productoId: number;
    producto: string;
    totalSolicitado: number;
  }[]> {
    try {
      // Este endpoint podría implementarse en el backend si se necesita
      // Por ahora retornamos un array vacío
      return [];
    } catch (error) {
      console.error('Error obteniendo productos más solicitados:', error);
      return [];
    }
  }

  // Helpers para labels
  getEstadoLabel(estado: EstadoSolicitud): string {
    const labels: Record<EstadoSolicitud, string> = {
      SOLICITADO: 'Solicitado',
      NOTIFICADO: 'Notificado',
      PREPARANDO: 'En Preparación',
      LISTO_ENTREGA: 'Listo para Entrega',
      ENTREGADO: 'Entregado',
      RECIBIDO: 'Recibido',
      APLICADO: 'Aplicado',
      CANCELADO: 'Cancelado'
    };
    return labels[estado] || estado;
  }

  getPrioridadLabel(prioridad: PrioridadSolicitud): string {
    const labels: Record<PrioridadSolicitud, string> = {
      BAJA: 'Baja',
      NORMAL: 'Normal',
      ALTA: 'Alta',
      URGENTE: 'Urgente'
    };
    return labels[prioridad] || prioridad;
  }

  getEstadoColor(estado: EstadoSolicitud): string {
    const colors: Record<EstadoSolicitud, string> = {
      SOLICITADO: '#ff9800',      // Orange
      NOTIFICADO: '#ff5722',      // Deep Orange
      PREPARANDO: '#2196f3',      // Blue
      LISTO_ENTREGA: '#9c27b0',   // Purple
      ENTREGADO: '#4caf50',       // Green
      RECIBIDO: '#8bc34a',        // Light Green
      APLICADO: '#00bcd4',        // Cyan
      CANCELADO: '#f44336'        // Red
    };
    return colors[estado] || '#757575';
  }

  getPrioridadColor(prioridad: PrioridadSolicitud): string {
    const colors: Record<PrioridadSolicitud, string> = {
      BAJA: '#757575',      // Grey
      NORMAL: '#2196f3',    // Blue
      ALTA: '#ff9800',      // Orange
      URGENTE: '#f44336'    // Red
    };
    return colors[prioridad] || '#757575';
  }

  // Función para obtener las acciones disponibles según el estado y rol del usuario
  getAccionesDisponibles(solicitud: SolicitudProducto, userRole: string, userId: number): string[] {
    const acciones: string[] = [];

    if (userRole === 'administrador') {
      // Los administradores pueden ver todo
      acciones.push('ver');
      if (!['RECIBIDO', 'APLICADO', 'CANCELADO'].includes(solicitud.estado)) {
        acciones.push('cancelar');
      }
    } else if (userRole === 'almacenista') {
      acciones.push('ver');
      // Puede asignar solicitudes solicitadas (sin asignar)
      if (solicitud.estado === 'SOLICITADO' && !solicitud.almacenistaId) {
        acciones.push('asignar');
      }
      // Puede marcar como listo solicitudes que está preparando
      if (solicitud.estado === 'PREPARANDO' && solicitud.almacenistaId === userId) {
        acciones.push('listo');
      }
      // Puede entregar solicitudes que están listas o en preparación
      if (['PREPARANDO', 'LISTO_ENTREGA'].includes(solicitud.estado) && solicitud.almacenistaId === userId) {
        acciones.push('entregar');
      }
    } else if (['enfermero', 'medico_especialista', 'medico_residente'].includes(userRole)) {
      if (solicitud.solicitanteId === userId) {
        acciones.push('ver');
        // Puede confirmar recepción de solicitudes entregadas
        if (solicitud.estado === 'ENTREGADO') {
          acciones.push('confirmar');
        }
      }
    }

    return acciones;
  }
}

export default new SolicitudesService();