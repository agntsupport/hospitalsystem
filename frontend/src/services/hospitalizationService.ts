import { api } from '@/utils/api';
import {
  HospitalAdmission,
  HospitalDischarge,
  MedicalNote,
  HospitalizationStats,
  HospitalizationReport,
  HospitalizationFilters,
  HospitalizationResponse,
  HospitalizationListResponse,
  HospitalAdmissionForm,
  HospitalDischargeForm
} from '@/types/hospitalization.types';

class HospitalizationService {
  
  // ====================== INGRESOS HOSPITALARIOS ======================
  
  /**
   * Obtiene lista de pacientes hospitalizados
   */
  async getAdmissions(filters: HospitalizationFilters = {}): Promise<HospitalizationListResponse<HospitalAdmission>> {
    try {
      const params = new URLSearchParams();
      
      // Filtros de estado
      if (filters.estado && filters.estado.length > 0) {
        filters.estado.forEach(estado => params.append('estado', estado));
      }
      
      // Filtros de fecha
      if (filters.fechaIngresoDesde) params.append('fechaIngresoDesde', filters.fechaIngresoDesde);
      if (filters.fechaIngresoHasta) params.append('fechaIngresoHasta', filters.fechaIngresoHasta);
      
      // Filtros médicos
      if (filters.especialidades && filters.especialidades.length > 0) {
        params.append('especialidad', filters.especialidades[0]);
      }
      if (filters.medicoTratanteId && filters.medicoTratanteId.length > 0) {
        params.append('medicoTratante', filters.medicoTratanteId[0].toString());
      }
      
      // Búsqueda
      if (filters.busqueda) params.append('busqueda', filters.busqueda);
      
      // Paginación
      if (filters.pagina) params.append('pagina', filters.pagina.toString());
      if (filters.limite) params.append('limite', filters.limite.toString());
      
      const response = await api.get(`/hospitalization/admissions?${params.toString()}`);
      
      return {
        success: true,
        message: 'Lista de hospitalizaciones obtenida correctamente',
        data: response.data,
        generadoEn: new Date().toISOString(),
        parametros: filters
      };
    } catch (error: any) {
      console.error('Error al obtener lista de hospitalizaciones:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener lista de hospitalizaciones',
        error: error.error
      };
    }
  }
  
  /**
   * Obtiene detalle de un ingreso hospitalario
   */
  async getAdmissionDetail(id: number): Promise<HospitalizationResponse<HospitalAdmission & { notasMedicas: MedicalNote[], alta?: HospitalDischarge }>> {
    try {
      const response = await api.get(`/hospitalization/admissions/${id}`);
      
      return {
        success: true,
        message: 'Detalle del ingreso obtenido correctamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al obtener detalle del ingreso:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener detalle del ingreso',
        error: error.error
      };
    }
  }
  
