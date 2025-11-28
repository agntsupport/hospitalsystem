# Plan de Optimización UI/UX - Sistema Hospitalario

**Fecha de análisis:** 28 de noviembre de 2025
**Archivos analizados:** 62 páginas + 59 componentes + 13 tipos
**Total de inconsistencias:** 47 encontradas

---

## Resumen Ejecutivo

| Severidad | Cantidad | Impacto |
|-----------|----------|---------|
| P0 (Crítico) | 2 | Confusión en desarrollo, bugs potenciales |
| P1 (Importante) | 18 | Mantenibilidad, UX inconsistente |
| P2 (Menor) | 27 | Deuda técnica, polish visual |

---

## FASE 1: Correcciones Críticas (P0) - 4 horas

### 1.1 Consolidar AccountDetailDialog duplicados
**Problema:** Dos componentes casi idénticos causan confusión
- `AccountDetailDialog.tsx` (533 líneas) - Completo con transacciones
- `AccountDetailsDialog.tsx` (131 líneas) - Solo resumen

**Solución:**
1. Eliminar `AccountDetailsDialog.tsx`
2. Refactorizar `AccountDetailDialog.tsx` para soportar ambos modos
3. Agregar prop `mode: 'full' | 'summary'`
4. Actualizar imports en `HistoryTab.tsx`

**Archivos a modificar:**
- `/src/components/pos/AccountDetailDialog.tsx`
- `/src/components/pos/AccountDetailsDialog.tsx` (eliminar)
- `/src/components/pos/HistoryTab.tsx`

---

## FASE 2: Unificación de Tipos (P1) - 3 horas

### 2.1 Consolidar interfaces Patient
**Problema:** 2 interfaces Patient con propiedades diferentes

**Solución:**
1. Crear `/src/types/index.ts` como punto único de exportación
2. Unificar `Patient` en `patients.types.ts` (versión completa)
3. Eliminar duplicados en `patient.redux.types.ts`
4. Actualizar todos los imports

**Archivos a modificar:**
- `/src/types/patients.types.ts` (mantener como fuente única)
- `/src/types/patient.redux.types.ts` (eliminar Patient, usar re-export)
- `/src/types/index.ts` (crear)

### 2.2 Unificar constantes ROLES
**Problema:** `ROLES` y `EMPLOYEE_TYPES` son idénticos

**Solución:**
1. Mantener solo `ROLES` y `ROLE_LABELS`
2. Crear alias: `export const EMPLOYEE_TYPES = ROLES`
3. Deprecar uso directo de EMPLOYEE_TYPES

**Archivo a modificar:**
- `/src/utils/constants.ts`

---

## FASE 3: Estandarización de Error Handling (P1) - 4 horas

### 3.1 Unificar patrón de errores
**Problema:** 3 patrones diferentes (Alert, Toast, Snackbar)

**Decisión:** Usar `react-toastify` (Toast) como estándar único
- Ya tiene 78 usos vs 38 Alert vs 6 Snackbar
- Mejor UX (no intrusivo, auto-dismiss)
- Posición consistente (top-right)

**Solución:**
1. Crear hook `useNotification` centralizado
2. Reemplazar Alerts en páginas por toast
3. Eliminar Snackbar de UsersPage
4. Documentar patrón en guía de estilos

**Archivos a modificar:**
- `/src/hooks/useNotification.ts` (crear)
- `/src/pages/users/UsersPage.tsx` (Snackbar → Toast)
- 6 páginas con Alert severity="error" inline

**Patrón a implementar:**
```typescript
// useNotification.ts
export const useNotification = () => {
  const showSuccess = (msg: string) => toast.success(msg);
  const showError = (msg: string) => toast.error(msg);
  const showWarning = (msg: string) => toast.warning(msg);
  const showInfo = (msg: string) => toast.info(msg);
  return { showSuccess, showError, showWarning, showInfo };
};
```

---

## FASE 4: Estandarización de Estructura de Páginas (P1) - 6 horas

### 4.1 Crear Layout Template
**Problema:** 3 patrones diferentes de wrapper

**Solución:** Crear componente `PageLayout`

```typescript
// /src/components/layout/PageLayout.tsx
interface PageLayoutProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  actions,
  children,
  maxWidth = 'xl'
}) => (
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon}
        {title}
      </Typography>
      {actions}
    </Box>
    {children}
  </Box>
);
```

**Páginas a migrar (prioridad):**
1. `/src/pages/employees/EmployeesPage.tsx`
2. `/src/pages/patients/PatientsPage.tsx`
3. `/src/pages/inventory/InventoryPage.tsx`
4. `/src/pages/billing/BillingPage.tsx`
5. Resto de páginas (12 adicionales)

### 4.2 Estandarizar Typography
**Regla propuesta:**
- `h4` - Título principal de página
- `h5` - Título de sección dentro de página
- `h6` - Título de subsección o card
- `subtitle1` - Subtítulos descriptivos
- `body1` - Texto principal
- `body2` - Texto secundario
- `caption` - Metadata, timestamps

---

## FASE 5: Estandarización de Diálogos (P1) - 5 horas

### 5.1 Crear patrón único de estados
**Problema:** EmployeesPage tiene 14 estados vs QuirofanosPage tiene 4

**Solución:** Implementar hook `useDialogState`

