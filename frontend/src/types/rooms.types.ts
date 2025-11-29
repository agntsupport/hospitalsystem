export interface Room {
  id: number;
  numero: string;
  tipo: 'consultorio_general' | 'individual' | 'doble' | 'triple' | 'suite' | 'cuidados_intensivos';
  precioPorDia: number;
  costoPorDia?: number | null; // Costo operativo diario (editable por admin)
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  descripcion: string;
  piso?: string; // Piso de la habitación
  caracteristicas?: string; // Características adicionales
  pacienteActual?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
  } | null;
  fechaOcupacion?: string | null;
  createdAt: string;
}

export interface Office {
  id: number;
  numero: string;
  tipo: 'consulta_general' | 'especialidad' | 'urgencias' | 'cirugia';
  especialidad?: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
  descripcion: string;
  medicoAsignado?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    especialidad?: string;
  } | null;
  fechaAsignacion?: string | null;
  createdAt: string;
}

export interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  roomsByType: {
    [key: string]: {
      total: number;
      available: number;
      occupied: number;
      maintenance: number;
    };
  };
}

export interface OfficeStats {
  totalOffices: number;
  availableOffices: number;
  occupiedOffices: number;
  maintenanceOffices: number;
  occupancyRate: number;
  officesByType: {
    [key: string]: {
      total: number;
      available: number;
      occupied: number;
      maintenance: number;
    };
  };
}

export interface RoomFilters {
  tipo?: string;
  estado?: string;
  paciente?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OfficeFilters {
  tipo?: string;
  estado?: string;
  especialidad?: string;
  medico?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssignRoomRequest {
  pacienteId: number;
  fechaInicio?: string;
  observaciones?: string;
}

export interface AssignOfficeRequest {
  medicoId: number;
  fechaInicio?: string;
  observaciones?: string;
}

export interface CreateRoomRequest {
  numero: string;
  tipo: Room['tipo'];
  precioPorDia: number;
  costoPorDia?: number | null;
  descripcion: string;
}

export interface CreateOfficeRequest {
  numero: string;
  tipo: Office['tipo'];
  especialidad?: string;
  descripcion: string;
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {
  estado?: Room['estado'];
}

export interface UpdateOfficeRequest extends Partial<CreateOfficeRequest> {
  estado?: Office['estado'];
}

// API Response types
export interface RoomsResponse {
  success: boolean;
  message: string;
  data: {
    rooms: Room[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface OfficesResponse {
  success: boolean;
  message: string;
  data: {
    offices: Office[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface RoomStatsResponse {
  success: boolean;
  message: string;
  data: RoomStats;
}

export interface OfficeStatsResponse {
  success: boolean;
  message: string;
  data: OfficeStats;
}

export interface SingleRoomResponse {
  success: boolean;
  message: string;
  data: Room;
}

export interface SingleOfficeResponse {
  success: boolean;
  message: string;
  data: Office;
}

// Constants
export const ROOM_TYPES = {
  consultorio_general: 'Consultorio General',
  individual: 'Individual',
  doble: 'Doble',
  triple: 'Triple',
  suite: 'Suite',
  cuidados_intensivos: 'Cuidados Intensivos'
} as const;

export const OFFICE_TYPES = {
  consulta_general: 'Consulta General',
  especialidad: 'Especialidad',
  urgencias: 'Urgencias',
  cirugia: 'Cirugía'
} as const;

export const ROOM_STATES = {
  disponible: 'Disponible',
  ocupada: 'Ocupada',
  mantenimiento: 'Mantenimiento'
} as const;

export const OFFICE_STATES = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  mantenimiento: 'Mantenimiento'
} as const;