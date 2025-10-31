import { api } from '@/utils/api';
import { 
  Patient, 
  PatientResponsible,
  PatientStats,
  PatientFilters,
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateResponsibleRequest,
  UpdateResponsibleRequest,
  PatientsResponse,
  SinglePatientResponse,
  PatientStatsResponse,
  ResponsiblesResponse,
  SingleResponsibleResponse
} from '@/types/patients.types';

export const patientsService = {
  // Patient Statistics
  async getPatientStats(): Promise<PatientStatsResponse> {
    const response = await api.get('/patients/stats');
    
    // Transform the response to match frontend expectations
    if (response.success && response.data) {
      const { resumen, distribucion } = response.data;
      
      // Map backend structure to frontend PatientStats interface
      const transformedStats: PatientStats = {
        totalPacientes: resumen?.totalPacientes || 0,
        pacientesMenores: resumen?.pacientesMenores || 0,
        pacientesAdultos: resumen?.pacientesAdultos || 0,
        pacientesConCuentaAbierta: resumen?.pacientesConCuentaAbierta || 0,
        pacientesHospitalizados: resumen?.pacientesHospitalizados || 0,
        pacientesAmbulatorios: resumen?.pacientesAmbulatorios || 0,
        patientsByGender: distribucion?.genero || { M: 0, F: 0, Otro: 0 },
        patientsByAgeGroup: distribucion?.edad || { '0-17': 0, '18-35': 0, '36-55': 0, '56+': 0 }
      };

      return {
        success: true,
        message: response.message || "Operación exitosa",
        data: transformedStats
      };
    }

    return {
      success: false,
      message: response.message || "Error al obtener estadísticas",
      data: {
        totalPacientes: 0,
        pacientesMenores: 0,
        pacientesAdultos: 0,
        pacientesConCuentaAbierta: 0,
        pacientesHospitalizados: 0,
        pacientesAmbulatorios: 0,
        patientsByGender: { M: 0, F: 0, Otro: 0 },
        patientsByAgeGroup: { '0-17': 0, '18-35': 0, '36-55': 0, '56+': 0 }
      }
    };
  },

  // Patient CRUD operations
  async getPatients(filters?: PatientFilters): Promise<PatientsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/patients?${queryString}` : '/patients';

    return api.get(url) as Promise<PatientsResponse>;
  },

  async getPatientById(id: number): Promise<SinglePatientResponse> {
    return api.get(`/patients/${id}`) as Promise<SinglePatientResponse>;
  },

  async createPatient(patientData: CreatePatientRequest): Promise<SinglePatientResponse> {
    return api.post('/patients', patientData) as Promise<SinglePatientResponse>;
  },

  async updatePatient(id: number, patientData: UpdatePatientRequest): Promise<SinglePatientResponse> {
    return api.put(`/patients/${id}`, patientData) as Promise<SinglePatientResponse>;
  },

  async deletePatient(id: number): Promise<{ success: boolean; message: string }> {
    return api.delete(`/patients/${id}`) as Promise<{ success: boolean; message: string }>;
  },

  // Patient search
  async searchPatients(query: string, limit: number = 10): Promise<PatientsResponse> {
    return api.get(`/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`) as Promise<PatientsResponse>;
  },

  // Patient responsibles management
  async getPatientResponsibles(patientId: number): Promise<ResponsiblesResponse> {
    return api.get(`/patients/${patientId}/responsibles`) as Promise<ResponsiblesResponse>;
  },

  async createPatientResponsible(patientId: number, responsibleData: CreateResponsibleRequest): Promise<SingleResponsibleResponse> {
    return api.post(`/patients/${patientId}/responsibles`, responsibleData) as Promise<SingleResponsibleResponse>;
  },

  async updatePatientResponsible(patientId: number, responsibleId: number, responsibleData: UpdateResponsibleRequest): Promise<SingleResponsibleResponse> {
    return api.put(`/patients/${patientId}/responsibles/${responsibleId}`, responsibleData) as Promise<SingleResponsibleResponse>;
  },

  async deletePatientResponsible(patientId: number, responsibleId: number): Promise<{ success: boolean; message: string }> {
    return api.delete(`/patients/${patientId}/responsibles/${responsibleId}`) as Promise<{ success: boolean; message: string }>;
  },

  // Utility functions
  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  isMinor(birthDate: string): boolean {
    return this.calculateAge(birthDate) < 18;
  },

  formatPatientName(patient: Patient): string {
    return `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}`.trim();
  },

  formatResponsibleName(responsible: PatientResponsible): string {
    return `${responsible.nombre} ${responsible.apellidoPaterno} ${responsible.apellidoMaterno || ''}`.trim();
  }
};