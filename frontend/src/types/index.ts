// ABOUTME: Punto central de exportaciones de tipos para el frontend
// Centraliza todas las exportaciones de tipos para evitar duplicados y mejorar mantenibilidad

// === Patient Types (fuente única) ===
export type {
  Patient,
  PatientResponsible,
  PatientStats,
  PatientFilters,
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateResponsibleRequest,
  UpdateResponsibleRequest,
  PatientsResponse,
  SinglePatientResponse,
  PatientStatsResponse,
  ResponsiblesResponse,
  SingleResponsibleResponse
} from './patients.types';

export {
  GENDER_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  BLOOD_TYPES,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_LABELS
} from './patients.types';

// === Redux Patient Types (sin duplicar Patient) ===
export type {
  Responsible,
  PatientAccount,
  Room,
  Employee,
  AccountTransaction,
  Service,
  Product,
  MedicalHistory,
  Appointment,
  Consultorio,
  CreatePatientData,
  CreateResponsibleData,
  UpdatePatientData,
  PatientsFilters,
  PaginationParams,
  PaginationResponse,
  PatientResponse,
  PatientHistoryResponse,
  PatientsStatsResponse
} from './patient.redux.types';

// === POS Types ===
export type {
  PatientAccount as POSPatientAccount
} from './pos.types';

// === Auth Types ===
export type {
  User,
  LoginCredentials,
  AuthState
} from './auth.types';
