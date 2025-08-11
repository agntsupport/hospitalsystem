import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, User, ChangePasswordData } from '@/types/auth.types';
import { api } from '@/utils/api';
import { API_ROUTES, APP_CONFIG } from '@/utils/constants';

// Función helper para obtener token de manera segura
const getTokenFromStorage = (): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(APP_CONFIG.TOKEN_KEY) : null;
  } catch {
    return null;
  }
};

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: getTokenFromStorage(),
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Thunks asíncronos
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.AUTH.LOGIN, credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
        
        // Configurar token en cliente API
        api.setAuthToken(token);
        
        return { user, token };
      }
      
      return rejectWithValue(response.error || 'Error en el login');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error de conexión');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('No hay token');
      }
      
      const response = await api.get(API_ROUTES.AUTH.VERIFY_TOKEN);
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      return rejectWithValue('Token inválido');
    } catch (error: any) {
      // Limpiar datos de autenticación si el token es inválido
      localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.USER_KEY);
      api.removeAuthToken();
      
      return rejectWithValue(error.error || 'Token inválido');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.AUTH.PROFILE);
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      return rejectWithValue('Error al obtener perfil');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al obtener perfil');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { email?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.AUTH.PROFILE, profileData);
      
      if (response.success && response.data) {
        // Actualizar usuario en localStorage
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      return rejectWithValue('Error al actualizar perfil');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al actualizar perfil');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordData, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, passwordData);
      
      if (response.success) {
        return response.message || 'Contraseña cambiada exitosamente';
      }
      
      return rejectWithValue('Error al cambiar contraseña');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al cambiar contraseña');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Intentar notificar al servidor (opcional)
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } catch (error) {
      // Ignorar errores del servidor en logout
    } finally {
      // Limpiar datos locales siempre
      localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.USER_KEY);
      api.removeAuthToken();
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
      const userStr = localStorage.getItem(APP_CONFIG.USER_KEY);
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
          api.setAuthToken(token);
        } catch (error) {
          // Si hay error al parsear, limpiar todo
          localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
          localStorage.removeItem(APP_CONFIG.USER_KEY);
        }
      }
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.USER_KEY);
      api.removeAuthToken();
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Verify token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Get profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError, initializeAuth, resetAuth } = authSlice.actions;
export default authSlice.reducer;