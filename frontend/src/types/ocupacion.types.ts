// ABOUTME: Tipos TypeScript para tabla de ocupación en tiempo real del hospital

export interface PacienteOcupacion {
  id: number;
  nombre: string;
  expediente: string;
  fechaIngreso: string;
  diasHospitalizado?: number;
  estadoHospitalizacion?: string;
}

export interface MedicoOcupacion {
  id: number;
  nombre: string;
  especialidad: string;
}

export interface ConsultorioOcupacion {
  tipo: 'consultorio';
  numero: string;
  tipoConsultorio: string;
  especialidad: string | null;
  estado: string;
  ocupado: boolean;
  disponible: boolean;
  pacienteActual: PacienteOcupacion | null;
  medicoAsignado: MedicoOcupacion | null;
}

export interface HabitacionOcupacion {
  tipo: 'habitacion';
  numero: string;
  tipoHabitacion: string;
  precioDiario: number;
  estado: string;
  ocupado: boolean;
  disponible: boolean;
  mantenimiento: boolean;
  pacienteActual: PacienteOcupacion | null;
  medicoAsignado: MedicoOcupacion | null;
}

export interface CirugiaActual {
  id: number;
  tipo: string;
  paciente: {
    id: number;
    nombre: string;
    expediente: string;
  };
  medicoCircujano: MedicoOcupacion;
  horaInicio: string;
  tiempoTranscurrido: number | null; // minutos
}

export interface ProximaCirugia {
  id: number;
  tipo: string;
  paciente: string;
  horaProgramada: string;
}

export interface QuirofanoOcupacion {
  tipo: 'quirofano';
  numero: string;
  tipoQuirofano: string;
  especialidad: string | null;
  precioHora: number | null;
  estado: string;
  ocupado: boolean;
  disponible: boolean;
  mantenimiento: boolean;
  programado: boolean;
  cirugiaActual: CirugiaActual | null;
  proximaCirugia: ProximaCirugia | null;
  cirugiasHoy: number;
}

export interface ResumenOcupacion {
  capacidadTotal: number;
  ocupadosTotal: number;
  disponiblesTotal: number;
  porcentajeOcupacion: number;
}

export interface OcupacionResponse {
  timestamp: string;
  consultorios: {
    total: number;
    ocupados: number;
    disponibles: number;
    detalle: ConsultorioOcupacion[];
  };
  habitaciones: {
    total: number;
    ocupadas: number;
    disponibles: number;
    mantenimiento: number;
    detalle: HabitacionOcupacion[];
  };
  quirofanos: {
    total: number;
    ocupados: number;
    disponibles: number;
    mantenimiento: number;
    programados: number;
    detalle: QuirofanoOcupacion[];
  };
  resumen: ResumenOcupacion;
}
