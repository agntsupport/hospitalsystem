import { api } from '@/utils/api';

export interface User {
  id: number;
  username: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol: string;
  activo: boolean;
  ultimoAcceso?: string;
  intentosFallidos: number;
  createdAt: string;
  updatedAt: string;
  historialRoles?: RoleHistory[];
}

export interface RoleHistory {
  id: number;
  usuarioId: number;
  rolAnterior: string;
  rolNuevo: string;
  cambiadoPor: number;
  razon?: string;
  createdAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol?: string;
  activo?: boolean;
  password?: string;
  razonCambioRol?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  usuariosPorRol: { rol: string; cantidad: number }[];
  usuariosCreados30Dias: number;
}

class UsersService {
  // Obtener lista de usuarios con filtros y paginación
  async getUsers(params?: {
    search?: string;
    rol?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const response = await api.get('/users', { params });
    return response as unknown as UsersResponse;
  }

  // Obtener un usuario específico
  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data as User;
  }

  // Crear nuevo usuario
  async createUser(data: CreateUserData): Promise<{ message: string; usuario: User }> {
    const response = await api.post('/users', data);
    return response as unknown as { message: string; usuario: User };
  }

  // Actualizar usuario
  async updateUser(id: number, data: UpdateUserData): Promise<{ message: string; usuario: User }> {
    const response = await api.put(`/users/${id}`, data);
    return response as unknown as { message: string; usuario: User };
  }

  // Desactivar usuario (soft delete)
  async deleteUser(id: number): Promise<{ message: string; usuario: { id: number; username: string; activo: boolean } }> {
    const response = await api.delete(`/users/${id}`);
    return response as unknown as { message: string; usuario: { id: number; username: string; activo: boolean } };
  }

  // Reactivar usuario
  async reactivateUser(id: number): Promise<{ message: string; usuario: { id: number; username: string; activo: boolean } }> {
    const response = await api.put(`/users/${id}/reactivate`);
    return response as unknown as { message: string; usuario: { id: number; username: string; activo: boolean } };
  }

  // Resetear contraseña
  async resetPassword(id: number, newPassword: string): Promise<{ message: string }> {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response as unknown as { message: string };
  }

  // Obtener historial de cambios de rol
  async getRoleHistory(id: number): Promise<RoleHistory[]> {
    const response = await api.get(`/users/${id}/role-history`);
    return response.data as RoleHistory[];
  }

  // Obtener estadísticas de usuarios
  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/users/stats/summary');
    return response as unknown as UserStats;
  }

  // Validar username disponible
  async checkUsernameAvailable(username: string, excludeId?: number): Promise<boolean> {
    try {
      const users = await this.getUsers({ search: username });
      const exactMatch = users.data.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.id !== excludeId
      );
      return !exactMatch;
    } catch {
      return true;
    }
  }

  // Validar email disponible
  async checkEmailAvailable(email: string, excludeId?: number): Promise<boolean> {
    try {
      const users = await this.getUsers({ search: email });
      const exactMatch = users.data.find(u => 
        u.email?.toLowerCase() === email.toLowerCase() && 
        u.id !== excludeId
      );
      return !exactMatch;
    } catch {
      return true;
    }
  }
}

export default new UsersService();