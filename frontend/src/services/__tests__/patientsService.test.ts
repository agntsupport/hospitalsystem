import { patientsService } from '../patientsService';
import { API_ROUTES } from '@/utils/constants';

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

describe('patientsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatients', () => {
    it('should fetch patients with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              nombre: 'Juan',
              apellidoPaterno: 'Pérez',
              apellidoMaterno: 'García',
              fechaNacimiento: '1990-01-01',
              genero: 'M',
              telefono: '1234567890',
              email: 'juan@example.com',
              activo: true,
              createdAt: '2025-01-01',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatients();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BASE);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch patients with search parameters', async () => {
      const mockResponse = {
        success: true,
        data: { items: [], pagination: {} },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const params = {
        search: 'Juan',
        page: 2,
        limit: 10,
        genero: 'M',
        activo: true,
      };

      await patientsService.getPatients(params);

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?search=Juan&page=2&limit=10&genero=M&activo=true`
      );
    });

    it('should handle empty parameters', async () => {
      const mockResponse = {
        success: true,
        data: { items: [], pagination: {} },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({});

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BASE);
    });

    it('should handle undefined parameters', async () => {
      const mockResponse = {
        success: true,
        data: { items: [], pagination: {} },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const params = {
        search: 'Juan',
        page: undefined,
        limit: undefined,
        genero: undefined,
        activo: undefined,
      };

      await patientsService.getPatients(params);

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?search=Juan`
      );
    });
  });

  describe('getPatientById', () => {
    it('should fetch patient by ID', async () => {
      const mockPatient = {
        id: 1,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'juan@example.com',
        activo: true,
        createdAt: '2025-01-01',
      };

      const mockResponse = {
        success: true,
        data: mockPatient,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatientById(1);

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID(1));
      expect(result).toEqual(mockResponse);
    });

    it('should handle string ID parameter', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, nombre: 'Juan' },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatientById(1);

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID('1'));
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const patientData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
        email: 'juan@example.com',
        direccion: 'Calle Test 123',
        ciudad: 'Ciudad Test',
        estado: 'Estado Test',
        codigoPostal: '12345',
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...patientData, activo: true, createdAt: '2025-01-01' },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await patientsService.createPatient(patientData);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BASE, patientData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle minimal patient data', async () => {
      const minimalPatientData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...minimalPatientData, activo: true, createdAt: '2025-01-01' },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await patientsService.createPatient(minimalPatientData);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BASE, minimalPatientData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePatient', () => {
    it('should update an existing patient', async () => {
      const updateData = {
        telefono: '9876543210',
        email: 'newemail@example.com',
        direccion: 'Nueva dirección',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          nombre: 'Juan',
          apellidoPaterno: 'Pérez',
          ...updateData,
          activo: true,
          createdAt: '2025-01-01',
        },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await patientsService.updatePatient(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID(1), updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial updates', async () => {
      const updateData = { telefono: '9876543210' };

      const mockResponse = {
        success: true,
        data: { id: 1, telefono: '9876543210' },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      await patientsService.updatePatient(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID(1), updateData);
    });

    it('should handle string ID parameter', async () => {
      const updateData = { telefono: '9876543210' };
      const mockResponse = { success: true, data: {} };

      mockedApi.put.mockResolvedValue(mockResponse);

      await patientsService.updatePatient(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID('1'), updateData);
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Paciente eliminado correctamente' },
      };

      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await patientsService.deletePatient(1);

      expect(mockedApi.delete).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID(1));
      expect(result).toEqual(mockResponse);
    });

    it('should handle string ID parameter', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Paciente eliminado correctamente' },
      };

      mockedApi.delete.mockResolvedValue(mockResponse);

      await patientsService.deletePatient(1);

      expect(mockedApi.delete).toHaveBeenCalledWith(API_ROUTES.PATIENTS.BY_ID('1'));
    });
  });

  describe('searchPatients', () => {
    it('should search patients with query', async () => {
      const mockResponse = {
        success: true,
        data: {
          patients: [
            { id: 1, nombre: 'Juan', apellidoPaterno: 'Pérez' },
            { id: 2, nombre: 'Juana', apellidoPaterno: 'García' },
          ],
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.searchPatients('Juan');

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.SEARCH}?q=Juan&limit=10`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should search patients with query and limit', async () => {
      const mockResponse = {
        success: true,
        data: { patients: [] },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.searchPatients('Juan', 5);

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.SEARCH}?q=Juan&limit=5`
      );
    });

    it('should handle empty query', async () => {
      const mockResponse = {
        success: true,
        data: { patients: [] },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.searchPatients('');

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.SEARCH}?q=&limit=10`
      );
    });
  });

  describe('getPatientStats', () => {
    it('should fetch patient statistics', async () => {
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

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.STATS);

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
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Patient not found',
          },
        },
      };

      mockedApi.get.mockRejectedValue(mockError);

      await expect(patientsService.getPatientById(999)).rejects.toEqual(mockError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApi.get.mockRejectedValue(networkError);

      await expect(patientsService.getPatients()).rejects.toEqual(networkError);
    });

    it('should handle validation errors on create', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Validation failed',
            errors: {
              email: 'Invalid email format',
              telefono: 'Phone number is required',
            },
          },
        },
      };

      mockedApi.post.mockRejectedValue(validationError);

      const invalidPatientData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '', // Invalid
        email: 'invalid-email', // Invalid
      };

      await expect(patientsService.createPatient(invalidPatientData)).rejects.toEqual(validationError);
    });

    it('should handle unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Unauthorized',
          },
        },
      };

      mockedApi.get.mockRejectedValue(unauthorizedError);

      await expect(patientsService.getPatients()).rejects.toEqual(unauthorizedError);
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Internal server error',
          },
        },
      };

      mockedApi.post.mockRejectedValue(serverError);

      const patientData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        genero: 'M' as const,
        telefono: '1234567890',
      };

      await expect(patientsService.createPatient(patientData)).rejects.toEqual(serverError);
    });
  });

  describe('URL Building', () => {
    it('should correctly build URLs with special characters', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ search: 'José María' });

      // URLSearchParams encodes spaces as '+' (both '+' and '%20' are valid)
      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?search=Jos%C3%A9+Mar%C3%ADa`
      );
    });

    it('should handle boolean parameters correctly', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ activo: false });

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?activo=false`
      );
    });

    it('should handle numeric parameters correctly', async () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } };
      mockedApi.get.mockResolvedValue(mockResponse);

      await patientsService.getPatients({ offset: 0, limit: 0 });

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?offset=0&limit=0`
      );
    });
  });

  describe('Response Processing', () => {
    it('should return response as-is when successful', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, nombre: 'Juan' },
        message: 'Patient retrieved successfully',
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatientById(1);

      expect(result).toEqual(mockResponse);
    });

    it('should return error response as-is when unsuccessful', async () => {
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
});