import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState, AppDispatch } from '@/store/store';
import { 
  login, 
  logout, 
  verifyToken, 
  initializeAuth, 
  clearError,
  getProfile,
  updateProfile,
  changePassword 
} from '@/store/slices/authSlice';
import { LoginCredentials, ChangePasswordData } from '@/types/auth.types';
import { APP_CONFIG } from '@/utils/constants';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  // Inicializar autenticación al cargar la aplicación
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Solo verificar token en casos específicos (NO después de login exitoso)
  useEffect(() => {
    // Solo verificar si hay token guardado pero no hay sesión activa
    const savedToken = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    if (savedToken && !auth.user && !auth.isAuthenticated && !auth.loading) {
      dispatch(verifyToken());
    }
  }, [auth.user, auth.isAuthenticated, auth.loading, dispatch]);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const result = await dispatch(login(credentials));
      if (login.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { success: false, error: result.payload as string };
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado' };
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const handleVerifyToken = async () => {
    try {
      const result = await dispatch(verifyToken());
      return verifyToken.fulfilled.match(result);
    } catch (error) {
      return false;
    }
  };

  const handleGetProfile = async () => {
    try {
      const result = await dispatch(getProfile());
      return getProfile.fulfilled.match(result);
    } catch (error) {
      return false;
    }
  };

  const handleUpdateProfile = async (profileData: { email?: string }) => {
    try {
      const result = await dispatch(updateProfile(profileData));
      if (updateProfile.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { success: false, error: result.payload as string };
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado' };
    }
  };

  const handleChangePassword = async (passwordData: ChangePasswordData) => {
    try {
      const result = await dispatch(changePassword(passwordData));
      if (changePassword.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { success: false, error: result.payload as string };
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado' };
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  // Función para verificar permisos
  const hasPermission = (module: string, action: string): boolean => {
    if (!auth.user) return false;
    
    // Por ahora, implementación básica por roles
    const { rol } = auth.user;
    
    // Administrador tiene todos los permisos
    if (rol === 'administrador') return true;
    
    // Implementar lógica específica de permisos aquí
    // Esto se puede mejorar con una matriz de permisos más sofisticada
    
    return false;
  };

  // Función para verificar roles
  const hasRole = (roles: string | string[]): boolean => {
    if (!auth.user) return false;
    
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(auth.user.rol);
  };

  return {
    // Estado
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    
    // Funciones
    login: handleLogin,
    logout: handleLogout,
    verifyToken: handleVerifyToken,
    getProfile: handleGetProfile,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    clearError: clearAuthError,
    hasPermission,
    hasRole,
  };
};