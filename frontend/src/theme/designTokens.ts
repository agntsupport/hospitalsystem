// ABOUTME: Design tokens centralizados del Sistema Hospitalario
// ABOUTME: Define spacing, radius, elevation, tipografía e iconos para consistencia visual

/**
 * Design Tokens del Sistema de Gestión Hospitalaria
 * Estos tokens son la base del design system y deben usarse en todos los componentes
 */

// Spacing Scale (basado en 8px grid system)
export const spacing = {
  /** 4px - Micro espaciado */
  xxs: 0.5,
  /** 8px - Extra pequeño */
  xs: 1,
  /** 16px - Pequeño */
  sm: 2,
  /** 24px - Mediano (default) */
  md: 3,
  /** 32px - Grande */
  lg: 4,
  /** 40px - Extra grande */
  xl: 5,
  /** 48px - XXL */
  xxl: 6,
} as const;

// Border Radius
export const radius = {
  /** 4px - Botones, inputs */
  sm: 4,
  /** 8px - Cards, dialogs */
  md: 8,
  /** 12px - Cards destacadas */
  lg: 12,
  /** 16px - Elementos grandes */
  xl: 16,
  /** Circular */
  full: '50%',
} as const;

// Elevation (sombras MUI)
export const elevation = {
  /** Sin sombra */
  none: 0,
  /** Cards estándar */
  card: 1,
  /** Elementos destacados, hover */
  raised: 2,
  /** Cards activas */
  active: 3,
  /** Tooltips, popovers */
  tooltip: 4,
  /** Dropdowns, menus */
  dropdown: 8,
  /** Modales y diálogos */
  modal: 24,
} as const;

// Typography variants para diferentes contextos
export const typography = {
  /** Títulos de página principales (Dashboard, Pacientes, etc.) */
  pageTitle: 'h4' as const,
  /** Títulos de secciones dentro de página */
  sectionTitle: 'h5' as const,
  /** Títulos de cards y paneles */
  cardTitle: 'h6' as const,
  /** Subtítulos */
  subtitle: 'subtitle1' as const,
  /** Texto principal del cuerpo */
  body: 'body1' as const,
  /** Texto secundario, descripciones */
  bodySecondary: 'body2' as const,
  /** Etiquetas pequeñas, metadata */
  caption: 'caption' as const,
  /** Texto en botones */
  button: 'button' as const,
} as const;

// Tamaños de iconos
export const iconSize = {
  /** 16px - Iconos inline en texto */
  xs: 16,
  /** 20px - Iconos en botones pequeños */
  sm: 20,
  /** 24px - Iconos estándar (default MUI) */
  md: 24,
  /** 32px - Iconos en headers */
  lg: 32,
  /** 40px - Iconos destacados en cards */
  xl: 40,
  /** 48px - Iconos grandes en stats */
  xxl: 48,
} as const;

// Opacidades estándar
export const opacity = {
  /** Elementos deshabilitados */
  disabled: 0.38,
  /** Texto secundario, hints */
  secondary: 0.6,
  /** Texto semi-prominente */
  medium: 0.7,
  /** Hover sobre superficies */
  hover: 0.04,
  /** Focus sobre superficies */
  focus: 0.12,
  /** Overlays ligeros */
  overlay: 0.5,
} as const;

// Transiciones
export const transitions = {
  /** Transiciones rápidas (hover, focus) */
  fast: '150ms',
  /** Transiciones normales */
  normal: '250ms',
  /** Transiciones lentas (modales) */
  slow: '350ms',
} as const;

// Z-index scale
export const zIndex = {
  /** Contenido base */
  base: 0,
  /** Elementos flotantes sobre contenido */
  dropdown: 1000,
  /** Sticky headers */
  sticky: 1100,
  /** Drawers laterales */
  drawer: 1200,
  /** Modales */
  modal: 1300,
  /** Snackbars/toasts */
  snackbar: 1400,
  /** Tooltips */
  tooltip: 1500,
} as const;

// Breakpoints (consistentes con MUI)
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Exportar todos los tokens como objeto único
export const tokens = {
  spacing,
  radius,
  elevation,
  typography,
  iconSize,
  opacity,
  transitions,
  zIndex,
  breakpoints,
} as const;

export default tokens;
