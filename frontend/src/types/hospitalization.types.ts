// ====================== TIPOS BASE ======================

import { ApiResponse } from './api.types';

export interface BaseHospitalizationEntity {
  id: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
}

// ====================== INGRESO HOSPITALARIO ======================

export interface HospitalAdmission extends BaseHospitalizationEntity {
  // Información del paciente
  pacienteId: number;
  paciente: {
    id: number;
    nombre: string;
    numeroExpediente: string;
    edad: number;
    genero: 'masculino' | 'femenino';
    tipoSangre?: string;
    alergias?: string[];
    contactoEmergencia: {
      nombre: string;
      telefono: string;
      relacion: string;
    };
  };

  // Datos del ingreso
  numeroIngreso: string;
  fechaIngreso: string;
  horaIngreso: string;
  
  // Habitación asignada
  habitacionId: number;
  habitacion: {
    id: number;
    numero: string;
    tipo: string;
    piso: number;
    estado: 'ocupada' | 'disponible' | 'mantenimiento' | 'limpieza';
  };

  // Información médica
  motivoIngreso: string;
  diagnosticoIngreso: string;
  diagnosticosPrevios?: string[];
  estadoGeneral: 'estable' | 'critico' | 'grave' | 'regular';
  
  // Personal médico
  medicoTratante: {
    id: number;
    nombre: string;
    especialidad: string;
    cedula: string;
  };
  
  medicoIngreso: {
    id: number;
    nombre: string;
    especialidad: string;
  };

  // Tipo de hospitalización
  tipoHospitalizacion: 'programada' | 'urgencia' | 'emergencia';
  especialidad: string;
  
  // Estado actual
  estado: 'en_observacion' | 'estable' | 'critico' | 'alta_medica' | 'alta_voluntaria';
  
  // Datos administrativos
  aseguradora?: string;
  numeroPoliza?: string;
  autorizacion?: string;
  
  // Fechas importantes
  fechaAlta?: string;
  horaAlta?: string;
  diasEstancia: number;
  
  // Observaciones
  observacionesIngreso?: string;
  restriccionesDieteticas?: string[];
  cuidadosEspeciales?: string[];
}

// ====================== ESTANCIA Y SEGUIMIENTO ======================

export interface HospitalStay extends BaseHospitalizationEntity {
  ingresoId: number;
  fecha: string;
  
  // Signos vitales
  signosVitales: {
    presionArterial: string;
    frecuenciaCardiaca: number;
    frecuenciaRespiratoria: number;
    temperatura: number;
    saturacionOxigeno: number;
    peso?: number;
    talla?: number;
    imc?: number;
    fechaRegistro: string;
    horaRegistro: string;
    registradoPor: {
      id: number;
      nombre: string;
      tipo: 'enfermero' | 'medico_residente' | 'medico_especialista';
    };
  };

  // Evolución médica
  evolucionMedica?: {
    fecha: string;
    hora: string;
    descripcion: string;
    planTratamiento: string;
    observaciones: string;
    medicoId: number;
    medico: {
      nombre: string;
      especialidad: string;
    };
  };

  // Medicamentos administrados
  medicamentos: Array<{
    id: number;
    nombre: string;
    dosis: string;
    viaAdministracion: 'oral' | 'intravenosa' | 'intramuscular' | 'subcutanea' | 'topica';
    frecuencia: string;
    horaAdministracion: string;
    administradoPor: {
      id: number;
      nombre: string;
    };
    observaciones?: string;
  }>;

