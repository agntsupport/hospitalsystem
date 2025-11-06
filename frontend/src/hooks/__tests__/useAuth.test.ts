import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../useAuth';
import authReducer, {
  login,
  logout,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  initializeAuth,
  clearError
} from '@/store/slices/authSlice';
import { api } from '@/utils/api';
import { APP_CONFIG } from '@/utils/constants';

// Mock dependencies
jest.mock('@/utils/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    setAuthToken: jest.fn(),
    removeAuthToken: jest.fn()
  }
}));

jest.mock('@/utils/constants', () => ({
  APP_CONFIG: {
    TOKEN_KEY: 'hospital_token',
    USER_KEY: 'hospital_user'
  },
  API_ROUTES: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      VERIFY_TOKEN: '/api/auth/verify-token',
      PROFILE: '/api/auth/profile',
      CHANGE_PASSWORD: '/api/auth/change-password'
    }
  }
}));

const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper para crear un store de Redux
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: initialState
  });
};

// Wrapper para el hook con Redux
const wrapper = (store: any) => ({ children }: any) => {
  const React = require('react');
  return React.createElement(Provider, { store }, children);
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Limpiar todos los timers pendientes para evitar memory leaks
    jest.clearAllTimers();
    // Forzar garbage collection de mocks
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default unauthenticated state', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should initialize with token from localStorage', () => {
      const mockToken = 'test-token';
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, mockToken);
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      // Esperar a que initializeAuth se ejecute
      waitFor(() => {
        expect(result.current.token).toBe(mockToken);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle corrupted user data in localStorage', () => {
      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, 'invalid-json');

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
      });
    });

    it('should call initializeAuth on mount', () => {
      const store = createMockStore();
      renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(store.getState().auth).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };
      const mockToken = 'jwt-token';

      mockedApi.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
        message: 'Login exitoso'
      });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ username: 'admin', password: 'admin123' });
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ success: true });
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.error).toBeNull();
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBe(mockToken);
        expect(mockedApi.setAuthToken).toHaveBeenCalledWith(mockToken);
      });
    });

    it('should handle login failure with invalid credentials', async () => {
      mockedApi.post.mockResolvedValue({
        success: false,
        data: null,
        error: 'Credenciales inválidas'
      });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ username: 'wrong', password: 'wrong' });
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ success: false, error: 'Credenciales inválidas' });
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    it('should handle network error during login', async () => {
      mockedApi.post.mockRejectedValue({ error: 'Error de red' });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ username: 'admin', password: 'admin123' });
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ success: false, error: 'Error de red' });
      });
    });

    it('should set loading state during login', async () => {
      mockedApi.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { user: {}, token: 'token' },
          message: 'Success'
        }), 100))
      );

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      act(() => {
        result.current.login({ username: 'admin', password: 'admin123' });
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should store user data in localStorage on successful login', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };
      const mockToken = 'jwt-token';

      mockedApi.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
        message: 'Login exitoso'
      });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.login({ username: 'admin', password: 'admin123' });
      });

      await waitFor(() => {
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(mockUser));
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear all data', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };
      const mockToken = 'jwt-token';

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, mockToken);
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

      mockedApi.post.mockResolvedValue({ success: true, data: null, message: 'Logout exitoso' });

      const store = createMockStore({
        auth: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
        expect(mockedApi.removeAuthToken).toHaveBeenCalled();
      });
    });

    it('should clear localStorage even if API call fails', async () => {
      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify({ id: 1 }));

      mockedApi.post.mockRejectedValue(new Error('Network error'));

      const store = createMockStore({
        auth: {
          user: { id: 1 },
          token: 'token',
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };
      const mockToken = 'valid-token';

      mockedApi.get.mockResolvedValue({
        success: true,
        data: { user: mockUser },
        message: 'Token válido'
      });

      const store = createMockStore({
        auth: { token: mockToken, user: null, isAuthenticated: false, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyToken();
      });

      await waitFor(() => {
        expect(verifyResult).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle invalid token', async () => {
      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'invalid-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify({ id: 1 }));

      mockedApi.get.mockRejectedValue({ error: 'Token inválido' });

      const store = createMockStore({
        auth: { token: 'invalid-token', user: null, isAuthenticated: false, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyToken();
      });

      await waitFor(() => {
        expect(verifyResult).toBe(false);
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
        expect(mockedApi.removeAuthToken).toHaveBeenCalled();
      });
    });

    it('should handle missing token', async () => {
      const store = createMockStore({
        auth: { token: null, user: null, isAuthenticated: false, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyToken();
      });

      await waitFor(() => {
        expect(verifyResult).toBe(false);
      });
    });

    it('should auto-verify token when saved in localStorage but no active session', async () => {
      const mockToken = 'saved-token';
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, mockToken);

      mockedApi.get.mockResolvedValue({
        success: true,
        data: { user: mockUser },
        message: 'Token válido'
      });

      const store = createMockStore();
      renderHook(() => useAuth(), { wrapper: wrapper(store) });

      // El useEffect debería llamar a verifyToken automáticamente
      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', rol: 'administrador' };

      mockedApi.get.mockResolvedValue({
        success: true,
        data: { user: mockUser },
        message: 'Perfil obtenido'
      });

      const store = createMockStore({
        auth: { token: 'token', user: null, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let profileResult;
      await act(async () => {
        profileResult = await result.current.getProfile();
      });

      await waitFor(() => {
        expect(profileResult).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should handle error when fetching profile', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al obtener perfil' });

      const store = createMockStore({
        auth: { token: 'token', user: null, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let profileResult;
      await act(async () => {
        profileResult = await result.current.getProfile();
      });

      await waitFor(() => {
        expect(profileResult).toBe(false);
      });
    });

    it('should update localStorage with fetched profile', async () => {
      const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', rol: 'administrador' };

      mockedApi.get.mockResolvedValue({
        success: true,
        data: { user: mockUser },
        message: 'Perfil obtenido'
      });

      const store = createMockStore({
        auth: { token: 'token', user: null, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.getProfile();
      });

      await waitFor(() => {
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(mockUser));
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = { id: 1, username: 'admin', email: 'newemail@test.com', rol: 'administrador' };

      mockedApi.put.mockResolvedValue({
        success: true,
        data: { user: updatedUser },
        message: 'Perfil actualizado'
      });

      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'admin', email: 'old@test.com', rol: 'administrador' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ email: 'newemail@test.com' });
      });

      await waitFor(() => {
        expect(updateResult).toEqual({ success: true });
        expect(result.current.user).toEqual(updatedUser);
      });
    });

    it('should handle error when updating profile', async () => {
      mockedApi.put.mockResolvedValue({
        success: false,
        data: null,
        error: 'Error al actualizar'
      });

      const store = createMockStore({
        auth: { token: 'token', user: { id: 1 }, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ email: 'test@test.com' });
      });

      await waitFor(() => {
        expect(updateResult).toEqual({ success: false, error: 'Error al actualizar perfil' });
      });
    });

    it('should update localStorage with new profile data', async () => {
      const updatedUser = { id: 1, username: 'admin', email: 'new@test.com', rol: 'administrador' };

      mockedApi.put.mockResolvedValue({
        success: true,
        data: { user: updatedUser },
        message: 'Perfil actualizado'
      });

      const store = createMockStore({
        auth: { token: 'token', user: { id: 1 }, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.updateProfile({ email: 'new@test.com' });
      });

      await waitFor(() => {
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(updatedUser));
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockedApi.post.mockResolvedValue({
        success: true,
        data: null,
        message: 'Contraseña cambiada exitosamente'
      });

      const store = createMockStore({
        auth: { token: 'token', user: { id: 1 }, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let changeResult;
      await act(async () => {
        changeResult = await result.current.changePassword({
          currentPassword: 'old123',
          newPassword: 'new123'
        });
      });

      await waitFor(() => {
        expect(changeResult).toEqual({ success: true });
      });
    });

    it('should handle error when changing password', async () => {
      mockedApi.post.mockResolvedValue({
        success: false,
        data: null,
        error: 'Contraseña actual incorrecta'
      });

      const store = createMockStore({
        auth: { token: 'token', user: { id: 1 }, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let changeResult;
      await act(async () => {
        changeResult = await result.current.changePassword({
          currentPassword: 'wrong',
          newPassword: 'new123'
        });
      });

      await waitFor(() => {
        expect(changeResult).toEqual({ success: false, error: 'Error al cambiar contraseña' });
      });
    });

    it('should handle network error when changing password', async () => {
      mockedApi.post.mockRejectedValue({ error: 'Error de conexión' });

      const store = createMockStore({
        auth: { token: 'token', user: { id: 1 }, isAuthenticated: true, loading: false, error: null }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let changeResult;
      await act(async () => {
        changeResult = await result.current.changePassword({
          currentPassword: 'old123',
          newPassword: 'new123'
        });
      });

      await waitFor(() => {
        expect(changeResult).toEqual({ success: false, error: 'Error de conexión' });
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const store = createMockStore({
        auth: {
          token: null,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: 'Some error'
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true for administrator role', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'admin', rol: 'administrador' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasPermission('patients', 'read')).toBe(true);
      expect(result.current.hasPermission('inventory', 'write')).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasPermission('patients', 'read')).toBe(false);
    });

    it('should return false for non-admin roles', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'cajero', rol: 'cajero' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasPermission('inventory', 'write')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'cajero', rol: 'cajero' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole('cajero')).toBe(true);
    });

    it('should return true when user has one of the specified roles (array)', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'medico', rol: 'medico_residente' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole(['medico_residente', 'medico_especialista'])).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'cajero', rol: 'cajero' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole('administrador')).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole('cajero')).toBe(false);
    });

    it('should handle single role as string', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'admin', rol: 'administrador' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole('administrador')).toBe(true);
    });

    it('should handle multiple roles as array', () => {
      const store = createMockStore({
        auth: {
          token: 'token',
          user: { id: 1, username: 'enfermero', rol: 'enfermero' },
          isAuthenticated: true,
          loading: false,
          error: null
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      expect(result.current.hasRole(['cajero', 'enfermero', 'almacenista'])).toBe(true);
      expect(result.current.hasRole(['cajero', 'almacenista'])).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid login/logout cycles', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };
      const mockToken = 'jwt-token';

      mockedApi.post
        .mockResolvedValueOnce({ success: true, data: { user: mockUser, token: mockToken }, message: 'Login' })
        .mockResolvedValueOnce({ success: true, data: null, message: 'Logout' })
        .mockResolvedValueOnce({ success: true, data: { user: mockUser, token: mockToken }, message: 'Login' })
        .mockResolvedValueOnce({ success: true, data: null, message: 'Logout' });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      await act(async () => {
        await result.current.login({ username: 'admin', password: 'admin123' });
        await result.current.logout();
        await result.current.login({ username: 'admin', password: 'admin123' });
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    it('should handle unexpected error format', async () => {
      mockedApi.post.mockRejectedValue('String error');

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ username: 'admin', password: 'admin123' });
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ success: false, error: 'Error inesperado' });
      });
    });

    it('should handle empty credentials', async () => {
      mockedApi.post.mockResolvedValue({
        success: false,
        data: null,
        error: 'Credenciales requeridas'
      });

      const store = createMockStore();
      const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ username: '', password: '' });
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ success: false, error: 'Credenciales requeridas' });
      });
    });
  });
});
