// ABOUTME: Tests comprehensivos para quirofanosService
// ABOUTME: Cubre gestión de quirófanos, cirugías y disponibilidad

import quirofanosService from '../quirofanosService';
import { api } from '@/utils/api';

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('quirofanosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuirofanos', () => {
    it('should fetch quirofanos', async () => {
      const mockResponse = { data: { items: [{ id: 1, numero: 'Q1' }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await quirofanosService.getQuirofanos();

      expect(mockedApi.get).toHaveBeenCalledWith('/quirofanos?');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with filters', async () => {
      const filters = { estado: 'disponible', tipo: 'cirugia_general' };
      mockedApi.get.mockResolvedValue({ data: { items: [] } });

      await quirofanosService.getQuirofanos(filters);

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('estado=disponible'));
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue({ response: { data: { message: 'Error' } } });

      await expect(quirofanosService.getQuirofanos()).rejects.toThrow();
    });
  });

  describe('getQuirofanosStats', () => {
    it('should fetch stats', async () => {
      const mockStats = { resumen: { totalQuirofanos: 10 }, distribucion: {} };
      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await quirofanosService.getQuirofanosStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/quirofanos/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getQuirofanoById', () => {
    it('should fetch quirofano by ID', async () => {
      const mockData = { id: 1, numero: 'Q1' };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await quirofanosService.getQuirofanoById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/quirofanos/1');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('createQuirofano', () => {
    it('should create quirofano', async () => {
      const data = { numero: 'Q1', tipo: 'cirugia_general', capacidadEquipo: 5 };
      mockedApi.post.mockResolvedValue({ data });

      const result = await quirofanosService.createQuirofano(data as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/quirofanos', data);
      expect(result.data).toEqual(data);
    });
  });

  describe('updateQuirofano', () => {
    it('should update quirofano', async () => {
      const data = { precioHora: 1000 };
      mockedApi.put.mockResolvedValue({ data });

      const result = await quirofanosService.updateQuirofano(1, data);

      expect(mockedApi.put).toHaveBeenCalledWith('/quirofanos/1', data);
      expect(result.data).toEqual(data);
    });
  });

  describe('updateQuirofanoStatus', () => {
    it('should update status', async () => {
      const mockResponse = { data: { estado: 'mantenimiento' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await quirofanosService.updateQuirofanoStatus(1, 'mantenimiento', 'Test');

      expect(mockedApi.put).toHaveBeenCalledWith('/quirofanos/1/estado', { estado: 'mantenimiento', motivo: 'Test' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteQuirofano', () => {
    it('should delete quirofano', async () => {
      const mockResponse = { success: true };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await quirofanosService.deleteQuirofano(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/quirofanos/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAvailableNumbers', () => {
    it('should fetch available numbers', async () => {
      const mockResponse = { data: { available: ['Q1', 'Q2'], suggested: 'Q3' } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await quirofanosService.getAvailableNumbers();

      expect(mockedApi.get).toHaveBeenCalledWith('/quirofanos/available-numbers');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('programarCirugia', () => {
    it('should schedule surgery', async () => {
      const data = { quirofanoId: 1, pacienteId: 5, medicoId: 2, tipoIntervencion: 'Test', fechaInicio: '2025-01-01', fechaFin: '2025-01-01' };
      mockedApi.post.mockResolvedValue({ data });

      const result = await quirofanosService.programarCirugia(data);

      expect(mockedApi.post).toHaveBeenCalledWith('/quirofanos/cirugias', data);
      expect(result.data).toEqual(data);
    });
  });

  describe('getCirugias', () => {
    it('should fetch cirugias', async () => {
      const mockResponse = { data: { items: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await quirofanosService.getCirugias();

      expect(mockedApi.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle Date filters', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [] } });

      await quirofanosService.getCirugias({ fechaInicio: new Date('2025-01-01') });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('fechaInicio='));
    });
  });

  describe('getCirugiaById', () => {
    it('should fetch cirugia by ID', async () => {
      const mockData = { id: 1, tipoIntervencion: 'Test' };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await quirofanosService.getCirugiaById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/quirofanos/cirugias/1');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('actualizarCirugia', () => {
    it('should update cirugia', async () => {
      const data = { observaciones: 'Updated' };
      mockedApi.put.mockResolvedValue({ data });

      const result = await quirofanosService.actualizarCirugia(1, data);

      expect(mockedApi.put).toHaveBeenCalledWith('/quirofanos/cirugias/1', data);
      expect(result.data).toEqual(data);
    });
  });

  describe('actualizarEstadoCirugia', () => {
    it('should update cirugia status', async () => {
      const mockResponse = { data: { estado: 'completada' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await quirofanosService.actualizarEstadoCirugia(1, 'completada', 'Test obs', 'Test motivo');

      expect(mockedApi.put).toHaveBeenCalledWith('/quirofanos/cirugias/1/estado', {
        estado: 'completada',
        observaciones: 'Test obs',
        motivo: 'Test motivo'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelarCirugia', () => {
    it('should cancel cirugia', async () => {
      const mockResponse = { success: true };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await quirofanosService.cancelarCirugia(1, 'Test reason');

      expect(mockedApi.delete).toHaveBeenCalledWith('/quirofanos/cirugias/1', {
        data: { motivo: 'Test reason' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('utility methods', () => {
    it('should get tipo label', () => {
      expect(quirofanosService.getTipoLabel('cirugia_general')).toBe('Cirugía General');
      expect(quirofanosService.getTipoLabel('cirugia_cardiaca')).toBe('Cirugía Cardíaca');
    });

    it('should get estado label', () => {
      expect(quirofanosService.getEstadoLabel('disponible')).toBe('Disponible');
      expect(quirofanosService.getEstadoLabel('ocupado')).toBe('Ocupado');
    });

    it('should get estado color', () => {
      expect(quirofanosService.getEstadoColor('disponible')).toBe('success');
      expect(quirofanosService.getEstadoColor('ocupado')).toBe('error');
      expect(quirofanosService.getEstadoColor('mantenimiento')).toBe('warning');
    });
  });
});
