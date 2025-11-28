// ABOUTME: Constantes de UI para mantener consistencia visual en todo el sistema
// Define colores, iconos y estilos estandarizados para acciones CRUD y elementos comunes

/**
 * Colores estándar para acciones en botones y elementos interactivos
 * Usar con prop `color` de MUI
 */
export const ACTION_COLORS = {
  /** Crear/Agregar nuevo elemento */
  CREATE: 'primary',
  /** Editar elemento existente */
  EDIT: 'primary',
  /** Ver detalle/información */
  VIEW: 'info',
  /** Eliminar elemento */
  DELETE: 'error',
  /** Confirmar acción */
  CONFIRM: 'success',
  /** Cancelar acción */
  CANCEL: 'inherit',
  /** Advertencia */
  WARNING: 'warning'
} as const;

/**
 * Variantes estándar para botones según tipo de acción
 * Usar con prop `variant` de MUI Button
 */
export const ACTION_VARIANTS = {
  /** Acción principal (crear, confirmar) */
  PRIMARY: 'contained',
  /** Acción secundaria (editar, ver) */
  SECONDARY: 'outlined',
  /** Acción terciaria (cancelar) */
  TERTIARY: 'text'
} as const;

/**
 * Configuración completa de botones por tipo de acción
 * Combina color y variante para uso directo
 */
export const BUTTON_CONFIG = {
  CREATE: { color: 'primary', variant: 'contained' },
  EDIT: { color: 'primary', variant: 'outlined' },
  VIEW: { color: 'info', variant: 'outlined' },
  DELETE: { color: 'error', variant: 'outlined' },
  CONFIRM: { color: 'success', variant: 'contained' },
  CANCEL: { color: 'inherit', variant: 'text' },
  SAVE: { color: 'primary', variant: 'contained' },
  EXPORT: { color: 'primary', variant: 'outlined' },
  PRINT: { color: 'primary', variant: 'outlined' },
  REFRESH: { color: 'primary', variant: 'text' },
  FILTER: { color: 'primary', variant: 'text' },
  SEARCH: { color: 'primary', variant: 'outlined' }
} as const;

/**
 * Nombres de iconos estándar para cada acción (de @mui/icons-material)
 * Importar los iconos correspondientes de @mui/icons-material
 */
export const ACTION_ICONS = {
  CREATE: 'Add',
  EDIT: 'Edit',
  VIEW: 'Visibility',
  DELETE: 'Delete',
  SEARCH: 'Search',
  FILTER: 'FilterList',
  EXPORT: 'Download',
  PRINT: 'Print',
  REFRESH: 'Refresh',
  SAVE: 'Save',
  CANCEL: 'Close',
  CONFIRM: 'Check',
  BACK: 'ArrowBack',
  NEXT: 'ArrowForward',
  EXPAND: 'ExpandMore',
  COLLAPSE: 'ExpandLess',
  SORT_ASC: 'ArrowUpward',
  SORT_DESC: 'ArrowDownward',
  INFO: 'Info',
  WARNING: 'Warning',
  ERROR: 'Error',
  SUCCESS: 'CheckCircle',
  SETTINGS: 'Settings',
  MENU: 'Menu',
  CLOSE: 'Close',
  HISTORY: 'History',
  NOTIFICATIONS: 'Notifications',
  PERSON: 'Person',
  PEOPLE: 'People'
} as const;

/**
 * Configuración estándar de tablas
 */
export const TABLE_CONFIG = {
  /** Tamaño de tabla (small para datos densos) */
  SIZE: 'small',
  /** Variante de Paper para tabla */
  PAPER_VARIANT: 'outlined',
  /** Alineación de columnas por tipo de dato */
  ALIGN: {
    TEXT: 'left',
    NUMBER: 'right',
    CURRENCY: 'right',
    DATE: 'center',
    ACTIONS: 'center',
    STATUS: 'center',
    BOOLEAN: 'center'
  }
} as const;

/**
 * Jerarquía de tipografía estándar
 */
export const TYPOGRAPHY = {
  /** Título principal de página */
  PAGE_TITLE: 'h4',
  /** Título de sección */
  SECTION_TITLE: 'h5',
  /** Título de subsección o card */
  SUBSECTION_TITLE: 'h6',
  /** Subtítulo descriptivo */
  SUBTITLE: 'subtitle1',
  /** Texto principal */
  BODY: 'body1',
  /** Texto secundario */
  BODY_SECONDARY: 'body2',
  /** Metadata, timestamps, captions */
  CAPTION: 'caption'
} as const;

/**
 * Espaciado estándar (multiplos del spacing theme)
 */
export const SPACING = {
  /** Espaciado entre páginas y secciones principales */
  PAGE: 3,
  /** Espaciado entre secciones */
  SECTION: 2,
  /** Espaciado entre elementos */
  ELEMENT: 1,
  /** Espaciado compacto (dentro de cards) */
  COMPACT: 0.5
} as const;

/**
 * Configuración de Chips de estado
 */
export const STATUS_CHIP_CONFIG = {
  /** Activo/Abierto/Disponible */
  ACTIVE: { color: 'success', variant: 'filled' },
  /** Inactivo/Cerrado */
  INACTIVE: { color: 'default', variant: 'outlined' },
  /** Pendiente/En proceso */
  PENDING: { color: 'warning', variant: 'filled' },
  /** Error/Rechazado */
  ERROR: { color: 'error', variant: 'filled' },
  /** Completado */
  COMPLETED: { color: 'success', variant: 'outlined' },
  /** Info/Neutral */
  INFO: { color: 'info', variant: 'filled' }
} as const;

/**
 * Z-index estándar para capas de UI
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1100,
  DRAWER: 1200,
  MODAL: 1300,
  SNACKBAR: 1400,
  TOOLTIP: 1500
} as const;

/**
 * Breakpoints responsivos (matches MUI defaults)
 */
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536
} as const;
