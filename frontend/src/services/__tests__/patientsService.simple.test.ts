import { patientsService } from '../patientsService';

// Mock the api module completely
jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Import the mocked api
import { api } from '@/utils/api';
const mockedApi = api as jest.Mocked<typeof api>;

describe('patientsService (Simple Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatients', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { items: [], pagination: {} },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatients();

      expect(mockedApi.get).toHaveBeenCalledWith('/patients');
      expect(result).toEqual(mockResponse);
    });

    it('should build query string correctly', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({
        search: 'Juan',
        offset: 20,
        limit: 10
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/patients?search=Juan&offset=20&limit=10');
    });

    it('should handle empty parameters', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({});

      expect(mockedApi.get).toHaveBeenCalledWith('/patients');
    });
  });

  describe('getPatientById', () => {
    it('should call API with patient ID', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, nombre: 'Juan' },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatientById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/patients/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle string ID', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatientById(123);

      expect(mockedApi.get).toHaveBeenCalledWith('/patients/123');
    });
  });

  describe('createPatient', () => {
    it('should call API with patient data', async () => {
      const patientData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...patientData },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await patientsService.createPatient(patientData);

      expect(mockedApi.post).toHaveBeenCalledWith('/patients', patientData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePatient', () => {
    it('should call API with patient ID and update data', async () => {
      const updateData = { telefono: '9876543210' };
      const mockResponse = { success: true, data: { id: 1, ...updateData } };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await patientsService.updatePatient(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/patients/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deletePatient', () => {
    it('should call API with patient ID', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Patient deleted' },
      };

      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await patientsService.deletePatient(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/patients/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchPatients', () => {
    it('should call search endpoint with query', async () => {
      const mockResponse = {
        success: true,
        data: { patients: [] },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.searchPatients('Juan');

      expect(mockedApi.get).toHaveBeenCalledWith('/patients/search?q=Juan&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('should include limit parameter when provided', async () => {
      const mockResponse = { success: true, data: { patients: [] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.searchPatients('Juan', 5);

      expect(mockedApi.get).toHaveBeenCalledWith('/patients/search?q=Juan&limit=5');
    });
  });

  describe('getPatientStats', () => {
    it('should call stats endpoint', async () => {
      // Mock the backend's nested response structure (from patients.routes.js lines 191-212)
      const mockBackendResponse = {
        success: true,
        data: {
          resumen: {
            totalPacientes: 100,
            pacientesActivos: 90,
            pacientesMenores: 15,
            pacientesAdultos: 85,
            pacientesConCuentaAbierta: 25,
            pacientesHospitalizados: 20,
            pacientesAmbulatorios: 5,
            registrosRecientes: 10,
            promedioEdad: 42.5
          },
          distribucion: {
            genero: { M: 60, F: 38, Otro: 2 },
            edad: { '0-17': 15, '18-35': 20, '36-55': 35, '56+': 30 }
          }
        },
        message: 'Estadísticas obtenidas correctamente'
      };

      mockedApi.get.mockResolvedValue(mockBackendResponse);

      const result = await patientsService.getPatientStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/patients/stats');

      // Service transforms backend nested structure to flat frontend structure (patientsService.ts lines 28-48)
      expect(result).toEqual({
        success: true,
        message: 'Estadísticas obtenidas correctamente',
        data: {
          totalPacientes: 100,
          pacientesMenores: 15,
          pacientesAdultos: 85,
          pacientesConCuentaAbierta: 25,
          pacientesHospitalizados: 20,
          pacientesAmbulatorios: 5,
          patientsByGender: { M: 60, F: 38, Otro: 2 },
          patientsByAgeGroup: { '0-17': 15, '18-35': 20, '36-55': 35, '56+': 30 },
          growth: {
            total: 0,
            weekly: 0,
            monthly: 0
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate API errors', async () => {
      const mockError = new Error('API Error');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(patientsService.getPatients()).rejects.toThrow('API Error');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Patient not found' },
        },
      };

      mockedApi.get.mockRejectedValue(notFoundError);

      await expect(patientsService.getPatientById(999)).rejects.toEqual(notFoundError);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { 
            message: 'Validation failed',
            errors: { email: 'Invalid format' }
          },
        },
      };

      mockedApi.post.mockRejectedValue(validationError);

      await expect(patientsService.createPatient({
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        genero: 'M',
        telefono: '1234567890',
      })).rejects.toEqual(validationError);
    });
  });

  describe('Response Processing', () => {
    it('should return successful responses as-is', async () => {
      const successResponse = {
        success: true,
        data: { id: 1, nombre: 'Juan' },
        message: 'Success',
      };

      mockedApi.get.mockResolvedValue(successResponse);

      const result = await patientsService.getPatientById(1);

      expect(result).toEqual(successResponse);
    });

    it('should return error responses as-is', async () => {
      const errorResponse = {
        success: false,
        message: 'Patient not found',
        data: null,
      };

      mockedApi.get.mockResolvedValue(errorResponse);

      const result = await patientsService.getPatientById(999);

      expect(result).toEqual(errorResponse);
    });
  });

  describe('URL Building Edge Cases', () => {
    it('should handle special characters in search', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ search: 'José María' });

      // URLSearchParams encodes spaces as '+' (both '+' and '%20' are valid)
      expect(mockedApi.get).toHaveBeenCalledWith('/patients?search=Jos%C3%A9+Mar%C3%ADa');
    });

    it('should handle boolean false values', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ activo: false });

      expect(mockedApi.get).toHaveBeenCalledWith('/patients?activo=false');
    });

    it('should handle zero values', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ offset: 0, limit: 0 });

      expect(mockedApi.get).toHaveBeenCalledWith('/patients?offset=0&limit=0');
    });

    it('should skip undefined values', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({
        search: 'Juan',
        offset: undefined,
        limit: undefined,
        genero: undefined
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/patients?search=Juan');
    });
  });
});