```typescript
// /src/hooks/useDialogState.ts
interface DialogState<T> {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  selectedItem: T | null;
}

const useDialogState = <T>() => {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    mode: 'create',
    selectedItem: null
  });

  const openCreate = () => setState({ isOpen: true, mode: 'create', selectedItem: null });
  const openEdit = (item: T) => setState({ isOpen: true, mode: 'edit', selectedItem: item });
  const openView = (item: T) => setState({ isOpen: true, mode: 'view', selectedItem: item });
  const openDelete = (item: T) => setState({ isOpen: true, mode: 'delete', selectedItem: item });
  const close = () => setState({ ...state, isOpen: false });

  return { state, openCreate, openEdit, openView, openDelete, close };
};
```

**Páginas a refactorizar:**
1. `/src/pages/employees/EmployeesPage.tsx` (14 → 1 estado)
2. `/src/pages/patients/PatientsPage.tsx`
3. `/src/pages/hospitalization/HospitalizationPage.tsx` (9 → 1 estado)
4. `/src/pages/pos/POSPage.tsx` (8 → 1 estado)

---

## FASE 6: Consistencia Visual (P2) - 4 horas

### 6.1 Estandarizar colores de acciones
**Guía de colores:**
| Acción | Color | Variante |
|--------|-------|----------|
| Crear/Agregar | primary | contained |
| Editar | primary | outlined |
| Ver/Detalle | info | outlined |
| Eliminar | error | outlined |
| Confirmar | success | contained |
| Cancelar | inherit | text |

### 6.2 Estandarizar iconos
**Guía de iconos:**
| Acción | Icono |
|--------|-------|
| Crear | AddIcon |
| Editar | EditIcon |
| Ver | VisibilityIcon |
| Eliminar | DeleteIcon |
| Buscar | SearchIcon |
| Filtrar | FilterListIcon |
| Exportar | DownloadIcon |
| Imprimir | PrintIcon |
| Refrescar | RefreshIcon |

### 6.3 Estandarizar tablas
**Estructura obligatoria:**
```tsx
<TableContainer component={Paper} variant="outlined">
  <Table size="small">
    <TableHead>
      <TableRow>
        {/* Columnas con align según tipo */}
        <TableCell>Texto</TableCell>
        <TableCell align="right">Número</TableCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</TableContainer>
```

---

## FASE 7: Documentación y Guías (P2) - 2 horas

### 7.1 Crear guía de estilos
**Archivo:** `/src/docs/STYLE_GUIDE.md`

Contenido:
1. Estructura de páginas
2. Patrones de diálogos
3. Manejo de errores
4. Colores y temas
5. Iconografía
6. Typography
7. Tablas y listas
8. Formularios

### 7.2 Agregar ABOUTME comments faltantes
**27% de archivos sin ABOUTME (17 de 62)**

Archivos prioritarios:
- `/src/pages/billing/BillingPage.tsx`
- `/src/pages/cuentas-por-cobrar/CuentasPorCobrarPage.tsx`
- `/src/pages/dashboard/Dashboard.tsx`
- `/src/pages/employees/EmployeesPage.tsx`

---

## FASE 8: Resolución de TODOs (P2) - 1 hora

### TODOs pendientes en StockControlTab.tsx:
```typescript
// TODO: Abrir modal de detalles del producto o navegar a edición
// TODO: Implementar generación masiva de pedidos
// TODO: Implementar lógica de pedido
```

---

## Cronograma de Implementación

| Fase | Descripción | Tiempo | Prioridad |
|------|-------------|--------|-----------|
| 1 | Consolidar componentes duplicados | 4h | P0 |
| 2 | Unificar tipos | 3h | P1 |
| 3 | Estandarizar error handling | 4h | P1 |
| 4 | Estandarizar estructura páginas | 6h | P1 |
| 5 | Estandarizar diálogos | 5h | P1 |
| 6 | Consistencia visual | 4h | P2 |
| 7 | Documentación | 2h | P2 |
| 8 | Resolver TODOs | 1h | P2 |
| **TOTAL** | | **29h** | |

---

## Métricas de Éxito

### Antes de optimización:
- 47 inconsistencias documentadas
- 3 patrones de error handling
- 2 componentes duplicados
- 14 estados de diálogo en páginas complejas

### Después de optimización (objetivo):
- 0 inconsistencias P0/P1
- 1 patrón de error handling (Toast)
- 0 componentes duplicados
- 1 estado de diálogo por página (useDialogState)
- 100% de archivos con ABOUTME
- Guía de estilos documentada

---

## Archivos Nuevos a Crear

1. `/src/types/index.ts` - Exportaciones centralizadas
2. `/src/hooks/useNotification.ts` - Manejo de notificaciones
3. `/src/hooks/useDialogState.ts` - Estados de diálogos
4. `/src/components/layout/PageLayout.tsx` - Template de páginas
5. `/src/docs/STYLE_GUIDE.md` - Guía de estilos

---

## Archivos a Eliminar

1. `/src/components/pos/AccountDetailsDialog.tsx` - Duplicado
2. `/src/types/patient.redux.types.ts` - Fusionar con patients.types.ts

---

**Autor:** Claude Code
**Solicitado por:** Junta Directiva
**Estado:** Plan aprobado, pendiente implementación
