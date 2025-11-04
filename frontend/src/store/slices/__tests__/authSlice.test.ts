// ABOUTME: Comprehensive tests for authSlice Redux slice - login, logout, token validation, profile management

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  clearError,
  initializeAuth,
  resetAuth
} from '../authSlice';
import { AuthState } from '@/types/auth.types';
import { APP_CONFIG } from '@/utils/constants';

// Mock the api module
jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    setAuthToken: jest.fn(),
    removeAuthToken: jest.fn(),
  },
}));

import { api } from '@/utils/api';
const mockedApi = api as jest.Mocked<typeof api>;

describe('authSlice', () => {
  let store: EnhancedStore;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Reset store
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Clear localStorage
    localStorageMock.clear();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state when no token in localStorage', () => {
      const state = store.getState().auth;

      expect(state).toEqual({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    });

    it('should initialize with token when loaded via initializeAuth', () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        rol: 'administrador',
      };

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

      store.dispatch(initializeAuth());

      const state = store.getState().auth;
      expect(state.token).toBe('test-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Synchronous Reducers', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        // Set error first by dispatching login.rejected
        const action = login.rejected(
          new Error('Login failed'),
          'requestId',
          { username: 'test', password: 'test' },
          'Login failed'
        );
        store.dispatch(action);

        // Verify error is set
        expect(store.getState().auth.error).toBe('Login failed');

        // Clear error
        store.dispatch(clearError());

        const state = store.getState().auth;
        expect(state.error).toBeNull();
      });
    });

    describe('initializeAuth', () => {
      it('should initialize auth from localStorage when both token and user exist', () => {
        const mockUser = {
          id: 1,
          username: 'admin',
          rol: 'administrador',
          email: 'admin@hospital.com',
        };

        localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
        localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

        store.dispatch(initializeAuth());

        const state = store.getState().auth;
        expect(state.token).toBe('test-token');
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
        expect(mockedApi.setAuthToken).toHaveBeenCalledWith('test-token');
      });

      it('should not initialize auth when token is missing', () => {
        const mockUser = {
          id: 1,
          username: 'admin',
          rol: 'administrador',
        };

        localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

        store.dispatch(initializeAuth());

        const state = store.getState().auth;
        expect(state.token).toBeNull();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });

      it('should clear localStorage when user JSON is invalid', () => {
        localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
        localStorageMock.setItem(APP_CONFIG.USER_KEY, 'invalid-json');

        store.dispatch(initializeAuth());

        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
      });
    });

    describe('resetAuth', () => {
      it('should reset all auth state and clear localStorage', () => {
        const mockUser = { id: 1, username: 'admin', rol: 'administrador' };

        // Set up state
        localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
        localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

        store.dispatch(resetAuth());

        const state = store.getState().auth;
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
        expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
        expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
        expect(mockedApi.removeAuthToken).toHaveBeenCalled();
      });
    });
  });

  describe('Async Thunks - login', () => {
    const mockCredentials = { username: 'admin', password: 'admin123' };
    const mockUser = {
      id: 1,
      username: 'admin',
      rol: 'administrador',
      email: 'admin@hospital.com',
    };
    const mockToken = 'test-jwt-token';

    it('should handle login pending state', () => {
      const action = login.pending('requestId', mockCredentials);
      const state = authReducer(undefined, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await store.dispatch(login(mockCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBe(mockToken);
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(mockUser));
      expect(mockedApi.setAuthToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Credenciales inválidas';
      const mockResponse = {
        success: false,
        error: errorMessage,
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await store.dispatch(login(mockCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should handle login network error', async () => {
      mockedApi.post.mockRejectedValue({ error: 'Error de conexión' });

      await store.dispatch(login(mockCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error de conexión');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Async Thunks - verifyToken', () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      rol: 'administrador',
    };

    it('should handle verifyToken pending state', () => {
      const action = verifyToken.pending('requestId');
      const state = authReducer(undefined, action);

      expect(state.loading).toBe(true);
    });

    it('should verify valid token', async () => {
      // Set up store with token
      const storeWithToken = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            token: 'valid-token',
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          },
        },
      });

      const mockResponse = {
        success: true,
        data: { user: mockUser },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await storeWithToken.dispatch(verifyToken());

      const state = storeWithToken.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle invalid token', async () => {
      // Set up store with token
      const storeWithToken = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            token: 'invalid-token',
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          },
        },
      });

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'invalid-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, '{}');

      mockedApi.get.mockRejectedValue({ error: 'Token inválido' });

      await storeWithToken.dispatch(verifyToken());

      const state = storeWithToken.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Token inválido');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
      expect(mockedApi.removeAuthToken).toHaveBeenCalled();
    });

    it('should reject when no token exists', async () => {
      await store.dispatch(verifyToken());

      const state = store.getState().auth;
      expect(state.error).toBe('No hay token');
    });
  });

  describe('Async Thunks - getProfile', () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      rol: 'administrador',
      email: 'admin@hospital.com',
    };

    it('should fetch user profile successfully', async () => {
      const mockResponse = {
        success: true,
        data: { user: mockUser },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(getProfile());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(mockUser));
    });

    it('should handle getProfile error', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al obtener perfil' });

      await store.dispatch(getProfile());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al obtener perfil');
    });
  });

  describe('Async Thunks - updateProfile', () => {
    const mockUpdatedUser = {
      id: 1,
      username: 'admin',
      rol: 'administrador',
      email: 'newemail@hospital.com',
    };

    it('should update profile successfully', async () => {
      const mockResponse = {
        success: true,
        data: { user: mockUpdatedUser },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      await store.dispatch(updateProfile({ email: 'newemail@hospital.com' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUpdatedUser);
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBe(JSON.stringify(mockUpdatedUser));
    });

    it('should handle updateProfile error', async () => {
      mockedApi.put.mockRejectedValue({ error: 'Error al actualizar perfil' });

      await store.dispatch(updateProfile({ email: 'test@test.com' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al actualizar perfil');
    });
  });

  describe('Async Thunks - changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Contraseña cambiada exitosamente',
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await store.dispatch(changePassword({
        currentPassword: 'old123',
        newPassword: 'new456',
      }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle changePassword error', async () => {
      mockedApi.post.mockRejectedValue({ error: 'Contraseña actual incorrecta' });

      await store.dispatch(changePassword({
        currentPassword: 'wrong',
        newPassword: 'new456',
      }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Contraseña actual incorrecta');
    });
  });

  describe('Async Thunks - logout', () => {
    it('should logout successfully and clear all data', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };

      // Set up authenticated state
      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

      const storeWithAuth = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            token: 'test-token',
            user: mockUser,
            loading: false,
            error: null,
            isAuthenticated: true,
          },
        },
      });

      mockedApi.post.mockResolvedValue({ success: true });

      await storeWithAuth.dispatch(logout());

      const state = storeWithAuth.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
      expect(mockedApi.removeAuthToken).toHaveBeenCalled();
    });

    it('should logout even when API call fails', async () => {
      const mockUser = { id: 1, username: 'admin', rol: 'administrador' };

      localStorageMock.setItem(APP_CONFIG.TOKEN_KEY, 'test-token');
      localStorageMock.setItem(APP_CONFIG.USER_KEY, JSON.stringify(mockUser));

      const storeWithAuth = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            token: 'test-token',
            user: mockUser,
            loading: false,
            error: null,
            isAuthenticated: true,
          },
        },
      });

      mockedApi.post.mockRejectedValue(new Error('Server error'));

      await storeWithAuth.dispatch(logout());

      const state = storeWithAuth.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorageMock.getItem(APP_CONFIG.TOKEN_KEY)).toBeNull();
      expect(localStorageMock.getItem(APP_CONFIG.USER_KEY)).toBeNull();
    });
  });
});
