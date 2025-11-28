// ABOUTME: Constantes de layout del Sistema Hospitalario
// ABOUTME: Define dimensiones, paddings y espaciados para estructuras de página

import { spacing } from './designTokens';

/**
 * Constantes de Layout del Sistema de Gestión Hospitalaria
 * Estas constantes aseguran consistencia en la estructura de páginas y componentes
 */

// Layout de página principal
export const page = {
  /** Padding horizontal responsivo */
  paddingX: { xs: spacing.sm, sm: spacing.md, md: spacing.lg },
  /** Padding vertical */
  paddingY: spacing.md,
  /** Ancho máximo del contenido */
  maxWidth: 'xl' as const,
  /** Espaciado entre secciones de página */
  sectionGap: spacing.lg,
  /** Margen inferior del header */
  headerMarginBottom: spacing.md,
} as const;

// Layout de cards
export const card = {
  /** Padding interno de cards */
  padding: spacing.md,
  /** Padding del header de card */
  headerPadding: spacing.sm,
  /** Padding del contenido de card */
  contentPadding: spacing.sm,
  /** Espaciado entre cards en grids */
  gap: spacing.md,
  /** Border radius de cards */
  borderRadius: 8,
} as const;

// Layout de grid
export const grid = {
  /** Espaciado en móvil */
  xs: spacing.sm,
  /** Espaciado en tablet */
  sm: spacing.sm,
  /** Espaciado en desktop */
  md: spacing.md,
  /** Espaciado en pantallas grandes */
  lg: spacing.md,
} as const;

// Layout de tablas
export const table = {
  /** Altura de fila de datos */
  rowHeight: 52,
  /** Altura del header */
  headerHeight: 56,
  /** Padding de celdas */
  cellPadding: spacing.sm,
  /** Padding horizontal de celdas */
  cellPaddingX: spacing.sm,
  /** Padding vertical de celdas */
  cellPaddingY: spacing.xs,
  /** Ancho mínimo de columna de acciones */
  actionsColumnWidth: 120,
} as const;

// Layout de formularios
export const form = {
  /** Espaciado entre campos */
  fieldSpacing: spacing.md,
  /** Espaciado entre secciones */
  sectionSpacing: spacing.lg,
  /** Ancho máximo de campo de texto */
  maxFieldWidth: 400,
  /** Ancho de label */
  labelWidth: 120,
} as const;

// Layout de diálogos/modales
export const dialog = {
  /** Ancho para diálogos pequeños (confirmaciones) */
  sm: 'sm' as const,
  /** Ancho para diálogos medianos (formularios simples) */
  md: 'md' as const,
  /** Ancho para diálogos grandes (formularios complejos) */
  lg: 'lg' as const,
  /** Padding del contenido */
  contentPadding: spacing.md,
  /** Padding de las acciones */
  actionsPadding: spacing.sm,
} as const;

// Layout del sidebar
export const sidebar = {
  /** Ancho expandido */
  width: 240,
  /** Ancho colapsado */
  collapsedWidth: 64,
  /** Padding interno */
  padding: spacing.sm,
  /** Altura de item de menú */
  itemHeight: 48,
} as const;

// Layout del header
export const header = {
  /** Altura del header */
  height: 64,
  /** Padding horizontal */
  paddingX: spacing.md,
  /** Z-index */
  zIndex: 1100,
} as const;

// Stats cards layout
export const statsCard = {
  /** Altura mínima */
  minHeight: 120,
  /** Tamaño del avatar/icono */
  iconSize: 48,
  /** Padding interno */
  padding: spacing.md,
  /** Grid columns en diferentes breakpoints */
  columns: {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
  },
} as const;

// Empty state layout
export const emptyState = {
  /** Padding vertical */
  paddingY: spacing.xl,
  /** Tamaño del icono */
  iconSize: 64,
  /** Espaciado entre elementos */
  gap: spacing.sm,
  /** Ancho máximo del texto */
  maxTextWidth: 400,
  /** Altura mínima del contenedor */
  minHeight: 200,
} as const;

// Loading state layout
export const loadingState = {
  /** Altura mínima del contenedor */
  minHeight: 200,
  /** Tamaño del spinner */
  spinnerSize: 40,
} as const;

// Exportar todas las constantes de layout
export const layout = {
  page,
  card,
  grid,
  table,
  form,
  dialog,
  sidebar,
  header,
  statsCard,
  emptyState,
  loadingState,
} as const;

export default layout;
