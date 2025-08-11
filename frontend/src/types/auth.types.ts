export interface User {
  id: number;
  username: string;
  email?: string;
  rol: UserRole;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 
  | 'cajero'
  | 'enfermero'
  | 'almacenista'
  | 'administrador'
  | 'socio'
  | 'medico_residente'
  | 'medico_especialista';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expiresIn: string;
  };
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  rol: UserRole;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}