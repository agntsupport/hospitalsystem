# Plan de Unificación UI/UX - Sistema Hospitalario

**Versión:** 1.0
**Fecha:** 28 de noviembre de 2025
**Autor:** Claude + Alfredo Manuel Reyes
**Estado:** Plan Aprobado - Pendiente Implementación

---

## Resumen Ejecutivo

### Objetivo
Unificar la experiencia visual del sistema hospitalario para que se perciba como un todo coherente, independientemente del módulo o sección que el usuario esté utilizando.

### Estado Actual vs Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Consistencia General | 6.8/10 | 9.2/10 |
| Componentes Reutilizables | 4/10 | 9/10 |
| Spacing Consistente | 5/10 | 10/10 |
| Tipografía | 6/10 | 9/10 |
| Layout | 7/10 | 9/10 |

### Tiempo Estimado Total: 32-44 horas (5-7 días)

---

## FASE 1: Design System Foundation (8-10 horas)

### 1.1 Crear Design Tokens (2-3 horas)

**Archivo:** `/frontend/src/theme/designTokens.ts`

```typescript
// Design Tokens del Sistema Hospitalario
export const tokens = {
  // Spacing Scale (basado en 8px grid)
  spacing: {
    xs: 1,   // 8px
    sm: 2,   // 16px
    md: 3,   // 24px
    lg: 4,   // 32px
    xl: 5,   // 40px
    xxl: 6,  // 48px
  },

  // Border Radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: '50%',
  },

  // Shadows/Elevation
  elevation: {
    card: 1,      // Cards estándar
    raised: 2,    // Elementos destacados
    modal: 8,     // Modales y diálogos
    tooltip: 4,   // Tooltips
  },

  // Typography Scale
  typography: {
    pageTitle: 'h4',      // Títulos de página
    sectionTitle: 'h5',   // Títulos de sección
    cardTitle: 'h6',      // Títulos de cards
    body: 'body1',        // Texto principal
    caption: 'body2',     // Texto secundario
  },

  // Icon Sizes
  iconSize: {
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },

  // Opacity
  opacity: {
    disabled: 0.5,
    secondary: 0.7,
    hover: 0.04,
    focus: 0.12,
  },
};
```

### 1.2 Extender Tema MUI (2-3 horas)

**Archivo:** `/frontend/src/theme/hospitalTheme.ts`

```typescript
import { createTheme } from '@mui/material/styles';
import { tokens } from './designTokens';

export const hospitalTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },

  components: {
    MuiCard: {
      defaultProps: {
        elevation: tokens.elevation.card,
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          textTransform: 'none',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          elevation: tokens.elevation.modal,
        },
      },
    },
  },
});
```

### 1.3 Crear Constantes de Layout (2 horas)

**Archivo:** `/frontend/src/theme/layoutConstants.ts`

```typescript
export const layout = {
  // Page Layout
  page: {
    paddingX: { xs: 2, sm: 3, md: 4 },
    paddingY: 3,
    maxWidth: 'xl' as const,
  },

  // Card Layout
  card: {
    padding: 3,
    headerPadding: 2,
    contentPadding: 2,
  },

  // Grid Gaps
  grid: {
    xs: 2,
    sm: 2,
    md: 3,
  },

  // Table
  table: {
    rowHeight: 52,
    headerHeight: 56,
    cellPadding: 2,
  },

  // Form
  form: {
    fieldSpacing: 3,
    sectionSpacing: 4,
  },
};
```

### 1.4 Documentar Paleta de Colores Semánticos (1-2 horas)

**Archivo:** `/frontend/src/theme/semanticColors.ts`

