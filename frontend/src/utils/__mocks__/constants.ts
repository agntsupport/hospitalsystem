// Mock de constants.ts para Jest
export const ROLES = {
  CAJERO: 'cajero',
  ENFERMERO: 'enfermero',
  ALMACENISTA: 'almacenista',
  ADMINISTRADOR: 'administrador',
  SOCIO: 'socio',
  MEDICO_RESIDENTE: 'medico_residente',
  MEDICO_ESPECIALISTA: 'medico_especialista'
} as const;

export const ROLE_LABELS = {
  [ROLES.CAJERO]: 'Cajero',
  [ROLES.ENFERMERO]: 'Enfermero',
  [ROLES.ALMACENISTA]: 'Almacenista',
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.SOCIO]: 'Socio',
  [ROLES.MEDICO_RESIDENTE]: 'Médico Residente',
  [ROLES.MEDICO_ESPECIALISTA]: 'Médico Especialista'
} as const;

export const PATIENT_ACCOUNT_STATES = {
  OPEN: 'abierta',
  CLOSED: 'cerrada'
} as const;

export const ROOM_STATES = {
  AVAILABLE: 'disponible',
  OCCUPIED: 'ocupada',
  MAINTENANCE: 'mantenimiento'
} as const;

export const APPOINTMENT_STATES = {
  SCHEDULED: 'programada',
  CONFIRMED: 'confirmada',
  COMPLETED: 'completada',
  CANCELLED: 'cancelada'
} as const;

export const ACCOUNT_STATE_LABELS = {
  [PATIENT_ACCOUNT_STATES.OPEN]: 'Abierta',
  [PATIENT_ACCOUNT_STATES.CLOSED]: 'Cerrada'
} as const;

export const ROOM_STATE_LABELS = {
  [ROOM_STATES.AVAILABLE]: 'Disponible',
  [ROOM_STATES.OCCUPIED]: 'Ocupada',
  [ROOM_STATES.MAINTENANCE]: 'Mantenimiento'
} as const;

export const APPOINTMENT_STATE_LABELS = {
  [APPOINTMENT_STATES.SCHEDULED]: 'Programada',
  [APPOINTMENT_STATES.CONFIRMED]: 'Confirmada',
  [APPOINTMENT_STATES.COMPLETED]: 'Completada',
  [APPOINTMENT_STATES.CANCELLED]: 'Cancelada'
} as const;

export const ATTENTION_TYPES = {
  GENERAL_CONSULTATION: 'consulta_general',
  EMERGENCY: 'urgencia',
  HOSPITALIZATION: 'hospitalizacion'
} as const;

export const ATTENTION_TYPE_LABELS = {
  [ATTENTION_TYPES.GENERAL_CONSULTATION]: 'Consulta General',
  [ATTENTION_TYPES.EMERGENCY]: 'Urgencia',
  [ATTENTION_TYPES.HOSPITALIZATION]: 'Hospitalización'
} as const;

export const EMPLOYEE_TYPES = {
  NURSE: 'enfermero',
  RESIDENT_DOCTOR: 'medico_residente',
  SPECIALIST_DOCTOR: 'medico_especialista'
} as const;

export const EMPLOYEE_TYPE_LABELS = {
  [EMPLOYEE_TYPES.NURSE]: 'Enfermero',
  [EMPLOYEE_TYPES.RESIDENT_DOCTOR]: 'Médico Residente',
  [EMPLOYEE_TYPES.SPECIALIST_DOCTOR]: 'Médico Especialista'
} as const;

export const GENDERS = {
  M: 'M',
  F: 'F',
  OTHER: 'Otro'
} as const;

export const GENDER_LABELS = {
  [GENDERS.M]: 'Masculino',
  [GENDERS.F]: 'Femenino',
  [GENDERS.OTHER]: 'Otro'
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register', 
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify-token'
  },
  PATIENTS: {
    BASE: '/patients',
    SEARCH: '/patients/search',
    STATS: '/patients/stats',
    BY_ID: (id: number | string) => `/patients/${id}`,
    HISTORY: (id: number | string) => `/patients/${id}/history`,
    RESPONSIBLE: (id: number | string) => `/patients/${id}/responsible`
  },
  EMPLOYEES: {
    BASE: '/employees',
    SEARCH: '/employees/search',
    STATS: '/employees/stats',
    BY_ID: (id: number | string) => `/employees/${id}`
  },
  POS: {
    STATS: '/pos/stats'
  },
  SERVICES: {
    BASE: '/services',
    SEARCH: '/services/search'
  },
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search'
  },
  PATIENT_ACCOUNTS: {
    BASE: '/patient-accounts',
    BY_ID: (id: number | string) => `/patient-accounts/${id}`,
    TRANSACTIONS: (id: number | string) => `/patient-accounts/${id}/transactions`,
    CLOSE: (id: number | string) => `/patient-accounts/${id}/close`
  }
} as const;

// Mock APP_CONFIG without import.meta.env
export const APP_CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',
  APP_NAME: 'Sistema Hospitalario',
  APP_VERSION: '1.0.0',
  TOKEN_KEY: 'hospital_token',
  USER_KEY: 'hospital_user',
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  }
} as const;

export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1'
} as const;

export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Creado exitosamente',
    UPDATED: 'Actualizado exitosamente',
    DELETED: 'Eliminado exitosamente',
    SAVED: 'Guardado exitosamente'
  },
  ERROR: {
    GENERIC: 'Ha ocurrido un error inesperado',
    NETWORK: 'Error de conexión. Verifique su conexión a internet',
    UNAUTHORIZED: 'No tiene permisos para realizar esta acción',
    NOT_FOUND: 'El recurso solicitado no fue encontrado',
    VALIDATION: 'Por favor corrija los errores en el formulario'
  },
  CONFIRM: {
    DELETE: '¿Está seguro que desea eliminar este elemento?',
    DISCARD_CHANGES: '¿Está seguro que desea descartar los cambios?'
  }
} as const;