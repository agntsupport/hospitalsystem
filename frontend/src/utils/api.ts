import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_CONFIG } from './constants';
import { ApiResponse, ApiError } from '@/types/api.types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Agregar token de autenticación si existe
        const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        // Manejar errores de autenticación
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
          localStorage.removeItem(APP_CONFIG.USER_KEY);
          
          // Redirigir al login si no estamos ya ahí
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        // Transformar error en formato estándar
        const apiError: ApiError = {
          success: false,
          message: error.response?.data?.message || 'Error de conexión',
          error: error.response?.data?.error || error.message,
          status: error.response?.status,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // Métodos HTTP básicos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Método para actualizar el token
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Método para remover el token
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Método para obtener la instancia de axios (para casos especiales)
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Instancia singleton
export const apiClient = new ApiClient();

// Exportar métodos directamente para facilidad de uso
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  setAuthToken: apiClient.setAuthToken.bind(apiClient),
  removeAuthToken: apiClient.removeAuthToken.bind(apiClient),
  client: apiClient.getClient(),
};