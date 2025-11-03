# Action Plan - Frontend Improvements
**Sistema de Gestión Hospitalaria Integral**

**Fecha:** 3 de noviembre de 2025
**Timeline:** 4-6 meses (10-12 semanas implementación P0-P1)

---

## Phase 1: Foundation (Weeks 1-3)

### Week 1: Redux Expansion - Core Slices

**Objetivo:** Crear slices críticos para state management

#### Tasks:
1. **inventorySlice.ts** (2 días)
   - Estado: productos, proveedores, movimientos, stats
   - Thunks: fetchProducts, createProduct, updateStock
   - Selectors: selectAllProducts, selectLowStockItems

2. **posSlice.ts** (2 días)
   - Estado: cuentas abiertas, transacciones, stats
   - Thunks: fetchOpenAccounts, createAccount, closeAccount
   - Selectors: selectOpenAccounts, selectAccountById

3. **billingSlice.ts** (1 día)
   - Estado: facturas, pagos, cuentas por cobrar
   - Thunks: fetchInvoices, createInvoice, processPayment
   - Selectors: selectPendingInvoices

**Deliverables:**
- 3 nuevos slices con tests (80% coverage)
- Documentación de API en cada slice
- Migración de 3 páginas principales a Redux

---

### Week 2: Redux Expansion - Additional Slices

**Objetivo:** Completar state management de módulos restantes

#### Tasks:
1. **roomsSlice.ts** (1 día)
   - Estado: habitaciones, consultorios, ocupación
   - Thunks: fetchRooms, updateRoomStatus

2. **employeesSlice.ts** (1 día)
   - Estado: empleados, médicos, enfermeros, schedule
   - Thunks: fetchEmployees, updateSchedule

3. **hospitalizationSlice.ts** (1 día)
   - Estado: ingresos, altas, notas médicas
   - Thunks: fetchAdmissions, createDischarge

4. **quirofanosSlice.ts** (1 día)
   - Estado: quirófanos, cirugías programadas
   - Thunks: fetchQuirofanos, scheduleSurgery

5. **Refactoring de páginas para usar nuevos slices** (1 día)

**Deliverables:**
- 4 nuevos slices adicionales
- 7 páginas migradas a Redux
- Coverage Redux: 17% → 80%

---

### Week 3: RTK Query Implementation

**Objetivo:** Implementar RTK Query para caching automático

#### Tasks:
1. **Configurar hospitalApi** (1 día)
```typescript
// services/hospitalApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const hospitalApi = createApi({
  reducerPath: 'hospitalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['Patient', 'Invoice', 'Product', 'Room', 'Employee'],
  endpoints: (builder) => ({
    // Endpoints aquí
  })
});
```

2. **Migrar servicios críticos** (3 días)
   - patientsService → hospitalApi.useGetPatientsQuery
   - inventoryService → hospitalApi.useGetProductsQuery
   - billingService → hospitalApi.useGetInvoicesQuery
   - posService → hospitalApi.useGetAccountsQuery

3. **Implementar cache invalidation** (1 día)
   - Tags para cada entidad
   - providesTags y invalidatesTags correctos

**Deliverables:**
- RTK Query configurado y funcionando
- 4 servicios migrados con caching
- Reducción de 70% en código boilerplate
- Tests de endpoints (coverage 70%)

---

## Phase 2: Quality & Testing (Weeks 4-6)

### Week 4: Service Layer Testing

**Objetivo:** Elevar coverage de servicios de 2% a 70%

#### Tasks:
1. **Tests de servicios críticos** (3 días)
   - patientsService.test.ts (50+ tests)
   - inventoryService.test.ts (40+ tests)
   - billingService.test.ts (40+ tests)
   - posService.test.ts (40+ tests)

2. **Tests de Redux slices** (2 días)
   - authSlice.test.ts (mejora de 16% a 80%)
   - patientsSlice.test.ts (mejora de 16% a 80%)
   - Todos los nuevos slices (80% coverage)

**Deliverables:**
- Coverage servicios: 2.16% → 70%
- Coverage slices: 17.16% → 80%
- 200+ nuevos tests

---

### Week 5: TypeScript Strictness

**Objetivo:** Eliminar 169 `any` y habilitar strict mode

#### Tasks:
1. **Definir tipos de error estrictos** (1 día)
```typescript
// types/api.types.ts
export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };
```

2. **Eliminar `any` en servicios** (2 días)
   - reportsService.ts (11 any → 0)
   - hospitalizationService.ts (12 any → 0)
   - quirofanosService.ts (16 any → 0)
   - billingService.ts (7 any → 0)

