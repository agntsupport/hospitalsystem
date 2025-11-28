// ABOUTME: Tema MUI personalizado del Sistema Hospitalario
// ABOUTME: Extiende Material-UI con los design tokens del sistema

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { radius, elevation, transitions } from './designTokens';

/**
 * Paleta de colores del Sistema de Gestión Hospitalaria
 * Colores profesionales para ambiente médico/hospitalario
 */
const palette = {
  primary: {
    main: '#1976d2',      // Azul profesional
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7b1fa2',      // Morado para acentos
    light: '#ae52d4',
    dark: '#4a0072',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32',      // Verde para estados positivos
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02',      // Naranja para advertencias
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',      // Rojo para errores
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288d1',      // Azul claro para información
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f5f5f5',   // Fondo gris claro
    paper: '#ffffff',     // Superficies blancas
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

/**
 * Configuración de tipografía
 */
const typographyConfig = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

  // Títulos de página (Dashboard, Pacientes, etc.)
  h4: {
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.235,
    letterSpacing: '0.00735em',
  },

  // Títulos de sección
  h5: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.334,
    letterSpacing: '0em',
  },

  // Títulos de cards
  h6: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },

  // Subtítulos
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },

  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },

  // Texto principal
  body1: {
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },

  // Texto secundario
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },

  // Captions
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },

  // Botones
  button: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none' as const,
  },
};

/**
 * Configuración de componentes
 */
const componentsConfig: ThemeOptions['components'] = {
  // Cards
  MuiCard: {
    defaultProps: {
      elevation: elevation.card,
    },
    styleOverrides: {
      root: {
        borderRadius: radius.md,
        transition: `box-shadow ${transitions.normal} ease-in-out`,
        '&:hover': {
          // Solo aplicar hover si es clickeable (tiene onClick)
        },
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24, // spacing.md * 8
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 16, // spacing.sm * 8
      },
    },
  },

  // Botones
  MuiButton: {
    defaultProps: {
      disableElevation: false,
    },
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
        },
      },
      outlined: {
        borderWidth: 1,
        '&:hover': {
          borderWidth: 1,
        },
      },
      sizeSmall: {
        padding: '4px 10px',
        fontSize: '0.8125rem',
      },
      sizeLarge: {
        padding: '11px 22px',
        fontSize: '0.9375rem',
      },
    },
  },

  // Chips
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
        fontWeight: 500,
      },
    },
  },

  // Diálogos
  MuiDialog: {
    defaultProps: {
      PaperProps: {
        elevation: elevation.modal,
      },
    },
    styleOverrides: {
      paper: {
        borderRadius: radius.lg,
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 600,
        padding: '16px 24px',
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '20px 24px',
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
        gap: 8,
      },
    },
  },

  // Inputs
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: radius.sm,
        },
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
      },
    },
  },

  // Selects
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
      },
    },
  },

  // Tablas
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontWeight: 600,
          backgroundColor: palette.grey[50],
        },
      },
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '12px 16px',
      },
      head: {
        fontWeight: 600,
      },
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },

  // Paper
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: radius.md,
      },
      rounded: {
        borderRadius: radius.md,
      },
    },
  },

  // Avatars
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 500,
      },
    },
  },

  // Tooltips
  MuiTooltip: {
    defaultProps: {
      arrow: true,
    },
    styleOverrides: {
      tooltip: {
        borderRadius: radius.sm,
        fontSize: '0.75rem',
      },
    },
  },

  // Alerts
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: radius.md,
      },
    },
  },

  // Snackbar
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    },
  },

  // Tabs
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        minWidth: 'auto',
        padding: '12px 16px',
      },
    },
  },

  // Menu
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: radius.md,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        padding: '8px 16px',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },

  // Lists
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
        '&.Mui-selected': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          },
        },
      },
    },
  },

  // AppBar
  MuiAppBar: {
    defaultProps: {
      elevation: elevation.card,
    },
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: palette.text.primary,
      },
    },
  },

  // Drawer
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      },
    },
  },

  // Breadcrumbs
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        marginBottom: 16,
      },
    },
  },

  // Pagination
  MuiPagination: {
    defaultProps: {
      color: 'primary',
      shape: 'rounded',
    },
  },

  // IconButton
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
      },
    },
  },

  // Fab
  MuiFab: {
    styleOverrides: {
      root: {
        boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
      },
    },
  },

  // Skeleton
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
      },
      rectangular: {
        borderRadius: radius.md,
      },
    },
  },

  // Backdrop
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  },
};

/**
 * Tema del Sistema Hospitalario
 */
export const hospitalTheme = createTheme({
  palette,
  typography: typographyConfig,
  components: componentsConfig,
  shape: {
    borderRadius: radius.md,
  },
  spacing: 8, // Base de 8px para el grid system
});

export default hospitalTheme;
