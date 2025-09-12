export interface Employee {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  nombreCompleto?: string;
  fechaNacimiento?: string;
  genero?: 'M' | 'F' | 'Otro';
  direccion?: string;
  turno?: 'matutino' | 'vespertino' | 'nocturno' | 'mixto';
  tipoEmpleado: EmployeeType;
  cedulaProfesional?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  salario?: number;
  fechaIngreso: string;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type EmployeeType = 'cajero' | 'enfermero' | 'almacenista' | 'administrador' | 'socio' | 'medico_residente' | 'medico_especialista';

export interface EmployeeFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string;
  genero?: 'M' | 'F' | 'Otro';
  direccion?: string;
  turno?: 'matutino' | 'vespertino' | 'nocturno' | 'mixto';
  tipoEmpleado: EmployeeType;
  cedulaProfesional?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  salario?: number;
  fechaIngreso: string;
  activo?: boolean;
  // Campos para crear usuario (solo nuevos empleados)
  username?: string;
  password?: string;
  rol?: string;
}

export interface EmployeeStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  empleadosPorTipo: {
    cajero?: number;
    enfermero?: number;
    almacenista?: number;
    administrador?: number;
    socio?: number;
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