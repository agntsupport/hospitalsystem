// ABOUTME: Tests comprehensivos para notificacionesService
// ABOUTME: Cubre gestión de notificaciones, polling y helpers de formato

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import notificacionesService from '../notificacionesService';
import { api } from '@/utils/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('notificacionesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getNotificaciones', () => {
    it('should fetch notificaciones sin parametros', async () => {
      const mockResponse = { data: [], total: 0, page: 1, totalPages: 1 };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await notificacionesService.getNotificaciones();

      expect(mockedApi.get).toHaveBeenCalledWith('/notificaciones', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch con filtros', async () => {
      const mockResponse = { data: [], total: 0, page: 1, totalPages: 1 };
      mockedApi.get.mockResolvedValue(mockResponse);

      await notificacionesService.getNotificaciones({ leida: false, tipo: 'NUEVA_SOLICITUD', page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/notificaciones', {
        params: { leida: false, tipo: 'NUEVA_SOLICITUD', page: 1, limit: 10 }
      });
    });
  });

  describe('getNotificacionesNoLeidasCount', () => {
    it('should return count', async () => {
      const mockResponse = { count: 5 };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await notificacionesService.getNotificacionesNoLeidasCount();

      expect(mockedApi.get).toHaveBeenCalledWith('/notificaciones/no-leidas/count');
      expect(result.count).toBe(5);
    });
  });

  describe('marcarComoLeida', () => {
    it('should mark notification as read', async () => {
      const mockResponse = { message: 'OK', notificacion: { id: 1, leida: true } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await notificacionesService.marcarComoLeida(1);

      expect(mockedApi.put).toHaveBeenCalledWith('/notificaciones/1/marcar-leida');
      expect(result.notificacion.leida).toBe(true);
    });
  });

  describe('marcarTodasComoLeidas', () => {
    it('should mark all as read', async () => {
      const mockResponse = { message: 'OK' };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await notificacionesService.marcarTodasComoLeidas();

      expect(mockedApi.put).toHaveBeenCalledWith('/notificaciones/marcar-todas-leidas');
      expect(result.message).toBe('OK');
    });
  });

  describe('eliminarNotificacion', () => {
    it('should delete notification', async () => {
      const mockResponse = { message: 'Deleted' };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await notificacionesService.eliminarNotificacion(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/notificaciones/1');
      expect(result.message).toBe('Deleted');
    });
  });

  describe('getTiposNotificaciones', () => {
    it('should get notification types', async () => {
      const mockTypes = [{ value: 'NUEVA_SOLICITUD', label: 'Nueva Solicitud' }];
      const mockResponse = { data: mockTypes };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await notificacionesService.getTiposNotificaciones();

      expect(mockedApi.get).toHaveBeenCalledWith('/notificaciones/tipos');
      expect(result).toEqual(mockTypes);
    });
  });

  describe('getNotificacionesRecientes', () => {
    it('should get recent notifications', async () => {
      const mockNoLeidas = { data: [{ id: 1, leida: false }], total: 1 };
      const mockLeidas = { data: Array(9).fill({ id: 2, leida: true }), total: 9 };
      mockedApi.get.mockResolvedValueOnce(mockNoLeidas).mockResolvedValueOnce(mockLeidas);

      const result = await notificacionesService.getNotificacionesRecientes();

      expect(result.length).toBe(10);
    });

    it('should combine unread and read notifications', async () => {
      const mockNoLeidas = { data: Array(5).fill({ id: 1, leida: false }), total: 5 };
      const mockLeidas = { data: Array(5).fill({ id: 2, leida: true }), total: 5 };

      mockedApi.get.mockResolvedValueOnce(mockNoLeidas).mockResolvedValueOnce(mockLeidas);

      const result = await notificacionesService.getNotificacionesRecientes();

      expect(result.length).toBe(10);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await notificacionesService.getNotificacionesRecientes();

      expect(result).toEqual([]);
    });
  });

  describe('polling', () => {
    it('should start notification polling', async () => {
      const mockResponse = { count: 5 };
      mockedApi.get.mockResolvedValue(mockResponse);

      const callback = jest.fn();
      const intervalId = notificacionesService.startNotificationPolling(callback, 1000);

      await jest.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledWith(5);

      notificacionesService.stopNotificationPolling(intervalId);
    });

    it('should stop polling', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const intervalId = setInterval(() => {}, 1000) as any;

      notificacionesService.stopNotificationPolling(intervalId);

      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });
  });

  describe('helpers', () => {
    it('should get tipo label', () => {
      expect(notificacionesService.getTipoLabel('NUEVA_SOLICITUD')).toBe('Nueva Solicitud');
      expect(notificacionesService.getTipoLabel('STOCK_BAJO')).toBe('Stock Bajo');
    });

    it('should get tipo color', () => {
      expect(notificacionesService.getTipoColor('NUEVA_SOLICITUD')).toBe('#2196f3');
      expect(notificacionesService.getTipoColor('SOLICITUD_CANCELADA')).toBe('#f44336');
    });

    it('should get tipo icon', () => {
      expect(notificacionesService.getTipoIcon('NUEVA_SOLICITUD')).toBe('add_circle');
      expect(notificacionesService.getTipoIcon('STOCK_BAJO')).toBe('warning');
    });
  });

  describe('formatearTiempoRelativo', () => {
    it('should format recent time', () => {
      const now = new Date();
      const result = notificacionesService.formatearTiempoRelativo(now.toISOString());
      expect(result).toBe('Ahora mismo');
    });

    it('should format minutes ago', () => {
      const minutesAgo = new Date();
      minutesAgo.setMinutes(minutesAgo.getMinutes() - 5);
      const result = notificacionesService.formatearTiempoRelativo(minutesAgo.toISOString());
      expect(result).toContain('minuto');
    });

    it('should format hours ago', () => {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - 2);
      const result = notificacionesService.formatearTiempoRelativo(hoursAgo.toISOString());
      expect(result).toContain('hora');
    });

    it('should format days ago', () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 3);
      const result = notificacionesService.formatearTiempoRelativo(daysAgo.toISOString());
      expect(result).toContain('día');
    });
  });

  describe('agruparPorFecha', () => {
    it('should group notifications by date', () => {
      const notifications = [
        { id: 1, createdAt: '2025-01-01T10:00:00Z', tipo: 'NUEVA_SOLICITUD' as const, mensaje: 'test', solicitudId: 1, usuarioId: 1, leida: false, solicitud: {} as any },
        { id: 2, createdAt: '2025-01-01T11:00:00Z', tipo: 'NUEVA_SOLICITUD' as const, mensaje: 'test', solicitudId: 1, usuarioId: 1, leida: false, solicitud: {} as any },
        { id: 3, createdAt: '2025-01-02T10:00:00Z', tipo: 'NUEVA_SOLICITUD' as const, mensaje: 'test', solicitudId: 1, usuarioId: 1, leida: false, solicitud: {} as any }
      ];

      const result = notificacionesService.agruparPorFecha(notifications);

      expect(result.length).toBe(2);
      expect(result[0].notificaciones.length).toBe(1);
    });
  });

  describe('getResumenNotificaciones', () => {
    it('should get notifications summary', async () => {
      const mockCount = { count: 5 };
      const mockRecientes = [{ id: 1, tipo: 'NUEVA_SOLICITUD' as const }];
      const mockTipos = [{ value: 'NUEVA_SOLICITUD' as const, label: 'Nueva' }];

      mockedApi.get
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce({ data: mockRecientes, total: 1 })
        .mockResolvedValueOnce({ data: mockTipos });

      const result = await notificacionesService.getResumenNotificaciones();

      expect(result.noLeidas).toBe(5);
      expect(result.recientes).toBeDefined();
      expect(result.porTipo).toBeDefined();
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await notificacionesService.getResumenNotificaciones();

      expect(result.noLeidas).toBe(0);
      expect(result.recientes).toEqual([]);
    });
  });
});
