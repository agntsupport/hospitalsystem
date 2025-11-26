import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';
import { Employee, EmployeeFormData, EmployeeStats, EmployeeFilters, EmployeeListResponse } from '@/types/employee.types';
import { ApiResponse } from '@/types/api.types';

export const employeeService = {
  // Obtener estadísticas de empleados
  async getStats(): Promise<ApiResponse<EmployeeStats>> {
    const response = await api.get(API_ROUTES.EMPLOYEES.STATS);
    
    // Transform backend response to match frontend expectations
    if (response.success && response.data) {
      const backendData = response.data;
      const transformedData: EmployeeStats = {
        totalEmpleados: backendData.totalEmpleados,
        empleadosActivos: backendData.empleadosActivos,
        empleadosInactivos: backendData.empleadosInactivos,
        // Map distribucionPorTipo to empleadosPorTipo
        empleadosPorTipo: backendData.distribucionPorTipo || {},
        empleadosPorEspecialidad: {} // Backend doesn't provide this yet
      };
      
      return {
        ...response,
        data: transformedData
      };
    }
    
    return response;
  },

  // Obtener lista de empleados con filtros y paginación
  async getEmployees(params: {
    page?: number;
    limit?: number;
    search?: string;
    tipoEmpleado?: string;
  } = {}): Promise<ApiResponse<Employee[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tipoEmpleado) queryParams.append('tipoEmpleado', params.tipoEmpleado);

    const url = `${API_ROUTES.EMPLOYEES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    // Transform backend response structure
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.items || [],
        pagination: response.data.pagination
      };
    }
    
    return response;
  },

  // Buscar empleados
  async searchEmployees(query: string, limit?: number): Promise<ApiResponse<{ employees: Employee[] }>> {
    const params = new URLSearchParams({ search: query });
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`${API_ROUTES.EMPLOYEES.BASE}?${params.toString()}`);

    // Transform response to match expected structure
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          employees: response.data.items || []
        }
      };
    }

    return response;
  },

  // Obtener empleado por ID
  async getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
    return api.get(API_ROUTES.EMPLOYEES.BY_ID(id));
  },

  // Crear nuevo empleado
  async createEmployee(employeeData: EmployeeFormData): Promise<ApiResponse<Employee>> {
    return api.post(API_ROUTES.EMPLOYEES.BASE, employeeData);
  },

  // Actualizar empleado
  async updateEmployee(id: number, employeeData: Partial<EmployeeFormData>): Promise<ApiResponse<Employee>> {
    return api.put(API_ROUTES.EMPLOYEES.BY_ID(id), employeeData);
  },

  // Activar/Desactivar empleado
  async toggleEmployeeStatus(id: number, activo: boolean): Promise<ApiResponse<Employee>> {
    return api.put(API_ROUTES.EMPLOYEES.BY_ID(id), { activo });
  },

  // Eliminar empleado
  async deleteEmployee(id: number): Promise<ApiResponse<{ message: string }>> {
    return api.delete(API_ROUTES.EMPLOYEES.BY_ID(id));
  },

  // Obtener solo médicos (con filtro opcional por especialidad)
  async getDoctors(params: {
    page?: number;
    limit?: number;
    especialidad?: string;
  } = {}): Promise<ApiResponse<Employee[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.especialidad) queryParams.append('especialidad', params.especialidad);

    const url = `${API_ROUTES.EMPLOYEES.BASE}/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);

    // Transform backend response structure
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.items || response.data || [],
        pagination: response.data.pagination
      };
    }

    return response;
  },

  // Obtener solo enfermeros
  async getNurses(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<Employee[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_ROUTES.EMPLOYEES.BASE}/nurses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);

    // Transform backend response structure
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.items || response.data || [],
        pagination: response.data.pagination
      };
    }

    return response;
  },

  // Obtener horario/citas de un empleado
  async getSchedule(id: number, params: {
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);

    const url = `${API_ROUTES.EMPLOYEES.BASE}/schedule/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },

  // Reactivar empleado desactivado
  async activateEmployee(id: number): Promise<ApiResponse<{ message: string }>> {
    return api.put(`${API_ROUTES.EMPLOYEES.BY_ID(id)}/activate`, {});
  }
};