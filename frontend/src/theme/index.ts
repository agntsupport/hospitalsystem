// ABOUTME: Punto de entrada del Design System del Hospital
// ABOUTME: Re-exporta todos los tokens, constantes y tema para uso centralizado

// Design Tokens
export {
  tokens,
  spacing,
  radius,
  elevation,
  typography,
  iconSize,
  opacity,
  transitions,
  zIndex,
  breakpoints,
} from './designTokens';

// Colores Semánticos
export {
  semanticColors,
  occupancyColors,
  accountColors,
  requestColors,
  hospitalizationColors,
  surgeryColors,
  moduleColors,
  actionColors,
  notificationColors,
  metricColors,
  roleColors,
} from './semanticColors';

// Constantes de Layout
export {
  layout,
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
} from './layoutConstants';

// Tema MUI
export { hospitalTheme } from './hospitalTheme';
export { default as hospitalThemeDefault } from './hospitalTheme';