3. **Eliminar `any` en componentes** (1 día)
   - hooks (23 any → 0)
   - pages (45 any → 0)

4. **Habilitar strict mode** (1 día)
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

**Deliverables:**
- any: 169 → <10
- TypeScript strict mode habilitado
- 0 errores de compilación

---

### Week 6: Accessibility Foundation

**Objetivo:** Mejorar accesibilidad de 4.0/10 a 7.0/10

#### Tasks:
1. **Agregar ARIA labels a componentes críticos** (2 días)
   - Login.tsx
   - Dashboard.tsx
   - PatientsPage.tsx
   - POSPage.tsx
   - InventoryPage.tsx
   - BillingPage.tsx
   - HospitalizationPage.tsx

2. **Implementar keyboard navigation** (2 días)
   - Tab order lógico en formularios
   - Shortcuts para tabs (Ctrl+Tab)
   - Focus trap en diálogos
   - Skip links para navegación

3. **Agregar aria-live regions** (1 día)
   - Toastify con aria-live="polite"
   - Loading states con aria-busy
   - Error messages con role="alert"

**Deliverables:**
- 50+ aria-labels agregados
- Keyboard navigation en top 10 páginas
- Accessibility score: 4.0 → 7.0

---

## Phase 3: Refactoring (Weeks 7-9)

### Week 7: God Component Refactoring - Part 1

**Objetivo:** Refactorizar top 3 God Components

#### Tasks:
1. **HospitalizationPage.tsx (800 LOC → 4 componentes)** (2 días)
```
HospitalizationPage.tsx (150 LOC - container)
├── AdmissionsTab.tsx (250 LOC)
├── DischargesTab.tsx (200 LOC)
├── MedicalNotesTab.tsx (200 LOC)
└── HospitalizationStats.tsx (150 LOC)
```

2. **EmployeesPage.tsx (778 LOC → 3 componentes)** (2 días)
```
EmployeesPage.tsx (200 LOC - container)
├── EmployeesList.tsx (250 LOC)
├── EmployeeSchedule.tsx (200 LOC)
└── EmployeePermissions.tsx (150 LOC)
```

3. **Tests para nuevos componentes** (1 día)

**Deliverables:**
- 2 páginas refactorizadas (7 nuevos componentes)
- Tests para todos los componentes nuevos
- Reducción de LOC: 1,578 → 1,500 (distribuido mejor)

---

### Week 8: God Component Refactoring - Part 2

**Objetivo:** Refactorizar QuickSalesTab y ProductFormDialog

#### Tasks:
1. **QuickSalesTab.tsx (752 LOC → 4 componentes)** (2 días)
```
QuickSalesTab.tsx (200 LOC - orquestador)
├── ProductSearch.tsx (200 LOC)
├── ShoppingCart.tsx (200 LOC)
├── PaymentForm.tsx (150 LOC)
└── QuickSalesStats.tsx (100 LOC)
```

2. **ProductFormDialog.tsx (698 LOC → 3 componentes)** (2 días)
```
ProductFormDialog.tsx (150 LOC - wizard)
├── ProductBasicInfo.tsx (200 LOC)
├── ProductPricing.tsx (200 LOC)
└── ProductStock.tsx (150 LOC)
```

3. **Tests** (1 día)

**Deliverables:**
- 2 componentes refactorizados (7 nuevos componentes)
- Tests completos

---

### Week 9: Performance Optimizations

**Objetivo:** Agregar React.memo y optimizar re-renders

#### Tasks:
1. **Memoizar Stats Cards** (1 día)
   - PatientStatsCard (246 LOC)
   - InventoryStatsCard
   - POSStatsCards
   - RoomsStatsCard (251 LOC)
   - OfficesStatsCard (190 LOC)
   - QuirofanoDetailsDialog (381 LOC)

2. **Agregar useMemo a cálculos complejos** (2 días)
   - Filtrado de listas
   - Cálculos de stats
   - Transformación de datos en reportes

3. **Implementar virtualización** (2 días)
   - Integrar react-window
   - Virtualizar listas de pacientes
   - Virtualizar listas de productos

**Deliverables:**
- 6 componentes con React.memo
- 30+ useMemo agregados
- Virtualización en 3 listas grandes
- Reducción de re-renders: 30-50%

---

## Phase 4: Polish (Weeks 10-12)

### Week 10: MUI Deprecations & Consistency

**Objetivo:** Eliminar warnings y mejorar consistencia

