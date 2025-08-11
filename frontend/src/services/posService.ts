import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';
import { 
  Service, 
  Product, 
  PatientAccount, 
  PatientAccountFormData, 
  AddTransactionData, 
  CloseAccountData,
  POSStats 
} from '@/types/pos.types';
import { ApiResponse } from '@/types/api.types';

export const posService = {
  // Obtener estadísticas del POS
  async getStats(): Promise<ApiResponse<{ stats: POSStats }>> {
    return api.get(API_ROUTES.POS.STATS);
  },

  // Servicios
  async getServices(params: {
    search?: string;
    activo?: boolean;
  } = {}): Promise<ApiResponse<{ services: Service[] }>> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());

    const url = `${API_ROUTES.SERVICES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },

  async searchServices(query: string, limit?: number): Promise<ApiResponse<{ services: Service[] }>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    
    return api.get(`${API_ROUTES.SERVICES.SEARCH}?${params.toString()}`);
  },

  // Productos (integrado con inventario)
  async getProducts(params: {
    search?: string;
    categoria?: string;
    activo?: boolean;
    stockMinimo?: number;
  } = {}): Promise<ApiResponse<{ products: Product[] }>> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.categoria) queryParams.append('categoria', params.categoria);
    if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());
    if (params.stockMinimo !== undefined) queryParams.append('stockMinimo', params.stockMinimo.toString());

    // Usar endpoint de inventario que tiene información de stock actualizada
    const url = `/api/inventory/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },

  async searchProducts(query: string, limit?: number): Promise<ApiResponse<{ products: Product[] }>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    
    // Usar endpoint de inventario para búsqueda también
    return api.get(`/api/inventory/products?${params.toString()}`);
  },

  // Cuentas de pacientes
  async getPatientAccounts(params: {
    estado?: string;
    pacienteId?: number;
  } = {}): Promise<ApiResponse<{ accounts: PatientAccount[] }>> {
    const queryParams = new URLSearchParams();
    
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.pacienteId) queryParams.append('pacienteId', params.pacienteId.toString());

    const url = `${API_ROUTES.PATIENT_ACCOUNTS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },

  async createPatientAccount(accountData: PatientAccountFormData): Promise<ApiResponse<{ account: PatientAccount }>> {
    return api.post(API_ROUTES.PATIENT_ACCOUNTS.BASE, accountData);
  },

  async getPatientAccountById(id: number): Promise<ApiResponse<{ account: PatientAccount }>> {
    return api.get(API_ROUTES.PATIENT_ACCOUNTS.BY_ID(id));
  },

  async addTransaction(accountId: number, transactionData: AddTransactionData): Promise<ApiResponse<{ transaction: any, account: PatientAccount }>> {
    return api.post(API_ROUTES.PATIENT_ACCOUNTS.TRANSACTIONS(accountId), transactionData);
  },

  async closeAccount(accountId: number, closeData: CloseAccountData): Promise<ApiResponse<{ account: PatientAccount }>> {
    return api.put(API_ROUTES.PATIENT_ACCOUNTS.CLOSE(accountId), closeData);
  },

  // Funciones para ventas rápidas
  async getAvailableServices(): Promise<ApiResponse<{ services: Service[] }>> {
    return api.get('/pos/services');
  },

  async processQuickSale(saleData: {
    items: Array<{
      tipo: 'servicio' | 'producto';
      itemId: number;
      cantidad: number;
      precioUnitario: number;
    }>;
    metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
    montoRecibido?: number;
    observaciones?: string;
  }): Promise<ApiResponse<{ sale: any }>> {
    return api.post('/pos/quick-sale', saleData);
  },

  async getSalesHistory(params: {
    fechaInicio?: string;
    fechaFin?: string;
    cajero?: string;
    metodoPago?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ items: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    const url = `/pos/sales-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  }
};