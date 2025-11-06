// ABOUTME: Tests comprehensivos para roomsService
// ABOUTME: Cubre gestión de habitaciones, consultorios y asignaciones

import { roomsService } from '../roomsService';
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

describe('roomsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoomStats', () => {
    it('should fetch and transform room stats', async () => {
      const mockResponse = {
        success: true,
        data: { total: 50, porEstado: { disponible: 30, ocupada: 15, mantenimiento: 5 }, porTipo: { individual: 25, doble: 20, suite: 5 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getRoomStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/rooms/stats');
      expect(result.success).toBe(true);
      expect(result.data?.totalRooms).toBe(50);
      expect(result.data?.occupancyRate).toBeCloseTo(30, 1);
    });

    it('should handle error response', async () => {
      const mockResponse = { success: false, message: 'Error' };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getRoomStats();

      expect(result.success).toBe(false);
      expect(result.data?.totalRooms).toBe(0);
    });
  });

  describe('getRooms', () => {
    it('should fetch rooms without filters', async () => {
      const mockResponse = {
        success: true,
        data: { items: [{ id: 1, numero: 'H1' }], pagination: { total: 1, pages: 1, currentPage: 1 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getRooms();

      expect(mockedApi.get).toHaveBeenCalledWith('/rooms');
      expect(result.data?.rooms).toEqual(mockResponse.data.items);
    });

    it('should fetch rooms with filters', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await roomsService.getRooms({ estado: 'disponible', tipo: 'individual', page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('estado=disponible'));
    });
  });

  describe('getRoomById', () => {
    it('should fetch room by ID', async () => {
      const mockResponse = { success: true, data: { id: 1, numero: 'H1' } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getRoomById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/rooms/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createRoom', () => {
    it('should create new room', async () => {
      const roomData = { numero: 'H1', tipo: 'individual', piso: 2, precioNoche: 1000 };
      const mockResponse = { success: true, data: { id: 1, ...roomData } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await roomsService.createRoom(roomData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/rooms', roomData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRoom', () => {
    it('should update room', async () => {
      const updateData = { precioNoche: 1500 };
      const mockResponse = { success: true, data: { id: 1, ...updateData } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.updateRoom(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/rooms/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteRoom', () => {
    it('should delete room with reason', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await roomsService.deleteRoom(1, 'Test reason');

      expect(mockedApi.delete).toHaveBeenCalledWith('/rooms/1', { data: { motivo: 'Test reason' } });
      expect(result.message).toBe('Deleted');
    });

    it('should use default reason', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      mockedApi.delete.mockResolvedValue(mockResponse);

      await roomsService.deleteRoom(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/rooms/1', {
        data: { motivo: 'Eliminación de habitación desde panel administrativo' }
      });
    });
  });

  describe('assignRoom', () => {
    it('should assign room', async () => {
      const assignmentData = { pacienteId: 5, hospitalizacionId: 10 };
      const mockResponse = { success: true, data: { id: 1, estado: 'ocupada' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.assignRoom(1, assignmentData);

      expect(mockedApi.put).toHaveBeenCalledWith('/rooms/1/assign', assignmentData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('releaseRoom', () => {
    it('should release room', async () => {
      const mockResponse = { success: true, data: { id: 1, estado: 'disponible' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.releaseRoom(1, 'Patient discharged');

      expect(mockedApi.put).toHaveBeenCalledWith('/rooms/1/release', { observaciones: 'Patient discharged' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('setRoomMaintenance', () => {
    it('should set room to maintenance', async () => {
      const mockResponse = { success: true, data: { id: 1, estado: 'mantenimiento' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.setRoomMaintenance(1, 'Routine maintenance');

      expect(mockedApi.put).toHaveBeenCalledWith('/rooms/1/maintenance', { observaciones: 'Routine maintenance' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOfficeStats', () => {
    it('should fetch and transform office stats', async () => {
      const mockResponse = {
        success: true,
        data: { total: 20, available: 15, occupied: 3, maintenance: 2, distribution: { cardiologia: 5, pediatria: 5 } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getOfficeStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/offices/stats');
      expect(result.success).toBe(true);
      expect(result.data?.totalOffices).toBe(20);
    });
  });

  describe('getOffices', () => {
    it('should fetch offices', async () => {
      const mockResponse = {
        success: true,
        data: { items: [{ id: 1, numero: 'C1' }], pagination: {} }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getOffices();

      expect(mockedApi.get).toHaveBeenCalledWith('/offices');
      expect(result.data?.offices).toEqual(mockResponse.data.items);
    });
  });

  describe('getOfficeById', () => {
    it('should fetch office by ID', async () => {
      const mockResponse = { success: true, data: { id: 1, numero: 'C1' } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await roomsService.getOfficeById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/offices/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createOffice', () => {
    it('should create office', async () => {
      const officeData = { numero: 'C1', especialidad: 'cardiologia', piso: 1 };
      const mockResponse = { success: true, data: { id: 1, ...officeData } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await roomsService.createOffice(officeData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/offices', officeData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateOffice', () => {
    it('should update office', async () => {
      const updateData = { especialidad: 'pediatria' };
      const mockResponse = { success: true, data: { id: 1, ...updateData } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.updateOffice(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/offices/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteOffice', () => {
    it('should delete office', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await roomsService.deleteOffice(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/offices/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignOffice', () => {
    it('should assign office', async () => {
      const assignmentData = { medicoId: 5 };
      const mockResponse = { success: true, data: { id: 1, estado: 'ocupado' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.assignOffice(1, assignmentData);

      expect(mockedApi.put).toHaveBeenCalledWith('/offices/1/assign', assignmentData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('releaseOffice', () => {
    it('should release office', async () => {
      const mockResponse = { success: true, data: { id: 1, estado: 'disponible' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.releaseOffice(1, 'End of consultation');

      expect(mockedApi.put).toHaveBeenCalledWith('/offices/1/release', { observaciones: 'End of consultation' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('setOfficeMaintenance', () => {
    it('should set office to maintenance', async () => {
      const mockResponse = { success: true, data: { id: 1, estado: 'mantenimiento' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await roomsService.setOfficeMaintenance(1, 'Equipment upgrade');

      expect(mockedApi.put).toHaveBeenCalledWith('/offices/1/maintenance', { observaciones: 'Equipment upgrade' });
      expect(result).toEqual(mockResponse);
    });
  });
});