#### Tasks:
1. **Migrar DatePicker renderInput** (1 día)
   - 11 archivos con renderInput
   - Migrar a slotProps pattern

2. **Consistencia en sx prop** (2 días)
   - Reemplazar style inline con sx
   - Aprovechar theme tokens

3. **Actualizar theme** (2 días)
   - Agregar custom palette tokens
   - High contrast mode support
   - Dark mode foundation

**Deliverables:**
- 0 deprecation warnings
- sx prop usado consistentemente
- Theme mejorado con accesibilidad

---

### Week 11: Component Testing

**Objetivo:** Completar tests de componentes principales

#### Tasks:
1. **Tests de páginas sin coverage** (3 días)
   - POSPage.test.tsx
   - InventoryPage.test.tsx
   - RoomsPage.test.tsx
   - ReportsPage.test.tsx

2. **Fijar tests fallando** (2 días)
   - 85 tests → 0 tests fallando
   - Completar mocks
   - Ajustar aserciones

**Deliverables:**
- 4 páginas con tests (60%+ coverage)
- Pass rate: 72.8% → 95%
- 85 tests fallando → 0

---

### Week 12: Documentation & Validation

**Objetivo:** Documentar y validar mejoras

#### Tasks:
1. **Documentación de componentes** (2 días)
   - JSDoc para componentes clave
   - README para cada módulo
   - Guías de uso de hooks

2. **Accessibility audit** (1 día)
   - Testear con screen readers
   - Validar keyboard navigation
   - Verificar contraste de colores

3. **Performance audit** (1 día)
   - Lighthouse scores
   - Bundle size analysis
   - Re-render profiling

4. **Final validation** (1 día)
   - E2E tests actualizados
   - Smoke tests completos
   - Documentar métricas finales

**Deliverables:**
- Documentación completa
- Accessibility score: 7.0 → 8.5
- Performance metrics documentadas
- Sistema production-ready

---

## Success Metrics

### Before vs After (6 months)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Redux Coverage | 20% | 80% | +300% |
| TypeScript `any` | 169 | <10 | -94% |
| Test Coverage | 30% | 70% | +133% |
| Test Pass Rate | 72.8% | 95% | +30% |
| God Components (>500 LOC) | 7 | 0 | -100% |
| Accessibility Score | 4.0/10 | 8.5/10 | +112% |
| Bundle Size (inicial) | 400KB | 300KB | -25% |
| useCallback | 78 | 120 | +54% |
| useMemo | 3 | 30 | +900% |
| React.memo | 0 | 15 | ∞ |

---

## Resource Requirements

### Development Team
- 1 Senior Frontend Developer (full-time, 12 weeks)
- 1 QA Engineer (part-time, weeks 4-12)
- 1 Accessibility Specialist (consulting, weeks 6, 12)

### Estimated Hours
- Phase 1: 120 hours
- Phase 2: 120 hours
- Phase 3: 120 hours
- Phase 4: 120 hours
- **Total: 480 hours**

### Risk Mitigation
- Crear feature branches por fase
- Testing continuo (no esperar al final)
- Code reviews obligatorios
- Documentar decisiones arquitectónicas
- Rollback plan para cada fase

---

## Dependencies & Blockers

### External Dependencies
- Ninguna (todas las librerías ya están instaladas)
- RTK Query: Incluido en @reduxjs/toolkit

### Internal Dependencies
- Backend debe mantener contratos API estables
- Coordinación con equipo backend para nuevos endpoints si necesario

### Potential Blockers
- God components pueden tener lógica compleja difícil de separar
- Tests fallando pueden revelar bugs reales
- TypeScript strict mode puede revelar bugs ocultos

---

## Rollback Strategy

### Per Phase
1. **Mantener branches separados** por fase
2. **Feature flags** para nuevas implementaciones
3. **Tests de regresión** antes de merge
4. **Backup de estado actual** antes de cada fase

### Emergency Rollback
- Revertir a commit anterior (cada fase es un commit)
- Restaurar slices antiguos si RTK Query falla
- Deshabilitar strict mode si bloquea desarrollo

---

## Communication Plan

### Weekly Updates
- Status report cada viernes
- Demos de features completadas
- Identificación de blockers

### Milestones
- Week 3: Redux foundation completo
- Week 6: Testing & TypeScript completo
- Week 9: Refactoring completo
- Week 12: Production ready

---

**Creado:** 3 de noviembre de 2025
**Responsable:** Frontend Architecture Team
**Próxima revisión:** Mensual durante implementación