  // Procedimientos realizados
  procedimientos: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    fecha: string;
    hora: string;
    realizadoPor: {
      id: number;
      nombre: string;
      especialidad: string;
    };
    resultados?: string;
    complicaciones?: string;
  }>;

  // Interconsultas
  interconsultas: Array<{
    id: number;
    especialidad: string;
    motivo: string;
    fechaSolicitud: string;
    fechaAtencion?: string;
    especialistaId?: number;
    especialista?: {
      nombre: string;
      especialidad: string;
    };
    recomendaciones?: string;
    estado: 'pendiente' | 'programada' | 'realizada' | 'cancelada';
  }>;

  // Estudios y laboratorios
  estudios: Array<{
    id: number;
    tipo: 'laboratorio' | 'imagen' | 'patologia' | 'otros';
    nombre: string;
    fechaSolicitud: string;
    fechaRealizacion?: string;
    resultados?: string;
    interpretacion?: string;
    solicitadoPor: {
      id: number;
      nombre: string;
    };
    estado: 'solicitado' | 'programado' | 'realizado' | 'interpretado';
  }>;

  // Dieta y alimentación
  dieta: {
    tipo: 'normal' | 'blanda' | 'liquida' | 'diabetica' | 'hiposodica' | 'hipocalorica' | 'especial';
    descripcion?: string;
    restricciones?: string[];
    observaciones?: string;
  };

  // Balance hídrico
  balanceHidrico?: {
    ingresoOral: number;
    ingresoIntravenoso: number;
    egresoUrinario: number;
    egresoEvacuaciones: number;
    otrosEgresos: number;
    balance: number;
    observaciones?: string;
  };
}

// ====================== NOTAS Y EVOLUCIONES ======================

export interface MedicalNote extends BaseHospitalizationEntity {
  // Backend response structure
  tipo: string; // 'evolucion_medica' | 'nota_enfermeria' | 'interconsulta' | 'procedimiento'
  turno: string; // 'matutino' | 'vespertino' | 'nocturno'
  fechaNota: string; // ISO date string
  
  // Información del empleado
  empleado: {
    id: number;
    nombre: string;
    tipoEmpleado: string;
    especialidad?: string;
  };

  // Signos vitales
  temperatura?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  saturacionOxigeno?: number;

  // Contenido SOAP
  estadoGeneral?: string; // Subjetivo
  sintomas?: string;      // Assessment
  examenFisico?: string;  // Objetivo
  planTratamiento?: string; // Plan
  observaciones?: string;
}

// ====================== ALTA HOSPITALARIA ======================

export interface HospitalDischarge extends BaseHospitalizationEntity {
  ingresoId: number;
  
  // Información del alta
  numeroAlta: string;
  fechaAlta: string;
  horaAlta: string;
  
  // Tipo de alta
  tipoAlta: 'medica' | 'voluntaria' | 'traslado' | 'defuncion' | 'fuga';
  estadoAlta: 'mejorado' | 'curado' | 'igual' | 'empeorado';
  
  // Diagnósticos
  diagnosticoEgreso: string;
  diagnosticosSecundarios: string[];
  procedimientosRealizados: string[];
  
  // Resumen de estancia
  diasHospitalizacion: number;
  resumenEstancia: string;
  complicaciones?: string[];
  
  // Médico que autoriza el alta
  medicoAlta: {
    id: number;
    nombre: string;
    especialidad: string;
    cedula: string;
  };

  // Tratamiento domiciliario
  medicamentosAlta: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    indicaciones: string;
  }>;

  // Recomendaciones
  recomendacionesGenerales: string;
  cuidadosDomiciliarios: string[];
  signosAlarma: string[];
  
  // Seguimiento
  citaControl?: {
    especialidad: string;
    fechaSugerida: string;
    urgencia: 'rutina' | 'urgente' | 'muy_urgente';
    observaciones?: string;
  };

  // Incapacidad
  incapacidad?: {
    dias: number;
    motivo: string;
    fechaInicio: string;
    fechaFin: string;
  };

  // Liberación de habitación
  habitacionLiberada: boolean;
  fechaLiberacionHabitacion?: string;
  
  // Facturación
  facturacionCompleta: boolean;
  observacionesFacturacion?: string;
}

// ====================== PERSONAL ASIGNADO ======================

export interface AssignedMedicalStaff extends BaseHospitalizationEntity {
  ingresoId: number;
  
  // Personal médico
  medicoTratante: {
    id: number;
    nombre: string;
    especialidad: string;
    esResponsable: boolean;
    fechaAsignacion: string;
  };