```typescript
export const semanticColors = {
  // Estados de ocupación
  occupancy: {
    available: 'success.main',     // Verde - Disponible
    occupied: 'error.main',        // Rojo - Ocupado
    maintenance: 'warning.main',   // Naranja - Mantenimiento
    cleaning: 'info.main',         // Azul - Limpieza
  },

  // Estados de cuenta
  account: {
    open: 'info.main',             // Azul - Cuenta abierta
    closed: 'success.main',        // Verde - Cuenta cerrada
    pending: 'warning.main',       // Naranja - Pendiente de pago
    overdue: 'error.main',         // Rojo - Vencida
  },

  // Estados de solicitud
  request: {
    pending: 'warning.light',
    inProgress: 'info.main',
    ready: 'success.light',
    delivered: 'success.main',
    cancelled: 'error.light',
  },

  // Iconos de módulos
  modules: {
    dashboard: 'primary.main',
    patients: 'info.main',
    hospitalization: 'secondary.main',
    pos: 'success.main',
    inventory: 'warning.main',
    billing: 'primary.dark',
    employees: 'secondary.light',
    rooms: 'info.dark',
    reports: 'grey.700',
  },
};
```

---

## FASE 2: Componentes Unificados (12-16 horas)

### 2.1 Componente StatCard Unificado (4-5 horas)

**Archivo:** `/frontend/src/components/common/StatCard.tsx`

**Reemplaza:**
- `MetricCard.tsx`
- `BillingStatsCards.tsx`
- `CPCStatsCards.tsx`
- `POSStatsCards.tsx`

**API Propuesta:**

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
  onClick?: () => void;
}
```

**Diseño Visual Unificado:**
- Elevation: 1
- Border radius: 8px
- Padding: 24px
- Icon: Avatar circular 48x48px a la izquierda
- Título: Typography body2, color text.secondary
- Valor: Typography h4, color text.primary
- Subtítulo: Typography caption, color text.secondary

### 2.2 Componente PageHeader Unificado (2-3 horas)

**Archivo:** `/frontend/src/components/common/PageHeader.tsx`

**API Propuesta:**

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}
```

**Diseño Visual Unificado:**
- Typography variant: h4
- Icon size: 32px, color primario
- Margin bottom: 24px (spacing.md)
- Acciones alineadas a la derecha

### 2.3 Componente DataTable Wrapper (3-4 horas)

**Archivo:** `/frontend/src/components/common/DataTable.tsx`

**Features:**
- Integración con MUI DataGrid
- Empty state estandarizado
- Loading state consistente
- Responsive columns automático
- Acciones de fila estandarizadas
- Paginación unificada

### 2.4 Componentes de Diálogo Estandarizados (3-4 horas)

**Archivos:**
- `/frontend/src/components/common/FormDialog.tsx` - Para formularios
- `/frontend/src/components/common/ConfirmDialog.tsx` - Para confirmaciones
- `/frontend/src/components/common/ResultDialog.tsx` - Para resultados

**Patrones Unificados:**
- Título: Typography h6
- Padding contenido: 24px
- Acciones: Cancel (outlined), Submit (contained)
- Max width por tipo: form=md, confirm=sm, result=sm

---

## FASE 3: Estandarización de Páginas (8-12 horas)

### 3.1 Migración de Páginas a PageLayout (4-6 horas)

**Páginas a Actualizar (14):**

| Página | Estado Actual | Cambios Necesarios |
|--------|---------------|-------------------|
| Dashboard | Custom header | Usar PageHeader |
| Patients | h4 + icon inline | Usar PageHeader |
| Hospitalization | h4 sin icon | Agregar icon, usar PageHeader |
| POS | Custom layout | Estandarizar |
| CuentasPorCobrar | h4 + icon | Usar PageHeader |
| Inventory | Sin título | Agregar PageHeader |
| Billing | h4 separado | Usar PageHeader |
| Rooms | Sin título | Agregar PageHeader |
| Offices | Sin título | Agregar PageHeader |
| Employees | Custom | Usar PageHeader |
| Quirofanos | Custom | Usar PageHeader |
| Users | Custom | Usar PageHeader |
| Reports | Tabs custom | Mantener tabs, agregar PageHeader |
| Audit | Custom | Usar PageHeader |

### 3.2 Estandarización de Estados Vacíos (2-3 horas)

