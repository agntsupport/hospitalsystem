import { api } from '@/utils/api';

// ==============================================
// TIPOS E INTERFACES
// ==============================================

export type TipoNotificacion = 
  | 'NUEVA_SOLICITUD' 
  | 'SOLICITUD_ASIGNADA' 
  | 'SOLICITUD_ENTREGADA' 
  | 'SOLICITUD_COMPLETADA' 
  | 'SOLICITUD_CANCELADA' 
  | 'STOCK_BAJO';

export interface Notificacion {
  id: number;
  solicitudId: number;
  usuarioId: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fechaLectura?: string;
  createdAt: string;
  solicitud: {
    id: number;
    numero: string;
    estado: string;
    prioridad: string;
    paciente: {
      id: number;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno?: string;
    };
  };
}

export interface NotificacionesResponse {
  data: Notificacion[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TipoNotificacionOption {
  value: TipoNotificacion;
  label: string;
}

// ==============================================
// SERVICIO DE NOTIFICACIONES
// ==============================================

class NotificacionesService {

  // Obtener notificaciones del usuario
  async getNotificaciones(params?: {
    leida?: boolean;
    tipo?: TipoNotificacion;
    page?: number;
    limit?: number;
  }): Promise<NotificacionesResponse> {
    const response = await api.get('/notificaciones', { params });
    return response as unknown as NotificacionesResponse;
  }

  // Contar notificaciones no leídas
  async getNotificacionesNoLeidasCount(): Promise<{ count: number }> {
    const response = await api.get('/notificaciones/no-leidas/count');
    return response as unknown as { count: number };
  }

  // Marcar notificación como leída
  async marcarComoLeida(id: number): Promise<{ message: string; notificacion: Notificacion }> {
    const response = await api.put(`/notificaciones/${id}/marcar-leida`);
    return response as unknown as { message: string; notificacion: Notificacion };
  }

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(): Promise<{ message: string }> {
    const response = await api.put('/notificaciones/marcar-todas-leidas');
    return response as unknown as { message: string };
  }

  // Eliminar notificación
  async eliminarNotificacion(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/notificaciones/${id}`);
    return response as unknown as { message: string };
  }

  // Obtener tipos de notificaciones disponibles
  async getTiposNotificaciones(): Promise<TipoNotificacionOption[]> {
    const response = await api.get('/notificaciones/tipos');
    return response.data as TipoNotificacionOption[];
  }

  // Obtener notificaciones recientes (no leídas + últimas 5 leídas)
  async getNotificacionesRecientes(): Promise<Notificacion[]> {
    try {
      // Obtener notificaciones no leídas
      const noLeidas = await this.getNotificaciones({ 
        leida: false, 
        limit: 50 
      });

      // Si hay menos de 10 notificaciones no leídas, completar con leídas recientes
      if (noLeidas.data.length < 10) {
        const limitLeidas = 10 - noLeidas.data.length;
        const leidas = await this.getNotificaciones({ 
          leida: true, 
          limit: limitLeidas 
        });
        
        return [...noLeidas.data, ...leidas.data];
      }

      return noLeidas.data.slice(0, 10);
    } catch (error) {
      console.error('Error obteniendo notificaciones recientes:', error);
      return [];
    }
  }

  // Polling de notificaciones - para uso en componentes
  startNotificationPolling(callback: (count: number) => void, interval: number = 30000): NodeJS.Timeout {
    // Verificar inmediatamente
    this.getNotificacionesNoLeidasCount()
      .then(response => callback(response.count))
      .catch(error => console.error('Error en polling de notificaciones:', error));

    // Configurar polling
    return setInterval(async () => {
      try {
        const response = await this.getNotificacionesNoLeidasCount();
        callback(response.count);
      } catch (error) {
        console.error('Error en polling de notificaciones:', error);
      }
    }, interval);
  }

  // Detener polling
  stopNotificationPolling(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }

  // Helpers para labels y colores
  getTipoLabel(tipo: TipoNotificacion): string {
    const labels: Record<TipoNotificacion, string> = {
      NUEVA_SOLICITUD: 'Nueva Solicitud',
      SOLICITUD_ASIGNADA: 'Solicitud Asignada',
      SOLICITUD_ENTREGADA: 'Solicitud Entregada',
      SOLICITUD_COMPLETADA: 'Solicitud Completada',
      SOLICITUD_CANCELADA: 'Solicitud Cancelada',
      STOCK_BAJO: 'Stock Bajo'
    };
    return labels[tipo] || tipo;
  }

  getTipoColor(tipo: TipoNotificacion): string {
    const colors: Record<TipoNotificacion, string> = {
      NUEVA_SOLICITUD: '#2196f3',      // Blue
      SOLICITUD_ASIGNADA: '#ff9800',   // Orange
      SOLICITUD_ENTREGADA: '#4caf50',  // Green
      SOLICITUD_COMPLETADA: '#8bc34a', // Light Green
      SOLICITUD_CANCELADA: '#f44336',  // Red
      STOCK_BAJO: '#ff5722'            // Deep Orange
    };
    return colors[tipo] || '#757575';
  }

  getTipoIcon(tipo: TipoNotificacion): string {
    const icons: Record<TipoNotificacion, string> = {
      NUEVA_SOLICITUD: 'add_circle',
      SOLICITUD_ASIGNADA: 'assignment_ind',
      SOLICITUD_ENTREGADA: 'local_shipping',
      SOLICITUD_COMPLETADA: 'check_circle',
      SOLICITUD_CANCELADA: 'cancel',
      STOCK_BAJO: 'warning'
    };
    return icons[tipo] || 'notifications';
  }

  // Formatear tiempo relativo para mostrar en notificaciones
  formatearTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaNotificacion = new Date(fecha);
    const diferencia = ahora.getTime() - fechaNotificacion.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) {
      return 'Ahora mismo';
    } else if (minutos < 60) {
      return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else if (horas < 24) {
      return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (dias < 7) {
      return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else {
      return fechaNotificacion.toLocaleDateString('es-MX');
    }
  }

  // Agrupar notificaciones por fecha
  agruparPorFecha(notificaciones: Notificacion[]): { fecha: string; notificaciones: Notificacion[] }[] {
    const grupos: { [fecha: string]: Notificacion[] } = {};

    notificaciones.forEach(notificacion => {
      const fecha = new Date(notificacion.createdAt).toLocaleDateString('es-MX');
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(notificacion);
    });

    return Object.entries(grupos)
      .map(([fecha, notificaciones]) => ({ fecha, notificaciones }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  // Obtener resumen de notificaciones para dashboard
  async getResumenNotificaciones(): Promise<{
    noLeidas: number;
    porTipo: { tipo: TipoNotificacion; cantidad: number }[];
    recientes: Notificacion[];
  }> {
    try {
      const [countResponse, recientes, tipos] = await Promise.all([
        this.getNotificacionesNoLeidasCount(),
        this.getNotificacionesRecientes(),
        this.getTiposNotificaciones()
      ]);

      // Contar por tipo en las notificaciones recientes
      const porTipo = tipos.map(tipo => ({
        tipo: tipo.value,
        cantidad: recientes.filter(n => n.tipo === tipo.value).length
      }));

      return {
        noLeidas: countResponse.count,
        porTipo,
        recientes
      };
    } catch (error) {
      console.error('Error obteniendo resumen de notificaciones:', error);
      return {
        noLeidas: 0,
        porTipo: [],
        recientes: []
      };
    }
  }
}

export default new NotificacionesService();