  medicosEspecialistas: Array<{
    id: number;
    nombre: string;
    especialidad: string;
    rolEspecialista: 'consultor' | 'tratante' | 'interconsultante';
    fechaAsignacion: string;
    activo: boolean;
  }>;

  // Personal de enfermería
  enfermeroPrimario: {
    id: number;
    nombre: string;
    turno: 'matutino' | 'vespertino' | 'nocturno';
    fechaAsignacion: string;
  };

  enfermerosAsignados: Array<{
    id: number;
    nombre: string;
    turno: 'matutino' | 'vespertino' | 'nocturno';
    fechaAsignacion: string;
    responsabilidades: string[];
    activo: boolean;
  }>;

  // Otros profesionales
  otrosProfesionales?: Array<{
    id: number;
    nombre: string;
    profesion: 'fisioterapeuta' | 'nutricionista' | 'psicologo' | 'trabajador_social' | 'otro';
    fechaAsignacion: string;
    activo: boolean;
  }>;
}

// ====================== REPORTES Y ESTADÍSTICAS ======================

export interface HospitalizationStats {
  // Ocupación general
  totalCamas: number;
  camasOcupadas: number;
  camasDisponibles: number;
  porcentajeOcupacion: number;
  
  // Pacientes actuales
  pacientesHospitalizados: number;
  ingresosHoy: number;
  altasHoy: number;
  
  // Estadísticas por especialidad
  ocupacionPorEspecialidad: Array<{
    especialidad: string;
    pacientes: number;
    camasAsignadas: number;
    porcentajeOcupacion: number;
  }>;

  // Indicadores de calidad
  estanciaPromedio: number;
  tasaRotacion: number;
  tiempoPromedioAlta: number;
  
  // Movimientos del día
  movimientosHoy: {
    ingresos: number;
    altas: number;
    traslados: number;
    interconsultas: number;
  };
}

export interface HospitalizationReport {
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
  
  // Resumen general
  totalIngresos: number;
  totalAltas: number;
  pacientesActivos: number;
  
  // Análisis por especialidad
  ingresosPorEspecialidad: Array<{
    especialidad: string;
    cantidad: number;
    porcentaje: number;
    estanciaPromedio: number;
  }>;

  // Análisis por diagnóstico
  diagnosticosFrecuentes: Array<{
    diagnostico: string;
    cantidad: number;
    porcentaje: number;
    estanciaPromedio: number;
  }>;

  // Indicadores de calidad
  indicadores: {
    estanciaPromedio: number;
    tasaReingreso: number;
    tasaInfeccionNosocomial: number;
    satisfaccionPacientes: number;
    tiempoEsperaIngreso: number;
  };

  // Mortalidad y morbilidad
  morbimortalidad: {
    defunciones: number;
    tasaMortalidad: number;
    complicacionesMayores: number;
    readmisiones30Dias: number;
  };
}

// ====================== FILTROS Y BÚSQUEDAS ======================

export interface HospitalizationFilters {
  // Filtros de fecha
  fechaIngresoDesde?: string;
  fechaIngresoHasta?: string;
  fechaAltaDesde?: string;
  fechaAltaHasta?: string;

  // Filtros de estado
  estado?: ('en_observacion' | 'estable' | 'critico' | 'alta_medica' | 'alta_voluntaria')[];
  tipoHospitalizacion?: ('programada' | 'urgencia' | 'emergencia')[];
  
  // Filtros médicos
  especialidades?: string[];
  medicoTratanteId?: number[];
  diagnosticos?: string[];
  
  // Filtros de habitación
  pisos?: number[];
  tiposHabitacion?: string[];
  
  // Filtros administrativos
  aseguradoras?: string[];
  
  // Búsqueda por texto
  busqueda?: string; // Busca en nombre paciente, número expediente, diagnóstico
  
  // Paginación
  pagina?: number;
  limite?: number;
  ordenarPor?: 'fechaIngreso' | 'fechaAlta' | 'diasEstancia' | 'paciente' | 'habitacion';
  orden?: 'asc' | 'desc';
}

// ====================== RESPUESTAS DE LA API ======================

export interface HospitalizationResponse<T> extends ApiResponse<T> {
  generadoEn?: string;
  parametros?: HospitalizationFilters;
}

