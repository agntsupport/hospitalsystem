// ABOUTME: Tests comprehensivos para usersService
// ABOUTME: Cubre gestión de usuarios, roles y validaciones

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import usersService from '../usersService';
import { api } from '@/utils/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch users', async () => {
      const mockResponse = { data: [{ id: 1, username: 'test' }], total: 1, page: 1, totalPages: 1 };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await usersService.getUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with params', async () => {
      const mockResponse = { data: [], total: 0, page: 1, totalPages: 1 };
      mockedApi.get.mockResolvedValue(mockResponse);

      await usersService.getUsers({ search: 'test', rol: 'admin', activo: true, page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/users', {
        params: { search: 'test', rol: 'admin', activo: true, page: 1, limit: 10 }
      });
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = { id: 1, username: 'test', rol: 'admin', activo: true, intentosFallidos: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01' };
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await usersService.getUserById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user', async () => {
      const userData = { username: 'newuser', password: 'Test123!', email: 'test@test.com', nombre: 'Test', apellidos: 'User', rol: 'cajero' };
      const mockResponse = { message: 'Created', usuario: { id: 1, ...userData } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await usersService.createUser(userData);

      expect(mockedApi.post).toHaveBeenCalledWith('/users', userData);
      expect(result.message).toBe('Created');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateData = { email: 'updated@test.com', telefono: '555-1234' };
      const mockResponse = { message: 'Updated', usuario: { id: 1, ...updateData } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await usersService.updateUser(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/users/1', updateData);
      expect(result.message).toBe('Updated');
    });

    it('should update with role change', async () => {
      const updateData = { rol: 'almacenista', razonCambioRol: 'Promotion' };
      const mockResponse = { message: 'Updated', usuario: { id: 1, rol: 'almacenista' } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await usersService.updateUser(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/users/1', updateData);
      expect(result.usuario.rol).toBe('almacenista');
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user', async () => {
      const mockResponse = { message: 'Deactivated', usuario: { id: 1, username: 'test', activo: false } };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await usersService.deleteUser(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/users/1');
      expect(result.usuario.activo).toBe(false);
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user', async () => {
      const mockResponse = { message: 'Reactivated', usuario: { id: 1, username: 'test', activo: true } };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await usersService.reactivateUser(1);

      expect(mockedApi.put).toHaveBeenCalledWith('/users/1/reactivate');
      expect(result.usuario.activo).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const mockResponse = { message: 'Password reset' };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await usersService.resetPassword(1, 'NewPassword123!');

      expect(mockedApi.put).toHaveBeenCalledWith('/users/1/reset-password', { newPassword: 'NewPassword123!' });
      expect(result.message).toBe('Password reset');
    });
  });

  describe('getRoleHistory', () => {
    it('should fetch role history', async () => {
      const mockHistory = [
        { id: 1, usuarioId: 1, rolAnterior: 'cajero', rolNuevo: 'almacenista', cambiadoPor: 2, createdAt: '2025-01-01' }
      ];
      mockedApi.get.mockResolvedValue({ data: mockHistory });

      const result = await usersService.getRoleHistory(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/users/1/role-history');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getUserStats', () => {
    it('should fetch user stats', async () => {
      const mockStats = { totalUsuarios: 50, usuariosActivos: 45, usuariosInactivos: 5, usuariosPorRol: [], usuariosCreados30Dias: 5 };
      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await usersService.getUserStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/users/stats/summary');
      expect(result).toEqual(mockStats);
    });
  });

  describe('checkUsernameAvailable', () => {
    it('should return true if username is available', async () => {
      mockedApi.get.mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 });

      const result = await usersService.checkUsernameAvailable('newuser');

      expect(result).toBe(true);
    });

    it('should return false if username exists', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 1, username: 'existinguser' }], total: 1 });

      const result = await usersService.checkUsernameAvailable('existinguser');

      expect(result).toBe(false);
    });

    it('should exclude specific user ID', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 5, username: 'testuser' }], total: 1 });

      const result = await usersService.checkUsernameAvailable('testuser', 5);

      expect(result).toBe(true);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await usersService.checkUsernameAvailable('test');

      expect(result).toBe(true);
    });
  });

  describe('checkEmailAvailable', () => {
    it('should return true if email is available', async () => {
      mockedApi.get.mockResolvedValue({ data: [], total: 0 });

      const result = await usersService.checkEmailAvailable('new@test.com');

      expect(result).toBe(true);
    });

    it('should return false if email exists', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 1, email: 'existing@test.com' }], total: 1 });

      const result = await usersService.checkEmailAvailable('existing@test.com');

      expect(result).toBe(false);
    });

    it('should be case insensitive', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 1, email: 'Test@Test.com' }], total: 1 });

      const result = await usersService.checkEmailAvailable('test@test.com');

      expect(result).toBe(false);
    });

    it('should exclude specific user ID', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 5, email: 'test@test.com' }], total: 1 });

      const result = await usersService.checkEmailAvailable('test@test.com', 5);

      expect(result).toBe(true);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await usersService.checkEmailAvailable('test@test.com');

      expect(result).toBe(true);
    });
  });
});
