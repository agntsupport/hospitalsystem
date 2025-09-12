import * as yup from 'yup';

// Schema para formulario de admisión hospitalaria
export const admissionFormSchema = yup.object({
  pacienteId: yup
    .number()
    .required('El paciente es requerido')
    .positive('Debe seleccionar un paciente'),
  
  habitacionId: yup
    .number()
    .required('La habitación es requerida')
    .positive('Debe seleccionar una habitación'),
  
  medicoTratanteId: yup
    .number()
    .required('El médico tratante es requerido')
    .positive('Debe seleccionar un médico'),
  
  tipoIngreso: yup
    .string()
    .required('El tipo de ingreso es requerido')
    .oneOf(['urgencia', 'programado', 'traslado'], 'Tipo de ingreso no válido'),
  
  diagnosticoIngreso: yup
    .string()
    .required('El diagnóstico de ingreso es requerido')
    .min(5, 'Mínimo 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  
  motivoIngreso: yup
    .string()
    .required('El motivo de ingreso es requerido')
    .min(10, 'Mínimo 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
  
  observaciones: yup
    .string()
    .optional()
    .max(2000, 'Máximo 2000 caracteres'),
  
  requiereAislamiento: yup
    .boolean()
    .default(false),
  
  nivelCuidado: yup
    .string()
    .required('El nivel de cuidado es requerido')
    .oneOf(['basico', 'intermedio', 'intensivo'], 'Nivel de cuidado no válido'),
  
  autorizacionSeguro: yup
    .string()
    .optional()
    .max(50, 'Máximo 50 caracteres'),
  
  contactoEmergencia: yup.object({
    nombre: yup
      .string()
      .required('El nombre del contacto es requerido')
      .min(2, 'Mínimo 2 caracteres'),
    
    telefono: yup
      .string()
      .required('El teléfono del contacto es requerido')
      .matches(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono no válido'),
    
    relacion: yup
      .string()
      .required('La relación es requerida')
  })
});

// Schema para notas médicas (SOAP)
export const medicalNoteSchema = yup.object({
  subjetivo: yup
    .string()
    .required('La información subjetiva es requerida')
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  
  objetivo: yup
    .string()
    .required('La información objetiva es requerida')
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  
  analisis: yup
    .string()
    .required('El análisis es requerido')
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  
  plan: yup
    .string()
    .required('El plan es requerido')
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  
  tipoNota: yup
    .string()
    .required('El tipo de nota es requerido')
    .oneOf(['evolucion', 'interconsulta', 'procedimiento', 'alta'], 'Tipo de nota no válido'),
  
  signos_vitales: yup.object({
    temperatura: yup
      .number()
      .optional()
      .min(30, 'Temperatura mínima 30°C')
      .max(45, 'Temperatura máxima 45°C'),
    
    presion_sistolica: yup
      .number()
      .optional()
      .min(50, 'Presión sistólica mínima 50')
      .max(250, 'Presión sistólica máxima 250'),
    
    presion_diastolica: yup
      .number()
      .optional()
      .min(30, 'Presión diastólica mínima 30')
      .max(150, 'Presión diastólica máxima 150'),
    
    frecuencia_cardiaca: yup
      .number()
      .optional()
      .min(30, 'Frecuencia cardíaca mínima 30')
      .max(250, 'Frecuencia cardíaca máxima 250'),
    
    frecuencia_respiratoria: yup
      .number()
      .optional()
      .min(8, 'Frecuencia respiratoria mínima 8')
      .max(60, 'Frecuencia respiratoria máxima 60'),
    
    saturacion_oxigeno: yup
      .number()
      .optional()
      .min(50, 'Saturación mínima 50%')
      .max(100, 'Saturación máxima 100%')
  })
});

// Schema para alta hospitalaria
export const dischargeFormSchema = yup.object({
  tipoAlta: yup
    .string()
    .required('El tipo de alta es requerido')
    .oneOf(['alta_medica', 'alta_voluntaria', 'traslado', 'defuncion'], 'Tipo de alta no válido'),
  
  diagnosticoFinal: yup
    .string()
    .required('El diagnóstico final es requerido')
    .min(5, 'Mínimo 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  
  resumenEstancia: yup
    .string()
    .required('El resumen de estancia es requerido')
    .min(20, 'Mínimo 20 caracteres')
    .max(3000, 'Máximo 3000 caracteres'),
  
  condicionAlta: yup
    .string()
    .required('La condición al alta es requerida')
    .oneOf(['estable', 'delicado', 'grave', 'fallecido'], 'Condición no válida'),
  
  planSeguimiento: yup
    .string()
    .when('tipoAlta', {
      is: (val: string) => val === 'alta_medica' || val === 'alta_voluntaria',
      then: (schema) => schema
        .required('El plan de seguimiento es requerido')
        .min(10, 'Mínimo 10 caracteres'),
      otherwise: (schema) => schema.optional()
    }),
  
  medicamentosAlta: yup
    .string()
    .optional()
    .max(2000, 'Máximo 2000 caracteres'),
  
  recomendaciones: yup
    .string()
    .optional()
    .max(2000, 'Máximo 2000 caracteres'),
  
  citaControl: yup
    .string()
    .when('tipoAlta', {
      is: 'alta_medica',
      then: (schema) => schema
        .required('La fecha de cita de control es requerida')
        .test('fecha-futura', 'La cita debe ser en el futuro', function(value) {
          if (!value) return false;
          return new Date(value) > new Date();
        }),
      otherwise: (schema) => schema.optional()
    }),
  
  requiereCirugia: yup
    .boolean()
    .default(false),
  
  requiereRehabilitacion: yup
    .boolean()
    .default(false)
});

// Tipos inferidos
export type AdmissionFormValues = yup.InferType<typeof admissionFormSchema>;
export type MedicalNoteFormValues = yup.InferType<typeof medicalNoteSchema>;
export type DischargeFormValues = yup.InferType<typeof dischargeFormSchema>;