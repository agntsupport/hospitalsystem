export interface Employee {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoEmpleado: EmployeeType;
  cedulaProfesional: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  salario?: number;
  fechaIngreso: string;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type EmployeeType = 'enfermero' | 'medico_residente' | 'medico_especialista';

export interface EmployeeFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoEmpleado: EmployeeType;
  cedulaProfesional: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  salario?: number;
  fechaIngreso: string;
  activo?: boolean;
}

export interface EmployeeStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  empleadosPorTipo: {
    enfermero?: number;
    medico_residente?: number;
    medico_especialista?: number;
  };
  empleadosPorEspecialidad: {
    [key: string]: number;
  };
}

export interface EmployeeFilters {
  search?: string;
  tipoEmpleado?: EmployeeType | '';
  activo?: boolean;
}

export interface EmployeePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: EmployeePagination;
}