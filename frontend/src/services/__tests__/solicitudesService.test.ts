// ABOUTME: Tests comprehensivos para solicitudesService
// ABOUTME: Cubre gestión de solicitudes de productos, validaciones y acciones

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import solicitudesService from '../solicitudesService';
import { api } from '@/utils/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('solicitudesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSolicitudes', () => {
    it('should fetch solicitudes', async () => {
      const mockResponse = { data: [], total: 0, page: 1, totalPages: 1 };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await solicitudesService.getSolicitudes();

      expect(mockedApi.get).toHaveBeenCalledWith('/solicitudes', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with params', async () => {
      mockedApi.get.mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 });

      await solicitudesService.getSolicitudes({ estado: 'SOLICITADO', prioridad: 'ALTA', page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/solicitudes', {
        params: { estado: 'SOLICITADO', prioridad: 'ALTA', page: 1, limit: 10 }
      });
    });
  });

  describe('getSolicitudById', () => {
    it('should fetch solicitud by ID', async () => {
      const mockData = { id: 1, numero: 'SOL-001', estado: 'SOLICITADO' };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await solicitudesService.getSolicitudById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/solicitudes/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('createSolicitud', () => {
    it('should create solicitud', async () => {
      const data = { pacienteId: 1, cuentaPacienteId: 5, prioridad: 'NORMAL' as const, productos: [{ productoId: 1, cantidadSolicitada: 5 }] };
      const mockResponse = { message: 'Created', solicitud: { id: 1, ...data } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await solicitudesService.createSolicitud(data);

      expect(mockedApi.post).toHaveBeenCalledWith('/solicitudes', data);
      expect(result.message).toBe('Created');
    });
  });

  describe('asignarSolicitud', () => {
    it('should assign solicitud', async () => {
      const mockResponse = { message: 'Assigned', solicitud: { id: 1, estado: 'PREPARANDO' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await solicitudesService.asignarSolicitud(1);

      expect(mockedApi.put).toHaveBeenCalledWith('/solicitudes/1/asignar');
      expect(result.message).toBe('Assigned');
    });
  });

  describe('entregarSolicitud', () => {
    it('should mark solicitud as delivered', async () => {
      const mockResponse = { message: 'Delivered' };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await solicitudesService.entregarSolicitud(1, 'Test obs');

      expect(mockedApi.put).toHaveBeenCalledWith('/solicitudes/1/entregar', { observaciones: 'Test obs' });
      expect(result.message).toBe('Delivered');
    });
  });

  describe('confirmarSolicitud', () => {
    it('should confirm solicitud', async () => {
      const mockResponse = { message: 'Confirmed', solicitud: { id: 1, estado: 'RECIBIDO' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await solicitudesService.confirmarSolicitud(1, 'Received');

      expect(mockedApi.put).toHaveBeenCalledWith('/solicitudes/1/confirmar', { observaciones: 'Received' });
      expect(result.message).toBe('Confirmed');
    });
  });

  describe('getSolicitudStats', () => {
    it('should fetch stats', async () => {
      const mockStats = { totalSolicitudes: 100, solicitudesPorEstado: [], solicitudesPorPrioridad: [], solicitudesHoy: 5 };
      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await solicitudesService.getSolicitudStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/solicitudes/stats/resumen');
      expect(result).toEqual(mockStats);
    });
  });

  describe('validarDisponibilidadProductos', () => {
    it('should validate product availability', async () => {
      const mockResponse = { data: { products: [{ id: 1, stockActual: 10 }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await solicitudesService.validarDisponibilidadProductos([{ productoId: 1, cantidad: 5 }]);

      expect(result.disponible).toBe(true);
      expect(result.productos[0].disponible).toBe(true);
    });

    it('should detect unavailable products', async () => {
      const mockResponse = { data: { products: [{ id: 1, stockActual: 2 }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await solicitudesService.validarDisponibilidadProductos([{ productoId: 1, cantidad: 5 }]);

      expect(result.disponible).toBe(false);
      expect(result.productos[0].disponible).toBe(false);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await solicitudesService.validarDisponibilidadProductos([{ productoId: 1, cantidad: 5 }]);

      expect(result.disponible).toBe(false);
      expect(result.productos).toEqual([]);
    });
  });

  describe('helper methods', () => {
    it('should get estado label', () => {
      expect(solicitudesService.getEstadoLabel('SOLICITADO')).toBe('Solicitado');
      expect(solicitudesService.getEstadoLabel('ENTREGADO')).toBe('Entregado');
    });

    it('should get prioridad label', () => {
      expect(solicitudesService.getPrioridadLabel('BAJA')).toBe('Baja');
      expect(solicitudesService.getPrioridadLabel('URGENTE')).toBe('Urgente');
    });

    it('should get estado color', () => {
      expect(solicitudesService.getEstadoColor('SOLICITADO')).toBe('#ff9800');
      expect(solicitudesService.getEstadoColor('ENTREGADO')).toBe('#4caf50');
    });

    it('should get prioridad color', () => {
      expect(solicitudesService.getPrioridadColor('URGENTE')).toBe('#f44336');
      expect(solicitudesService.getPrioridadColor('BAJA')).toBe('#757575');
    });
  });

  describe('getAccionesDisponibles', () => {
    const mockSolicitud: any = {
      id: 1,
      estado: 'SOLICITADO',
      solicitanteId: 5,
      almacenistaId: null
    };

    it('should return actions for administrador', () => {
      const acciones = solicitudesService.getAccionesDisponibles(mockSolicitud, 'administrador', 1);

      expect(acciones).toContain('ver');
      expect(acciones).toContain('cancelar');
    });

    it('should return actions for almacenista', () => {
      const acciones = solicitudesService.getAccionesDisponibles(mockSolicitud, 'almacenista', 2);

      expect(acciones).toContain('ver');
      expect(acciones).toContain('asignar');
    });

    it('should return actions for almacenista assigned', () => {
      const solicitudAsignada = { ...mockSolicitud, estado: 'PREPARANDO', almacenistaId: 2 };
      const acciones = solicitudesService.getAccionesDisponibles(solicitudAsignada, 'almacenista', 2);

      expect(acciones).toContain('entregar');
    });

    it('should return actions for solicitante', () => {
      const solicitudEntregada = { ...mockSolicitud, estado: 'ENTREGADO' };
      const acciones = solicitudesService.getAccionesDisponibles(solicitudEntregada, 'enfermero', 5);

      expect(acciones).toContain('ver');
      expect(acciones).toContain('confirmar');
    });

    it('should not return actions for unrelated user', () => {
      const acciones = solicitudesService.getAccionesDisponibles(mockSolicitud, 'cajero', 99);

      expect(acciones).toHaveLength(0);
    });
  });
});
