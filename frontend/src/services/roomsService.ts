import { api } from '@/utils/api';
import { 
  Room, 
  Office, 
  RoomStats, 
  OfficeStats,
  RoomsResponse, 
  OfficesResponse, 
  RoomStatsResponse, 
  OfficeStatsResponse,
  SingleRoomResponse, 
  SingleOfficeResponse,
  RoomFilters, 
  OfficeFilters,
  AssignRoomRequest,
  AssignOfficeRequest,
  CreateRoomRequest,
  CreateOfficeRequest,
  UpdateRoomRequest,
  UpdateOfficeRequest
} from '@/types/rooms.types';

export const roomsService = {
  // Room Statistics
  async getRoomStats(): Promise<RoomStatsResponse> {
    const response = await api.get('/rooms/stats');
    
    if (response.success && response.data) {
      const backendData = response.data;
      
      // Calculate totals
      const totalRooms = backendData.total || 0;
      const availableRooms = backendData.porEstado?.disponible || 0;
      const occupiedRooms = backendData.porEstado?.ocupada || 0;
      const maintenanceRooms = backendData.porEstado?.mantenimiento || 0;
      
      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100) : 0;
      
      // Transform room types
      const roomsByType: { [key: string]: { total: number; available: number; occupied: number } } = {};
      if (backendData.porTipo) {
        Object.entries(backendData.porTipo).forEach(([tipo, total]) => {
          roomsByType[tipo] = {
            total: total as number,
            available: total as number, // Assume all available for now
            occupied: 0
          };
        });
      }
      
      const transformedStats: RoomStats = {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        occupancyRate,
        roomsByType
      };
      
      return { 
        success: true, 
        message: response.message,
        data: transformedStats 
      };
    }
    
    return response;
  },

  // Room CRUD operations
  async getRooms(filters?: RoomFilters): Promise<RoomsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/rooms?${queryString}` : '/rooms';
    
    const response = await api.get(url);
    
    // Transform backend response structure to match RoomsResponse type
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          rooms: response.data.items || [],
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.pages || 1,
          currentPage: response.data.pagination?.currentPage || 1
        }
      };
    }
    
    return response;
  },

  async getRoomById(id: number): Promise<SingleRoomResponse> {
    return api.get(`/rooms/${id}`);
  },

  async createRoom(roomData: CreateRoomRequest): Promise<SingleRoomResponse> {
    return api.post('/rooms', roomData);
  },

  async updateRoom(id: number, roomData: UpdateRoomRequest): Promise<SingleRoomResponse> {
    return api.put(`/rooms/${id}`, roomData);
  },

  async deleteRoom(id: number): Promise<{ success: boolean; message: string }> {
    return api.delete(`/rooms/${id}`);
  },

  // Room assignment operations
  async assignRoom(roomId: number, assignmentData: AssignRoomRequest): Promise<SingleRoomResponse> {
    return api.put(`/rooms/${roomId}/assign`, assignmentData);
  },

  async releaseRoom(roomId: number, observaciones?: string): Promise<SingleRoomResponse> {
    return api.put(`/rooms/${roomId}/release`, { observaciones });
  },

  async setRoomMaintenance(roomId: number, observaciones?: string): Promise<SingleRoomResponse> {
    return api.put(`/rooms/${roomId}/maintenance`, { observaciones });
  },

  // Office Statistics
  async getOfficeStats(): Promise<OfficeStatsResponse> {
    const response = await api.get('/offices/stats');
    
    if (response.success && response.data) {
      const backendData = response.data;
      
      // Extract values with defaults
      const totalOffices = backendData.total || 0;
      const availableOffices = backendData.available || 0;
      const occupiedOffices = backendData.occupied || 0;
      const maintenanceOffices = backendData.maintenance || 0;
      
      // Calculate occupancy rate
      const occupancyRate = totalOffices > 0 ? ((occupiedOffices / totalOffices) * 100) : 0;
      
      // Transform distribution
      const officesByType: { [key: string]: { total: number; available: number; occupied: number } } = {};
      if (backendData.distribution) {
        Object.entries(backendData.distribution).forEach(([specialty, total]) => {
          officesByType[specialty] = {
            total: total as number,
            available: total as number, // Assume all available for simplicity
            occupied: 0
          };
        });
      }
      
      const transformedStats: OfficeStats = {
        totalOffices,
        availableOffices,
        occupiedOffices,
        maintenanceOffices,
        occupancyRate,
        officesByType
      };
      
      return { 
        success: true, 
        message: response.message,
        data: transformedStats 
      };
    }
    
    return response;
  },

  // Office CRUD operations
  async getOffices(filters?: OfficeFilters): Promise<OfficesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/offices?${queryString}` : '/offices';
    
    const response = await api.get(url);
    
    // Transform backend response structure
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.items || [],
        pagination: response.data.pagination
      };
    }
    
    return response;
  },

  async getOfficeById(id: number): Promise<SingleOfficeResponse> {
    return api.get(`/offices/${id}`);
  },

  async createOffice(officeData: CreateOfficeRequest): Promise<SingleOfficeResponse> {
    return api.post('/offices', officeData);
  },

  async updateOffice(id: number, officeData: UpdateOfficeRequest): Promise<SingleOfficeResponse> {
    return api.put(`/offices/${id}`, officeData);
  },

  async deleteOffice(id: number): Promise<{ success: boolean; message: string }> {
    return api.delete(`/offices/${id}`);
  },

  // Office assignment operations
  async assignOffice(officeId: number, assignmentData: AssignOfficeRequest): Promise<SingleOfficeResponse> {
    return api.put(`/offices/${officeId}/assign`, assignmentData);
  },

  async releaseOffice(officeId: number, observaciones?: string): Promise<SingleOfficeResponse> {
    return api.put(`/offices/${officeId}/release`, { observaciones });
  },

  async setOfficeMaintenance(officeId: number, observaciones?: string): Promise<SingleOfficeResponse> {
    return api.put(`/offices/${officeId}/maintenance`, { observaciones });
  }
};