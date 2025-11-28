import { ApiResponse } from './api.types';

// ====================== TIPOS BASE ======================

export interface DateRange {
  fechaInicio: string;
  fechaFin: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface ReportPeriod {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
}

// ====================== REPORTES FINANCIEROS ======================

export interface FinancialSummary {
  totalIngresos: number;
  totalEgresos: number;
  utilidadBruta: number;
  margenUtilidad: number;
  crecimientoMensual: number;
  periodo: ReportPeriod;
}

export interface RevenueByPeriod {
  periodo: string;
  ingresos: number;
  facturas: number;
  promedioFactura: number;
  crecimiento?: number;
}

export interface RevenueByService {
  servicio: {
    id: number;
    nombre: string;
    categoria: string;
  };
  ingresos: number;
  cantidad: number;
  porcentajeTotal: number;
  promedioUnitario: number;
}

export interface RevenueByPaymentMethod {
  metodoPago: string;
  monto: number;
  transacciones: number;
  porcentajeTotal: number;
  promedioTransaccion: number;
}

export interface AccountsReceivableReport {
  totalPendiente: number;
  facturasPendientes: number;
  promedioVencimiento: number;
  antiguedadSaldos: {
    corriente: number; // 0-30 días
    vencido30: number; // 31-60 días
    vencido60: number; // 61-90 días
    vencido90: number; // +90 días
  };
  topDeudores: Array<{
    paciente: {
      id: number;
      nombre: string;
      numeroExpediente: string;
    };
    saldoPendiente: number;
    facturasPendientes: number;
    diasVencimiento: number;
  }>;
}

export interface FinancialReports {
  resumenFinanciero: FinancialSummary;
  ingresosPorPeriodo: RevenueByPeriod[];
  ingresosPorServicio: RevenueByService[];
  ingresosPorMetodoPago: RevenueByPaymentMethod[];
  cuentasPorCobrar: AccountsReceivableReport;
}

// ====================== REPORTES OPERATIVOS ======================

export interface RoomOccupancyReport {
  totalHabitaciones: number;
  ocupadas: number;
  disponibles: number;
  mantenimiento: number;
  porcentajeOcupacion: number;
  promedioEstancia: number;
  ingresosPorHabitacion: number;
  ocupacionPorTipo: Array<{
    tipo: string;
    total: number;
    ocupadas: number;
    porcentaje: number;
  }>;
}

export interface EmployeeProductivityReport {
  empleado: {
    id: number;
    nombre: string;
    tipo: string;
    especialidad?: string;
  };
  pacientesAtendidos: number;
  horasTrabajadas: number;
  ingresosGenerados: number;
  eficiencia: number;
  satisfaccionPacientes?: number;
}

export interface InventoryTurnoverReport {
  producto: {
    id: number;
    nombre: string;
    categoria: string;
  };
  stockInicial: number;
  stockFinal: number;
  consumido: number;
  rotacion: number;
  diasInventario: number;
  costoInventario: number;
  valorRotacion: number;
}

export interface PatientFlowReport {
  nuevosIngresos: number;
  altas: number;
  pacientesActivos: number;
  promedioEstancia: number;
  tasaReingreso: number;
  satisfaccionPromedio: number;
  consultasPorTipo: Array<{
    tipo: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

export interface OperationalReports {
  ocupacionHabitaciones: RoomOccupancyReport;
  productividadEmpleados: EmployeeProductivityReport[];
  rotacionInventario: InventoryTurnoverReport[];
  flujoPacientes: PatientFlowReport;
}

// ====================== REPORTES DE MÉDICOS ======================

export interface DoctorRankingItem {
  id: number;
  nombre: string;
  especialidad: string;
  cedulaProfesional: string;
  hospitalizaciones: number;
  ingresos: {
    total: number;
    productos: number;
    servicios: number;
    porHospitalizaciones: number;
    porConsultas: number;
  };
  pacientes: number;
  cuentasAtendidas: number;
}

export interface DoctorRankingsReport {
  medicos: DoctorRankingItem[];
  totales: {
    hospitalizaciones: number;
    ingresos: number;
    productos: number;
    servicios: number;
    pacientes: number;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
    tipo: string;
  };
}

export interface DoctorDetailReport {
  medico: {
    id: number;
    nombre: string;
    especialidad: string;
    cedulaProfesional: string;
    telefono: string;
    email: string;
  };
  resumen: {
    hospitalizaciones: number;
    ingresosTotales: number;
    promedioIngresoPorPaciente: number;
    pacientesUnicos: number;
  };
  desglose: {
    servicios: Array<{
      codigo: string;
      nombre: string;
      cantidad: number;
      ingresos: number;
    }>;
    productos: Array<{
      codigo: string;
      nombre: string;
      cantidad: number;
      ingresos: number;
    }>;
  };
  hospitalizaciones: Array<{
    id: number;
    paciente: string;
    fechaIngreso: string;
    fechaAlta: string | null;
    estado: string;
    ingresos: number;
  }>;
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
}

// ====================== REPORTES DE UTILIDADES Y COSTOS ======================

export interface ProfitSummaryReport {
  ingresos: {
    productos: number;
    servicios: number;
    total: number;
  };
  costos: {
    productos: number;
    servicios: number;
    operativos: number;
    nomina: number;
    total: number;
  };
  utilidad: {
    bruta: number;
    margenBruto: string;
    neta: number;
    margenNeto: string;
  };
  periodo: string;
}

export interface ProfitDetailedReport {
  productos: {
    items: Array<{
      id: number;
      codigo: string;
      nombre: string;
      cantidadVendida: number;
      ingresos: number;
      costos: number;
      utilidad: number;
      margen: string;
    }>;
    totales: {
      ingresos: number;
      costos: number;
      utilidad: number;
      margen: string;
    };
  };
  servicios: {
    items: Array<{
      id: number;
      codigo: string;
      nombre: string;
      cantidadPrestados: number;
      ingresos: number;
      costos: number;
      utilidad: number;
      margen: string;
      usaCostoReal: boolean;
    }>;
    totales: {
      ingresos: number;
      costos: number;
      utilidad: number;
      margen: string;
    };
  };
  costosOperativos: {
    porCategoria: Array<{
      categoria: string;
      total: number;
      cantidad: number;
    }>;
    total: number;
  };
  nomina: {
    total: number;
    empleados: number;
  };
  resumen: ProfitSummaryReport;
  periodo: {
    fechaInicio: string;
    fechaFin: string;
    tipo: string;
  };
}

// ====================== COSTOS OPERATIVOS ======================

export type CategoriaCosto =
  | 'nomina'
  | 'servicios_publicos'
  | 'mantenimiento'
  | 'insumos_generales'
  | 'renta_inmueble'
  | 'seguros'
  | 'depreciacion'
  | 'marketing'
  | 'capacitacion'
  | 'otros';

export interface CostoOperativo {
  id: number;
  categoria: CategoriaCosto;
  concepto: string;
  descripcion?: string;
  monto: number;
  periodo: string;
  recurrente: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostosOperativosListResponse {
  items: CostoOperativo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalesPorCategoria: Record<string, number>;
}

export interface CostSummaryReport {
  porCategoria: Array<{
    categoria: string;
    total: number;
    cantidad: number;
    calculadoDesdeEmpleados?: boolean;
  }>;
  totalGeneral: number;
  nomina: {
    total: number;
    empleados: number;
  };
  proyeccion: {
    mensual: number;
    trimestral: number;
    anual: number;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface ServiceCost {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  precio: number;
  costo: number | null;
  costoReal: number | null;
  costoEstimado: number;
  usaCostoReal: boolean;
  margen: string;
}

export interface ServiceCostsListResponse {
  items: ServiceCost[];
  porcentajeEstimacion: number;
}

export interface ConfiguracionReporte {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  tipoDato: string;
  editablePorAdmin: boolean;
}

export const CATEGORIA_COSTO_LABELS: Record<CategoriaCosto, string> = {
  nomina: 'Nómina',
  servicios_publicos: 'Servicios Públicos',
  mantenimiento: 'Mantenimiento',
  insumos_generales: 'Insumos Generales',
  renta_inmueble: 'Renta de Inmueble',
  seguros: 'Seguros',
  depreciacion: 'Depreciación',
  marketing: 'Marketing',
  capacitacion: 'Capacitación',
  otros: 'Otros'
};

// ====================== REPORTES GERENCIALES / KPIs ======================

export interface KPIMetric {
  nombre: string;
  valor: number;
  unidad: string;
  meta?: number;
  tendencia: 'up' | 'down' | 'stable';
  cambio: number;
  periodo: string;
  categoria: 'financiero' | 'operativo' | 'calidad' | 'eficiencia';
}

export interface ExecutiveSummary {
  periodo: ReportPeriod;
  resumenEjecutivo: {
    ingresosTotales: number;
    utilidadNeta: number;
    pacientesAtendidos: number;
    ocupacionPromedio: number;
    satisfaccionGeneral: number;
  };
  indicadoresClave: KPIMetric[];
  alertas: Array<{
    tipo: 'critica' | 'advertencia' | 'informacion';
    mensaje: string;
    valor?: number;
    area: string;
  }>;
  tendencias: Array<{
    indicador: string;
    datosHistoricos: ChartDataPoint[];
    proyeccion?: ChartDataPoint[];
  }>;
}

export interface BenchmarkingReport {
  indicador: string;
  valorActual: number;
  promedioIndustria?: number;
  mejorPractica?: number;
  posicionamiento: 'superior' | 'promedio' | 'inferior';
  recomendaciones: string[];
}

export interface ManagerialReports {
  resumenEjecutivo: ExecutiveSummary;
  benchmarking: BenchmarkingReport[];
  proyecciones: Array<{
    periodo: string;
    ingresos: number;
    costos: number;
    utilidad: number;
    confianza: number;
  }>;
}

// ====================== FILTROS PARA REPORTES ======================

export interface ReportFilters {
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: 'dia' | 'semana' | 'mes' | 'trimestre' | 'año' | 'personalizado';
  tipoReporte?: 'financiero' | 'operativo' | 'gerencial';
  departamento?: string;
  empleadoId?: number;
  servicioId?: number;
  tipoServicio?: string;
  metodoPago?: string;
  incluirProyecciones?: boolean;
  formato?: 'resumido' | 'detallado';
}

export interface ExportOptions {
  formato: 'pdf' | 'excel' | 'csv';
  incluirGraficos: boolean;
  incluirDetalles: boolean;
  orientacion?: 'portrait' | 'landscape';
  idioma?: 'es' | 'en';
}

// ====================== RESPUESTAS DE LA API ======================

export interface ReportsResponse<T> extends ApiResponse<T> {
  generadoEn?: string;
  parametros?: ReportFilters;
  siguienteActualizacion?: string;
}

export interface ReportsListResponse<T> extends ReportsResponse<{
  items: T[];
  total: number;
  resumen?: any;
  metadatos?: {
    fechaGeneracion: string;
    tiempoGeneracion: number;
    version: string;
  };
}> {}

// ====================== CONFIGURACIÓN DE REPORTES ======================

export interface ReportTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'financiero' | 'operativo' | 'gerencial';
  categoria: string;
  parametrosRequeridos: string[];
  frecuencia: 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual';
  rolesPermitidos: string[];
  formatosDisponibles: string[];
  activo: boolean;
}

export interface ScheduledReport {
  id: number;
  templateId: string;
  nombre: string;
  destinatarios: string[];
  frecuencia: string;
  proximaEjecucion: string;
  ultimaEjecucion?: string;
  activo: boolean;
  parametros: ReportFilters;
  formatoEntrega: 'pdf' | 'excel';
}

// ====================== CONSTANTES ======================

export const REPORT_PERIODS = {
  HOY: 'dia',
  SEMANA: 'semana', 
  MES: 'mes',
  TRIMESTRE: 'trimestre',
  ANIO: 'año',
  PERSONALIZADO: 'personalizado'
} as const;

export const REPORT_TYPES = {
  FINANCIERO: 'financiero',
  OPERATIVO: 'operativo',
  GERENCIAL: 'gerencial'
} as const;

export const CHART_COLORS = [
  '#1976d2', // Azul primario
  '#dc004e', // Rosa secundario
  '#2e7d32', // Verde éxito
  '#ed6c02', // Naranja advertencia
  '#d32f2f', // Rojo error
  '#0288d1', // Azul info
  '#7b1fa2', // Púrpura
  '#689f38', // Verde claro
  '#f57c00', // Naranja oscuro
  '#c2185b'  // Rosa oscuro
] as const;

export const KPI_CATEGORIES = {
  FINANCIERO: 'financiero',
  OPERATIVO: 'operativo',
  CALIDAD: 'calidad',
  EFICIENCIA: 'eficiencia'
} as const;

// ====================== LABELS EN ESPAÑOL ======================

export const REPORT_LABELS = {
  [REPORT_TYPES.FINANCIERO]: 'Reportes Financieros',
  [REPORT_TYPES.OPERATIVO]: 'Reportes Operativos',
  [REPORT_TYPES.GERENCIAL]: 'Reportes Gerenciales'
} as const;

export const PERIOD_LABELS = {
  [REPORT_PERIODS.HOY]: 'Hoy',
  [REPORT_PERIODS.SEMANA]: 'Esta Semana',
  [REPORT_PERIODS.MES]: 'Este Mes',
  [REPORT_PERIODS.TRIMESTRE]: 'Este Trimestre',
  [REPORT_PERIODS.ANIO]: 'Este Año',
  [REPORT_PERIODS.PERSONALIZADO]: 'Período Personalizado'
} as const;

export const KPI_LABELS = {
  [KPI_CATEGORIES.FINANCIERO]: 'Financiero',
  [KPI_CATEGORIES.OPERATIVO]: 'Operativo',
  [KPI_CATEGORIES.CALIDAD]: 'Calidad',
  [KPI_CATEGORIES.EFICIENCIA]: 'Eficiencia'
} as const;