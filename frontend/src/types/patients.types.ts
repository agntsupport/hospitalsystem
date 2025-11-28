export interface Patient {
  id: number;
  numeroExpediente: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  apellidos?: string; // Computed field: apellidoPaterno + apellidoMaterno
  fechaNacimiento: string;
  edad: number;
  genero: 'M' | 'F' | 'Otro';
  tipoSangre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
  religion?: string;
  alergias?: string;
  medicamentosActuales?: string;
  antecedentesPatologicos?: string;
  antecedentesFamiliares?: string;
  contactoEmergencia?: {
    nombre: string;
    relacion: string;
    telefono: string;
  };
  seguroMedico?: {
    aseguradora?: string;
    numeroPoliza?: string;
    vigencia?: string;
  };
  responsable?: PatientResponsible;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  ultimaVisita?: string;
}

export interface PatientResponsible {
  id: number;
  pacienteId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  relacion: string; // padre, madre, tutor, conyugue, hijo, etc.
  telefono: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  createdAt: string;
}

export interface PatientStats {
  totalPacientes: number;
  pacientesMenores: number;
  pacientesAdultos: number;
  pacientesConCuentaAbierta: number;
  pacientesHospitalizados: number;
  pacientesAmbulatorios: number;
  patientsByGender: {
    M: number;
    F: number;
    Otro: number;
  };
  patientsByAgeGroup: {
    '0-17': number;
    '18-35': number;
    '36-55': number;
    '56+': number;
  };
  growth: {
    total: number;
    weekly: number;
    monthly: number;
  };
}

export interface PatientFilters {
  search?: string;
  genero?: string;
  edadMin?: number;
  edadMax?: number;
  fechaNacimientoDesde?: string;
  fechaNacimientoHasta?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: Patient['estadoCivil'];
  activo?: boolean;
  tipoSangre?: string;
  alergias?: string;
  medicamentosActuales?: string;
  antecedentesPatologicos?: string;
  antecedentesFamiliares?: string;
  // Filtros especiales (booleanos)
  soloMenores?: boolean;
  conContactoEmergencia?: boolean;
  conSeguroMedico?: boolean;
  conAlergias?: boolean;
  // Paginación y ordenamiento
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePatientRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento: string;
  genero: 'M' | 'F' | 'Otro';
  tipoSangre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: Patient['estadoCivil'];
  religion?: string;
  alergias?: string;
  medicamentosActuales?: string;
  antecedentesPatologicos?: string;
  antecedentesFamiliares?: string;
  contactoEmergencia?: Patient['contactoEmergencia'];
  seguroMedico?: Patient['seguroMedico'];
  responsable?: Omit<PatientResponsible, 'id' | 'pacienteId' | 'createdAt'>;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  activo?: boolean;
}

export interface CreateResponsibleRequest {
  pacienteId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  relacion: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

export interface UpdateResponsibleRequest extends Partial<Omit<CreateResponsibleRequest, 'pacienteId'>> {
  activo?: boolean;
}

// API Response types
export interface PatientsResponse {
  success: boolean;
  message: string;
  data: {
    items: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SinglePatientResponse {
  success: boolean;
  message: string;
  data: Patient;
}

export interface PatientStatsResponse {
  success: boolean;
  message: string;
  data: PatientStats;
}

export interface ResponsiblesResponse {
  success: boolean;
  message: string;
  data: {
    responsibles: PatientResponsible[];
    total: number;
  };
}

export interface SingleResponsibleResponse {
  success: boolean;
  message: string;
  data: PatientResponsible;
}

// Constants
export const GENDER_OPTIONS = {
  M: 'Masculino',
  F: 'Femenino',
  Otro: 'Otro'
} as const;

export const CIVIL_STATUS_OPTIONS = {
  soltero: 'Soltero(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viudo: 'Viudo(a)',
  union_libre: 'Unión Libre'
} as const;

export const BLOOD_TYPES = [
  'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'
] as const;

export const RELATIONSHIP_OPTIONS = [
  'padre', 'madre', 'tutor', 'conyugue', 'hijo', 'hija', 
  'hermano', 'hermana', 'abuelo', 'abuela', 'tio', 'tia', 
  'primo', 'prima', 'otro'
] as const;

export const RELATIONSHIP_LABELS = {
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor Legal',
  conyugue: 'Cónyuge',
  hijo: 'Hijo',
  hija: 'Hija',
  hermano: 'Hermano',
  hermana: 'Hermana',
  abuelo: 'Abuelo',
  abuela: 'Abuela',
  tio: 'Tío',
  tia: 'Tía',
  primo: 'Primo',
  prima: 'Prima',
  otro: 'Otro'
} as const;