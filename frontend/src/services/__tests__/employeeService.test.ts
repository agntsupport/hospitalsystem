// ABOUTME: Tests comprehensivos para employeeService
// ABOUTME: Cubre todos los métodos del servicio de empleados incluyendo búsquedas y transformaciones

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { employeeService } from '../employeeService';
import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';

const mockedApi = api as jest.Mocked<typeof api>;

describe('employeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should fetch and transform employee stats', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalEmpleados: 50,
          empleadosActivos: 45,
          empleadosInactivos: 5,
          distribucionPorTipo: {
            'medico_especialista': 15,
            'enfermero': 20,
            'almacenista': 10
          }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getStats();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.STATS);
      expect(result.success).toBe(true);
      expect(result.data?.empleadosPorTipo).toEqual(mockResponse.data.distribucionPorTipo);
    });

    it('should return response as is if no data', async () => {
      const mockResponse = {
        success: false,
        message: 'Error'
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getStats();

      expect(result.success).toBe(false);
    });
  });

  describe('getEmployees', () => {
    it('should fetch employees without params', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, nombre: 'John', tipoEmpleado: 'medico_especialista' }],
          pagination: { total: 1, page: 1, totalPages: 1 }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getEmployees();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BASE);
      expect(result.data).toEqual(mockResponse.data.items);
    });

    it('should fetch employees with all params', async () => {
      const params = {
        page: 2,
        limit: 10,
        search: 'Juan',
        tipoEmpleado: 'enfermero'
      };

      const mockResponse = {
        success: true,
        data: { items: [], pagination: {} }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await employeeService.getEmployees(params);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('search=Juan')
      );
    });

    it('should handle empty response data', async () => {
      const mockResponse = {
        success: true,
        data: null
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getEmployees();

      expect(result.data).toBeNull();
    });
  });

  describe('searchEmployees', () => {
    it('should search employees with query', async () => {
      const mockResponse = {
        success: true,
        data: { employees: [{ id: 1, nombre: 'Juan' }] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.searchEmployees('Juan');

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.EMPLOYEES.SEARCH}?q=Juan`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should search with limit', async () => {
      mockedApi.get.mockResolvedValue({ success: true, data: { employees: [] } });

      await employeeService.searchEmployees('Test', 5);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should fetch employee by ID', async () => {
      const mockEmployee = {
        id: 1,
        nombre: 'John',
        apellidoPaterno: 'Doe',
        tipoEmpleado: 'medico_especialista'
      };

      const mockResponse = {
        success: true,
        data: mockEmployee
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getEmployeeById(1);

      expect(mockedApi.get).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BY_ID(1));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createEmployee', () => {
    it('should create new employee', async () => {
      const employeeData = {
        nombre: 'Jane',
        apellidoPaterno: 'Smith',
        tipoEmpleado: 'enfermero',
        email: 'jane@hospital.com'
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...employeeData }
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await employeeService.createEmployee(employeeData as any);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BASE, employeeData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateEmployee', () => {
    it('should update employee', async () => {
      const updateData = {
        telefono: '555-1234',
        email: 'updated@hospital.com'
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...updateData }
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await employeeService.updateEmployee(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BY_ID(1), updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('toggleEmployeeStatus', () => {
    it('should activate employee', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, activo: true }
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await employeeService.toggleEmployeeStatus(1, true);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BY_ID(1), { activo: true });
      expect(result).toEqual(mockResponse);
    });

    it('should deactivate employee', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, activo: false }
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await employeeService.toggleEmployeeStatus(1, false);

      expect(mockedApi.put).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BY_ID(1), { activo: false });
    });
  });

  describe('deleteEmployee', () => {
    it('should delete employee', async () => {
      const mockResponse = {
        success: true,
        message: 'Empleado eliminado'
      };

      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await employeeService.deleteEmployee(1);

      expect(mockedApi.delete).toHaveBeenCalledWith(API_ROUTES.EMPLOYEES.BY_ID(1));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDoctors', () => {
    it('should fetch doctors without params', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, tipoEmpleado: 'medico_especialista' }]
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getDoctors();

      expect(mockedApi.get).toHaveBeenCalledWith(`${API_ROUTES.EMPLOYEES.BASE}/doctors`);
      expect(result.data).toEqual(mockResponse.data.items);
    });

    it('should fetch doctors with specialty filter', async () => {
      const mockResponse = {
        success: true,
        data: { items: [] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await employeeService.getDoctors({ especialidad: 'Cardiologia' });

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('especialidad=Cardiologia')
      );
    });

    it('should handle array as data', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, tipoEmpleado: 'medico_especialista' }]
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getDoctors();

      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe('getNurses', () => {
    it('should fetch nurses', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, tipoEmpleado: 'enfermero' }]
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getNurses();

      expect(mockedApi.get).toHaveBeenCalledWith(`${API_ROUTES.EMPLOYEES.BASE}/nurses`);
      expect(result.data).toEqual(mockResponse.data.items);
    });

    it('should fetch nurses with pagination', async () => {
      const mockResponse = {
        success: true,
        data: { items: [] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await employeeService.getNurses({ page: 2, limit: 5 });

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  describe('getSchedule', () => {
    it('should fetch employee schedule', async () => {
      const mockResponse = {
        success: true,
        data: { schedule: [] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await employeeService.getSchedule(1);

      expect(mockedApi.get).toHaveBeenCalledWith(
        `${API_ROUTES.EMPLOYEES.BASE}/schedule/1`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch schedule with date range', async () => {
      const mockResponse = {
        success: true,
        data: { schedule: [] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const params = {
        fechaInicio: '2025-01-01',
        fechaFin: '2025-01-31'
      };

      await employeeService.getSchedule(1, params);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('fechaInicio=2025-01-01')
      );
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('fechaFin=2025-01-31')
      );
    });
  });

  describe('activateEmployee', () => {
    it('should reactivate employee', async () => {
      const mockResponse = {
        success: true,
        message: 'Empleado activado',
        data: { id: 1, activo: true }
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await employeeService.activateEmployee(1);

      expect(mockedApi.put).toHaveBeenCalledWith(
        `${API_ROUTES.EMPLOYEES.BY_ID(1)}/activate`,
        {}
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