**Componente:** `/frontend/src/components/common/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Aplicar en:**
- Tablas sin datos
- Listas vacías
- Resultados de búsqueda vacíos
- Estados iniciales de módulos

### 3.3 Estandarización de Loading States (2-3 horas)

**Patrones:**
- Skeleton para cards (StatCardSkeleton)
- Skeleton para tablas (TableSkeleton)
- Spinner centrado para contenido principal
- Linear progress en headers durante operaciones

---

## FASE 4: Documentación y Guía de Estilos (4-6 horas)

### 4.1 Crear Design System Docs (2-3 horas)

**Archivo:** `/frontend/src/docs/DesignSystem.md`

Contenido:
- Principios de diseño
- Tokens y sus usos
- Componentes disponibles
- Ejemplos de código
- Do's and Don'ts

### 4.2 Checklist de Consistencia (1-2 horas)

**Archivo:** `/frontend/src/docs/ConsistencyChecklist.md`

- [ ] Usa PageHeader para título de página
- [ ] Usa StatCard para métricas
- [ ] Usa DataTable para tablas de datos
- [ ] Usa spacing tokens (no valores hardcodeados)
- [ ] Usa elevation tokens
- [ ] Implementa EmptyState
- [ ] Implementa LoadingState
- [ ] Usa FormDialog/ConfirmDialog para modales

### 4.3 Storybook Setup (Opcional - 2 horas extra)

Configurar Storybook para documentación visual interactiva de componentes.

---

## Checklist de Implementación

### Fase 1: Foundation
- [ ] Crear `/frontend/src/theme/` directorio
- [ ] Crear `designTokens.ts`
- [ ] Crear `hospitalTheme.ts`
- [ ] Crear `layoutConstants.ts`
- [ ] Crear `semanticColors.ts`
- [ ] Actualizar `App.tsx` para usar nuevo tema
- [ ] Verificar que no hay regresiones visuales

### Fase 2: Componentes
- [ ] Crear `StatCard.tsx`
- [ ] Crear tests para StatCard
- [ ] Migrar MetricCard → StatCard
- [ ] Migrar BillingStatsCards → StatCard
- [ ] Migrar CPCStatsCards → StatCard
- [ ] Migrar POSStatsCards → StatCard
- [ ] Crear `PageHeader.tsx`
- [ ] Crear `DataTable.tsx`
- [ ] Crear `FormDialog.tsx`
- [ ] Crear `ConfirmDialog.tsx`
- [ ] Crear `EmptyState.tsx`

### Fase 3: Páginas
- [ ] Dashboard - Aplicar PageHeader
- [ ] Patients - Aplicar PageHeader
- [ ] Hospitalization - Aplicar PageHeader
- [ ] POS - Aplicar PageHeader
- [ ] CuentasPorCobrar - Aplicar PageHeader
- [ ] Inventory - Aplicar PageHeader
- [ ] Billing - Aplicar PageHeader
- [ ] Rooms - Aplicar PageHeader
- [ ] Offices - Aplicar PageHeader
- [ ] Employees - Aplicar PageHeader
- [ ] Quirofanos - Aplicar PageHeader
- [ ] Users - Aplicar PageHeader
- [ ] Reports - Aplicar PageHeader
- [ ] Audit - Aplicar PageHeader

### Fase 4: Documentación
- [ ] Crear DesignSystem.md
- [ ] Crear ConsistencyChecklist.md
- [ ] Actualizar CLAUDE.md con referencias

---

## Métricas de Éxito

### Cuantitativas
- **Reducción de código duplicado:** -60% en componentes de stats
- **Componentes unificados:** 4 → 1 (StatCard)
- **Páginas con PageHeader estándar:** 0 → 14 (100%)
- **Design tokens documentados:** 0 → 25+

### Cualitativas
- Usuario percibe consistencia visual entre módulos
- Desarrolladores usan componentes estandarizados
- Nuevos módulos siguen el design system automáticamente

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regresiones visuales | Media | Alto | Tests visuales, revisión por página |
| Tiempo excedido | Media | Medio | Implementar por fases, quick wins primero |
| Resistencia al cambio | Baja | Bajo | Documentación clara, beneficios evidentes |

---

## Próximos Pasos Inmediatos

1. **Aprobar plan** - Revisar y aprobar este documento
2. **Crear rama** - `feature/ui-ux-unification`
3. **Fase 1 primero** - Establecer fundamentos antes de componentes
4. **Validación continua** - Revisar cada fase antes de avanzar

---

*Plan creado para el Sistema de Gestión Hospitalaria*
*AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial*