  /**
   * Crea un nuevo ingreso hospitalario
   */
  async createAdmission(admissionData: HospitalAdmissionForm): Promise<HospitalizationResponse<HospitalAdmission>> {
    try {
      // Validaciones del lado cliente
      const validation = this.validateAdmissionForm(admissionData);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }
      
      const response = await api.post('/hospitalization/admissions', admissionData);
      
      return {
        success: true,
        message: 'Ingreso hospitalario creado exitosamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al crear ingreso hospitalario:', error);
      return {
        success: false,
        message: error.message || 'Error al crear ingreso hospitalario',
        error: error.error
      };
    }
  }
  
  /**
   * Actualiza un ingreso hospitalario
   */
  async updateAdmission(id: number, updateData: Partial<HospitalAdmissionForm>): Promise<HospitalizationResponse<HospitalAdmission>> {
    try {
      const response = await api.put(`/hospitalization/admissions/${id}`, updateData);
      
      return {
        success: true,
        message: 'Ingreso hospitalario actualizado exitosamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al actualizar ingreso hospitalario:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar ingreso hospitalario',
        error: error.error
      };
    }
  }
  
  // ====================== NOTAS MÉDICAS ======================
  
  /**
   * Obtiene notas médicas de un ingreso
   */
  async getMedicalNotes(admissionId: number): Promise<HospitalizationResponse<MedicalNote[]>> {
    try {
      const response = await api.get(`/hospitalization/admissions/${admissionId}/notes`);
      
      return {
        success: true,
        message: 'Notas médicas obtenidas correctamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al obtener notas médicas:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener notas médicas',
        error: error.error
      };
    }
  }
  
  /**
   * Crea una nueva nota médica
   */
  async createMedicalNote(admissionId: number, noteData: {
    tipo: 'evolucion' | 'interconsulta' | 'procedimiento' | 'enfermeria' | 'alta';
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
    especialidad?: string;
    diagnosticos?: string[];
    seguimiento?: string;
    proximaRevision?: string;
  }): Promise<HospitalizationResponse<MedicalNote>> {
    try {
      // Mapear campos del frontend al backend
      const mappedData = {
        tipoNota: this.mapTipoNota(noteData.tipo),
        turno: this.getCurrentTurn(),
        estadoGeneral: noteData.subjetivo,
        sintomas: noteData.analisis, // Análisis va en síntomas
        examenFisico: noteData.objetivo,
        planTratamiento: noteData.plan,
        observaciones: [
          noteData.seguimiento,
          noteData.proximaRevision,
          noteData.especialidad ? `Especialidad: ${noteData.especialidad}` : '',
          noteData.diagnosticos?.length ? `Diagnósticos: ${noteData.diagnosticos.join(', ')}` : ''
        ].filter(Boolean).join('\n\n')
      };

      console.log('Sending mapped data to backend:', mappedData);
      const response = await api.post(`/hospitalization/admissions/${admissionId}/notes`, mappedData);
      
      return {
        success: true,
        message: 'Nota médica creada exitosamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al crear nota médica:', error);
      return {
        success: false,
        message: error.message || 'Error al crear nota médica',
        error: error.error
      };
    }
  }
  
  // ====================== ALTAS HOSPITALARIAS ======================
  
  /**
   * Crea un alta hospitalaria
   */
  async createDischarge(admissionId: number, dischargeData: HospitalDischargeForm): Promise<HospitalizationResponse<HospitalDischarge>> {
    try {
      // Validaciones del lado cliente
      const validation = this.validateDischargeForm(dischargeData);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }
      
      const response = await api.post(`/hospitalization/admissions/${admissionId}/discharge`, dischargeData);
      
      return {
        success: true,
        message: 'Alta hospitalaria procesada exitosamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al procesar alta hospitalaria:', error);
      return {
        success: false,
        message: error.message || 'Error al procesar alta hospitalaria',
        error: error.error
      };
    }
  }
  
  /**
   * Obtiene detalle de un alta hospitalaria
   */
  async getDischargeDetail(dischargeId: number): Promise<HospitalizationResponse<HospitalDischarge>> {
    try {
      const response = await api.get(`/hospitalization/discharges/${dischargeId}`);
      
      return {
        success: true,
        message: 'Detalle del alta obtenido correctamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al obtener detalle del alta:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener detalle del alta',
        error: error.error
      };
    }
  }
  
  // ====================== ESTADÍSTICAS Y REPORTES ======================
  
  /**
   * Obtiene estadísticas de hospitalización
   */
  async getStats(): Promise<HospitalizationResponse<HospitalizationStats>> {
    try {
      const response = await api.get('/hospitalization/stats');
      
      return {
        success: true,
        message: 'Estadísticas de hospitalización obtenidas correctamente',
        data: response.data,
        generadoEn: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener estadísticas de hospitalización',
        error: error.error
      };
    }
  }
  
  /**
   * Obtiene reporte de hospitalización
   */
  async getReport(filters: { fechaInicio?: string; fechaFin?: string } = {}): Promise<HospitalizationResponse<HospitalizationReport>> {
    try {
      const params = new URLSearchParams();
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      
      const response = await api.get(`/hospitalization/reports?${params.toString()}`);
      
      return {
        success: true,
        message: 'Reporte de hospitalización generado correctamente',
        data: response.data,
        generadoEn: new Date().toISOString(),
        parametros: filters
      };
    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      return {
        success: false,
        message: error.message || 'Error al generar reporte de hospitalización',
        error: error.error
      };
    }
  }
  
  // ====================== UTILIDADES ======================
  
  /**
   * Valida los datos del formulario de ingreso
   */
  validateAdmissionForm(data: HospitalAdmissionForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.pacienteId) {
      errors.push('El paciente es requerido');
    }
    
    if (!data.habitacionId) {
      errors.push('La habitación es requerida');
    }
    
    if (!data.motivoIngreso || data.motivoIngreso.trim().length < 10) {
      errors.push('El motivo de ingreso debe tener al menos 10 caracteres');
    }
    
    if (!data.diagnosticoIngreso || data.diagnosticoIngreso.trim().length < 5) {
      errors.push('El diagnóstico de ingreso debe tener al menos 5 caracteres');
    }
    
    if (!data.medicoTratanteId) {
      errors.push('El médico tratante es requerido');
    }
    
    if (!data.tipoHospitalizacion) {
      errors.push('El tipo de hospitalización es requerido');
    }
    
    if (!data.especialidad) {
      errors.push('La especialidad es requerida');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valida los datos del formulario de alta
   */
  validateDischargeForm(data: HospitalDischargeForm): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.tipoAlta) {
      errors.push('El tipo de alta es requerido');
    }
    
    if (!data.estadoAlta) {
      errors.push('El estado al alta es requerido');
    }
    
    if (!data.diagnosticoEgreso || data.diagnosticoEgreso.trim().length < 5) {
      errors.push('El diagnóstico de egreso debe tener al menos 5 caracteres');
    }
    
    if (!data.resumenEstancia || data.resumenEstancia.trim().length < 20) {
      errors.push('El resumen de estancia debe tener al menos 20 caracteres');
    }
    
    if (!data.recomendacionesGenerales || data.recomendacionesGenerales.trim().length < 10) {
      errors.push('Las recomendaciones generales son requeridas');
    }
    
    if (!data.cuidadosDomiciliarios || data.cuidadosDomiciliarios.length === 0) {
      errors.push('Los cuidados domiciliarios son requeridos');
    }
    
    if (!data.signosAlarma || data.signosAlarma.length === 0) {
      errors.push('Los signos de alarma son requeridos');
    }
    
    // Validar medicamentos al alta
    if (data.medicamentosAlta && data.medicamentosAlta.length > 0) {
      data.medicamentosAlta.forEach((med, index) => {
        if (!med.nombre || !med.dosis || !med.frecuencia || !med.duracion) {
          errors.push(`El medicamento ${index + 1} tiene campos faltantes`);
        }
      });
    }
    
    // Validar cita de control si se especifica
    if (data.citaControl) {
      if (!data.citaControl.especialidad || !data.citaControl.fechaSugerida || !data.citaControl.urgencia) {
        errors.push('Los datos de la cita de control están incompletos');
      }
    }
    
    // Validar incapacidad si se especifica
    if (data.incapacidad) {
      if (!data.incapacidad.dias || !data.incapacidad.motivo || !data.incapacidad.fechaInicio || !data.incapacidad.fechaFin) {
        errors.push('Los datos de incapacidad están incompletos');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Formatea el estado de una hospitalización para mostrar
   */
  formatAdmissionStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      activa: 'Activa',
      alta: 'Alta Médica',
      traslado: 'Traslado',
      defuncion: 'Defunción',
      fuga: 'Fuga'
    };
    
    return statusLabels[status] || status;
  }
  
  /**
   * Formatea el tipo de hospitalización para mostrar
   */
  formatAdmissionType(type: string): string {
    const typeLabels: Record<string, string> = {
      programada: 'Programada',
      urgencia: 'Urgencia',
      emergencia: 'Emergencia'
    };
    
    return typeLabels[type] || type;
  }
  
  /**
   * Formatea el estado general del paciente
   */
  formatGeneralStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      estable: 'Estable',
      critico: 'Crítico',
      grave: 'Grave',
      regular: 'Regular'
    };
    
    return statusLabels[status] || status;
  }
  
  /**
   * Obtiene el color para el estado de hospitalización
   */
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      activa: 'primary',
      alta: 'success',
      traslado: 'info',
      defuncion: 'error',
      fuga: 'warning'
    };
    
    return colorMap[status] || 'default';
  }
  
  /**
   * Obtiene el color para el estado general
   */
  getGeneralStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      estable: 'success',
      critico: 'error',
      grave: 'warning',
      regular: 'info'
    };
    
    return colorMap[status] || 'default';
  }
  
  /**
   * Calcula los días de estancia
   */
  calculateStayDays(fechaIngreso: string, fechaAlta?: string): number {
    const inicio = new Date(fechaIngreso);
    const fin = fechaAlta ? new Date(fechaAlta) : new Date();
    
    return Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Formatea fecha y hora de ingreso/alta
   */
  formatDateTime(fecha: string, hora: string): string {
    try {
      const fechaObj = new Date(`${fecha}T${hora}`);
      return fechaObj.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return `${fecha} ${hora}`;
    }
  }
  
  /**
   * Formatea solo fecha
   */
  formatDate(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
  
  /**
   * Formatea un rango de fechas
   */
  formatDateRange(fechaInicio: string, fechaFin: string): string {
    return `${this.formatDate(fechaInicio)} - ${this.formatDate(fechaFin)}`;
  }

  /**
   * Mapea tipo de nota del frontend al backend
   */
  private mapTipoNota(tipo: string): string {
    const tipoMap: Record<string, string> = {
      'evolucion': 'evolucion_medica',
      'interconsulta': 'interconsulta', 
      'procedimiento': 'procedimiento',
      'enfermeria': 'nota_enfermeria',
      'alta': 'evolucion_medica' // No hay enum para alta, usar evolución médica
    };
    
    return tipoMap[tipo] || 'evolucion_medica';
  }

  /**
   * Obtiene el turno actual basado en la hora
   */
  private getCurrentTurn(): string {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 7 && hour < 15) {
      return 'matutino';
    } else if (hour >= 15 && hour < 23) {
      return 'vespertino';
    } else {
      return 'nocturno';
    }
  }
}

// Exportar instancia singleton
const hospitalizationService = new HospitalizationService();
export default hospitalizationService;