import { patientsService } from '../patientsService';
import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';

// Mock the api utility
jest.mock('@/utils/api');
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
        `${API_ROUTES.PATIENTS.SEARCH}?q=Juan`
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
        `${API_ROUTES.PATIENTS.SEARCH}?q=`
      );
    });
  });

  describe('getPatientStats', () => {
    it('should fetch patient statistics', async () => {
      const mockStats = {
        totalPacientes: 150,
        pacientesActivos: 140,
        pacientesInactivos: 10,
        nuevosEsteMes: 25,
        edadPromedio: 35.5,
        distribucionGenero: { M: 75, F: 65, Otro: 10 },
        distribucionEdad: {
          '0-18': 20,
          '19-35': 45,
          '36-50': 50,
          '51-65': 25,
          '65+': 10,
        },
      };

      const mockResponse = {
        success: true,
        data: mockStats,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await patientsService.getPatientStats();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.PATIENTS.STATS);
      expect(result).toEqual(mockResponse);
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

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.PATIENTS.BASE}?search=Jos%C3%A9%20Mar%C3%ADa`
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