export interface HospitalizationListResponse<T> extends HospitalizationResponse<{
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  resumen?: any;
}> {}

// ====================== CONSTANTES ======================

export const HOSPITALIZATION_STATUSES = {
  EN_OBSERVACION: 'en_observacion',
  ESTABLE: 'estable',
  CRITICO: 'critico',
  ALTA_MEDICA: 'alta_medica',
  ALTA_VOLUNTARIA: 'alta_voluntaria'
} as const;

export const ADMISSION_TYPES = {
  PROGRAMADA: 'programada',
  URGENCIA: 'urgencia',
  EMERGENCIA: 'emergencia'
} as const;

export const DISCHARGE_TYPES = {
  MEDICA: 'medica',
  VOLUNTARIA: 'voluntaria',
  TRASLADO: 'traslado',
  DEFUNCION: 'defuncion',
  FUGA: 'fuga'
} as const;

export const VITAL_SIGNS_NORMAL_RANGES = {
  presionSistolica: { min: 90, max: 140 },
  presionDiastolica: { min: 60, max: 90 },
  frecuenciaCardiaca: { min: 60, max: 100 },
  frecuenciaRespiratoria: { min: 12, max: 20 },
  temperatura: { min: 36.1, max: 37.2 },
  saturacionOxigeno: { min: 95, max: 100 }
} as const;

export const SPECIALTIES = [
  'Medicina General',
  'Medicina Interna',
  'Cardiología',
  'Neurología',
  'Gastroenterología',
  'Neumología',
  'Endocrinología',
  'Nefrología',
  'Oncología',
  'Geriatría',
  'Cirugía General',
  'Traumatología',
  'Neurocirugía',
  'Cirugía Cardiovascular',
  'Urología',
  'Ginecología',
  'Obstetricia',
  'Pediatría',
  'Psiquiatría',
  'Dermatología',
  'Oftalmología',
  'Otorrinolaringología',
  'Anestesiología',
  'Cuidados Intensivos',
  'Emergencias'
] as const;

// ====================== TIPOS DE UTILIDAD ======================

export type HospitalizationStatus = typeof HOSPITALIZATION_STATUSES[keyof typeof HOSPITALIZATION_STATUSES];
export type AdmissionType = typeof ADMISSION_TYPES[keyof typeof ADMISSION_TYPES];
export type DischargeType = typeof DISCHARGE_TYPES[keyof typeof DISCHARGE_TYPES];
export type Specialty = typeof SPECIALTIES[number];

// Tipo para formularios
export interface HospitalAdmissionForm {
  pacienteId: number;
  // Uno de estos tres campos debe estar presente (validado en el servicio)
  habitacionId?: number;
  consultorioId?: number;
  quirofanoId?: number;
  motivoIngreso: string;
  diagnosticoIngreso: string;
  tipoHospitalizacion: AdmissionType;
  especialidad: string;
  medicoTratanteId: number;
  estadoGeneral: 'estable' | 'critico' | 'grave' | 'regular';
  observacionesIngreso?: string;
  aseguradora?: string;
  numeroPoliza?: string;
  autorizacion?: string;
  restriccionesDieteticas?: string[];
  cuidadosEspeciales?: string[];
}

export interface HospitalDischargeForm {
  tipoAlta: DischargeType;
  estadoAlta: 'mejorado' | 'curado' | 'igual' | 'empeorado';
  diagnosticoEgreso: string;
  diagnosticosSecundarios: string[];
  procedimientosRealizados: string[];
  resumenEstancia: string;
  complicaciones?: string[];
  medicamentosAlta: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    indicaciones: string;
  }>;
  recomendacionesGenerales: string;
  cuidadosDomiciliarios: string[];
  signosAlarma: string[];
  citaControl?: {
    especialidad: string;
    fechaSugerida: string;
    urgencia: 'rutina' | 'urgente' | 'muy_urgente';
    observaciones?: string;
  };
  incapacidad?: {
    dias: number;
    motivo: string;
    fechaInicio: string;
    fechaFin: string;
  };
}