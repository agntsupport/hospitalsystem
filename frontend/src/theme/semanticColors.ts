// ABOUTME: Colores semánticos del Sistema Hospitalario
// ABOUTME: Define colores con significado contextual para estados, módulos y acciones

/**
 * Colores Semánticos del Sistema de Gestión Hospitalaria
 * Estos colores tienen significado específico según el contexto de uso
 */

// Estados de ocupación de habitaciones/quirófanos
export const occupancyColors = {
  /** Verde - Disponible para uso */
  available: 'success.main',
  /** Rojo - Actualmente ocupado */
  occupied: 'error.main',
  /** Naranja - En mantenimiento */
  maintenance: 'warning.main',
  /** Azul claro - En proceso de limpieza */
  cleaning: 'info.light',
  /** Azul - En preparación */
  preparation: 'info.main',
  /** Gris - Fuera de servicio */
  outOfService: 'grey.500',
} as const;

// Estados de cuentas de pacientes
export const accountColors = {
  /** Azul - Cuenta abierta/activa */
  open: 'info.main',
  /** Verde - Cuenta cerrada/pagada */
  closed: 'success.main',
  /** Naranja - Pendiente de pago */
  pending: 'warning.main',
  /** Rojo - Cuenta vencida */
  overdue: 'error.main',
  /** Morado - En cuentas por cobrar */
  receivable: 'secondary.main',
} as const;

// Estados de solicitudes de almacén
export const requestColors = {
  /** Amarillo claro - Pendiente de asignación */
  pending: 'warning.light',
  /** Azul - En proceso/asignada */
  inProgress: 'info.main',
  /** Verde claro - Lista para recoger */
  ready: 'success.light',
  /** Verde - Entregada */
  delivered: 'success.main',
  /** Rojo claro - Cancelada */
  cancelled: 'error.light',
} as const;

// Estados de hospitalización
export const hospitalizationColors = {
  /** Azul - Paciente activo/ingresado */
  active: 'info.main',
  /** Verde - Dado de alta */
  discharged: 'success.main',
  /** Naranja - Pendiente de alta */
  pendingDischarge: 'warning.main',
  /** Rojo - Crítico/urgente */
  critical: 'error.main',
} as const;

// Estados de cirugías
export const surgeryColors = {
  /** Azul claro - Programada */
  scheduled: 'info.light',
  /** Azul - En curso */
  inProgress: 'info.main',
  /** Verde - Completada */
  completed: 'success.main',
  /** Rojo - Cancelada */
  cancelled: 'error.main',
  /** Naranja - Pospuesta */
  postponed: 'warning.main',
} as const;

// Colores por módulo (para iconos y acentos)
export const moduleColors = {
  /** Dashboard - Azul primario */
  dashboard: 'primary.main',
  /** Pacientes - Azul info */
  patients: 'info.main',
  /** Hospitalización - Morado */
  hospitalization: 'secondary.main',
  /** POS - Verde */
  pos: 'success.main',
  /** Inventario - Naranja */
  inventory: 'warning.main',
  /** Facturación - Azul oscuro */
  billing: 'primary.dark',
  /** Empleados - Morado claro */
  employees: 'secondary.light',
  /** Habitaciones - Azul oscuro */
  rooms: 'info.dark',
  /** Quirófanos - Rojo */
  operatingRooms: 'error.main',
  /** Reportes - Gris */
  reports: 'grey.700',
  /** Auditoría - Gris oscuro */
  audit: 'grey.800',
  /** Usuarios - Morado */
  users: 'secondary.main',
  /** Cuentas por Cobrar - Naranja oscuro */
  receivables: 'warning.dark',
} as const;

// Colores de acciones
export const actionColors = {
  /** Crear/Agregar */
  create: 'primary.main',
  /** Editar/Modificar */
  edit: 'info.main',
  /** Eliminar/Cancelar */
  delete: 'error.main',
  /** Ver detalles */
  view: 'grey.700',
  /** Imprimir */
  print: 'grey.600',
  /** Exportar */
  export: 'success.main',
  /** Confirmar */
  confirm: 'success.main',
  /** Rechazar */
  reject: 'error.main',
} as const;

// Colores de notificaciones
export const notificationColors = {
  /** Información general */
  info: 'info.main',
  /** Éxito/Confirmación */
  success: 'success.main',
  /** Advertencia */
  warning: 'warning.main',
  /** Error/Alerta */
  error: 'error.main',
  /** Nueva solicitud */
  newRequest: 'primary.main',
  /** Urgente */
  urgent: 'error.dark',
} as const;

// Colores de métricas/KPIs
export const metricColors = {
  /** Positivo/Incremento */
  positive: 'success.main',
  /** Negativo/Decremento */
  negative: 'error.main',
  /** Neutral/Sin cambio */
  neutral: 'grey.600',
  /** Destacado */
  highlight: 'primary.main',
} as const;

// Colores para badges de roles
export const roleColors = {
  administrador: 'error.main',
  cajero: 'success.main',
  enfermero: 'info.main',
  almacenista: 'warning.main',
  medico_residente: 'secondary.main',
  medico_especialista: 'secondary.dark',
  socio: 'grey.700',
} as const;

// Exportar todos los colores semánticos
export const semanticColors = {
  occupancy: occupancyColors,
  account: accountColors,
  request: requestColors,
  hospitalization: hospitalizationColors,
  surgery: surgeryColors,
  module: moduleColors,
  action: actionColors,
  notification: notificationColors,
  metric: metricColors,
  role: roleColors,
} as const;

export default semanticColors;
