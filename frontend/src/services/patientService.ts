import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';
import { Patient } from '@/types/patient.types';
import { ApiResponse } from '@/types/api.types';

export const patientService = {
  // Buscar pacientes
  async searchPatients(query: string, limit?: number): Promise<ApiResponse<{ patients: Patient[] }>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    
    return api.get(`${API_ROUTES.PATIENTS.SEARCH}?${params.toString()}`);
  },

  // Obtener paciente por ID
  async getPatientById(id: number): Promise<ApiResponse<{ patient: Patient }>> {
    return api.get(API_ROUTES.PATIENTS.BY_ID(id));
  },

  // Obtener lista de pacientes
  async getPatients(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ApiResponse<{ patients: Patient[], pagination: any }>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = `${API_ROUTES.PATIENTS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  }
};