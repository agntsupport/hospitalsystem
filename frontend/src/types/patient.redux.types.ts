export interface Patient {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento: string;
  genero: 'M' | 'F' | 'Otro';
  telefono?: string;
  email?: string;
  direccion?: string;
  curp?: string;
  nss?: string;
  esMenorEdad: boolean;
  responsableId?: number;
  createdAt: string;
  updatedAt: string;
  responsable?: Responsible;
  cuentas?: PatientAccount[];
  historiales?: MedicalHistory[];
  citas?: Appointment[];
}

export interface Responsible {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono: string;
  email?: string;
  parentesco: string;
  identificacion?: string;
  createdAt: string;
}

export interface PatientAccount {
  id: number;
  tipoAtencion: 'consulta_general' | 'urgencia' | 'hospitalizacion';
  estado: 'abierta' | 'cerrada';
  anticipo: number;
  totalServicios: number;
  totalProductos: number;
  totalCuenta: number;
  saldoPendiente: number;
  fechaApertura: string;
  fechaCierre?: string;
  habitacion?: Room;
  medicoTratante?: Employee;
  transacciones?: AccountTransaction[];
}

export interface Room {
  id: number;
  numero: string;
  tipo: 'individual' | 'doble' | 'suite' | 'terapia_intensiva';
  precioPorDia: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  descripcion?: string;
}

export interface Employee {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoEmpleado: 'enfermero' | 'medico_residente' | 'medico_especialista';
  especialidad?: string;
}

export interface AccountTransaction {
  id: number;
  tipo: 'servicio' | 'producto' | 'anticipo' | 'pago' | 'medicamento_hospitalizado';
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaTransaccion: string;
  servicio?: Service;
  producto?: Product;
}

export interface Service {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'consulta_general' | 'consulta_especialidad' | 'urgencia' | 'curacion' | 'hospitalizacion';
  precio: number;
}

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: 'medicamento' | 'material_medico' | 'insumo';
  unidadMedida: string;
  precioVenta: number;
}

export interface MedicalHistory {
  id: number;
  fechaConsulta: string;
  tipoConsulta: 'ambulatoria' | 'urgencia' | 'hospitalizacion';
  motivoConsulta: string;
  sintomas?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentosRecetados?: string;
  observaciones?: string;
  proximaCita?: string;
  medico: Employee;
}

export interface Appointment {
  id: number;
  fechaCita: string;
  tipoCita: 'consulta_general' | 'seguimiento' | 'urgencia' | 'control_post_hospitalizacion';
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';
  motivo?: string;
  observaciones?: string;
  medico: Employee;
  consultorio?: Consultorio;
}

export interface Consultorio {
  id: number;
  numero: string;
  especialidad?: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
  descripcion?: string;
}

export interface CreatePatientData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento: string;
  genero: 'M' | 'F' | 'Otro';
  telefono?: string;
  email?: string;
  direccion?: string;
  curp?: string;
  nss?: string;
  esMenorEdad: boolean;
  responsable?: CreateResponsibleData;
}

export interface CreateResponsibleData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono: string;
  email?: string;
  parentesco: string;
  identificacion?: string;
}

export interface UpdatePatientData {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface PatientsFilters {
  search?: string;
  esMenorEdad?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PatientsResponse {
  success: boolean;
  data: {
    patients: Patient[];
    pagination: PaginationResponse;
  };
}

export interface PatientResponse {
  success: boolean;
  data: {
    patient: Patient;
  };
}

export interface PatientHistoryResponse {
  success: boolean;
  data: {
    patient: Patient;
    historiales: MedicalHistory[];
    pagination: PaginationResponse;
  };
}

export interface PatientsStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalPacientes: number;
      pacientesMenores: number;
      pacientesAdultos: number;
      pacientesConCuentaAbierta: number;
      pacientesHospitalizados: number;
      pacientesAmbulatorios: number;
    };
  };
}