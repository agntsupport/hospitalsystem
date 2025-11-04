# DEUDA TÉCNICA PRIORIZADA - SISTEMA DE GESTIÓN HOSPITALARIA

**Fecha:** 3 de Noviembre de 2025
**Versión del Sistema:** 2.0.0-stable
**Total Items:** 248 items identificados

---

## 📊 RESUMEN EJECUTIVO

| Prioridad | Items | Esfuerzo Estimado | Estado |
|-----------|-------|-------------------|--------|
| **P0 - Crítico** | 48 items | 22.5 días | 🔴 Pendiente |
| **P1 - Alto** | 87 items | 35 días | 🟡 Pendiente |
| **P2 - Medio** | 73 items | 18 días | 🟢 Opcional |
| **P3 - Bajo** | 40 items | 10 días | ⚪ Futuro |
| **TOTAL** | **248** | **85.5 días** | - |

---

## 🔴 PRIORIDAD P0 - CRÍTICO (22.5 días)

### Testing Backend - Rutas Sin Cobertura (8.5 días)

#### TB-001: Tests para pos.routes.js
- **Módulo:** POS (Punto de Venta)
- **Endpoints:** 6 endpoints sin tests
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 3 días
- **Riesgo:** 🔴 Crítico - Módulo financiero crítico
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ POST /api/pos/accounts - Crear cuenta nueva
✓ GET /api/pos/accounts - Listar cuentas
✓ GET /api/pos/accounts/:id - Detalle de cuenta
✓ POST /api/pos/accounts/:id/items - Agregar items
✓ POST /api/pos/accounts/:id/close - Cerrar cuenta
✓ GET /api/pos/history - Historial de cuentas
```

---

#### TB-002: Tests para users.routes.js
- **Módulo:** Usuarios
- **Endpoints:** 6 endpoints sin tests
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 2 días
- **Riesgo:** 🔴 Crítico - Seguridad y gestión de usuarios
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ GET /api/users - Listar usuarios
✓ POST /api/users - Crear usuario
✓ PUT /api/users/:id - Actualizar usuario
✓ DELETE /api/users/:id - Eliminar usuario (soft delete)
✓ PUT /api/users/:id/password - Cambiar contraseña
✓ GET /api/users/:id/role-history - Historial de roles
```

---

#### TB-003: Tests para audit.routes.js
- **Módulo:** Auditoría
- **Endpoints:** 3 endpoints sin tests
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Alto - Trazabilidad y cumplimiento
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ GET /api/audit - Listar operaciones auditadas
✓ GET /api/audit/user/:userId - Auditoría por usuario
✓ GET /api/audit/entity/:entity - Auditoría por entidad
```

---

#### TB-004: Mejorar coverage hospitalization.routes.js
- **Módulo:** Hospitalización
- **Coverage Actual:** 9.89%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 2 días
- **Riesgo:** 🔴 Crítico - Funcionalidad core del sistema
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Faltantes:**
```
✓ Anticipo automático $10,000 MXN
✓ Validación de habitación disponible
✓ Cargos automáticos de estancia
✓ Alta médica con validaciones
✓ Notas médicas con permisos por rol
✓ Edge cases: Alta sin notas, doble ingreso, etc.
```

---

#### TB-005: Tests para token-cleanup.js
- **Módulo:** Seguridad (JWT Blacklist)
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 80%+
- **Esfuerzo:** 0.5 días
- **Riesgo:** 🔴 Crítico - Vulnerabilidad de seguridad
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ Limpieza de tokens expirados (>24h)
✓ Preservación de tokens vigentes
✓ Manejo de errores de BD
✓ Cron job execution
```

---

### Testing Frontend - Tests Failing (3 días)

#### TF-001: Corregir 85 tests frontend failing
- **Módulo:** Frontend General
- **Tests Failing:** 85 de 312 (27.2%)
- **Pass Rate Actual:** 72.7%
- **Pass Rate Objetivo:** 100%
- **Esfuerzo:** 3 días
- **Riesgo:** 🔴 Crítico - Falsa confianza en tests
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Causas Probables:**
1. Mocks desactualizados (CirugiaFormDialog, etc)
2. Timing issues (async/await, waitFor)
3. APIs cambiadas pero tests no actualizados
4. Dependencies no mockeadas correctamente

**Acción:**
```bash
# Revisar tests failing:
cd frontend && npm test 2>&1 | grep FAIL

# Actualizar mocks para cada componente failing
# Configurar MSW para API mocking consistente
```

---

### Testing Frontend - Redux y Hooks (3 días)

#### TF-002: Tests para authSlice.ts
- **Módulo:** Redux - Autenticación
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 80%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Crítico - State management de seguridad
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ Login action + reducer
✓ Logout action + reducer
✓ Token refresh
✓ User profile update
✓ Error handling
```

---

#### TF-003: Tests para patientsSlice.ts
- **Módulo:** Redux - Pacientes
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 80%+
- **Esfuerzo:** 0.5 días
- **Riesgo:** 🟡 Alto
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

---

#### TF-004: Tests para uiSlice.ts
- **Módulo:** Redux - UI State
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 80%+
- **Esfuerzo:** 0.5 días
- **Riesgo:** 🟡 Alto
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

---

#### TF-005: Tests para useAuth hook
- **Módulo:** Hooks - Autenticación
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 90%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Crítico - Hook de seguridad crítico
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Tests Necesarios:**
```
✓ Login flow completo
✓ Logout y limpieza de estado
✓ Token refresh automático
✓ Manejo de errores 401
✓ Persistencia de sesión
```

---

### Testing Frontend - Servicios Críticos (3 días)

#### TF-006: Tests para posService.ts
- **Módulo:** Servicios - POS
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Crítico
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

---

#### TF-007: Tests para billingService.ts
- **Módulo:** Servicios - Facturación
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Crítico
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

---

#### TF-008: Tests para hospitalizationService.ts
- **Módulo:** Servicios - Hospitalización
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Riesgo:** 🔴 Crítico
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

---

### CI/CD Crítico (0.5 días)

#### CD-001: Ajustar threshold de coverage
- **Problema:** CI/CD threshold 70% vs coverage real 39%
- **Impacto:** Builds failing constantemente
- **Esfuerzo:** 0.5 días
- **Riesgo:** 🔴 Alto - CI/CD inútil si siempre falla
- **Asignado a:** -
- **Estado:** ⬜ Pendiente

**Acción:**
```yaml
# .github/workflows/ci.yml
- name: Coverage threshold check
  run: |
    # Cambiar de 70% a 40% temporalmente
    npm test -- --coverage --coverageThreshold='{"global":{"lines":40}}'
```

**Roadmap Threshold:**
- Actual: 40% (inmediato)
- 1 mes: 50%
- 2 meses: 60%
- 3 meses: 70%

---

## 🟡 PRIORIDAD P1 - ALTO (35 días)

### Testing Backend - Cobertura Parcial (7 días)

#### TB-006: Completar coverage inventory.routes.js
- **Coverage Actual:** 48.93%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 2 días
- **Estado:** ⬜ Pendiente

---

#### TB-007: Completar coverage quirofanos.routes.js
- **Coverage Actual:** 59.60%
- **Coverage Objetivo:** 75%+
- **Esfuerzo:** 1.5 días
- **Estado:** ⬜ Pendiente

---

#### TB-008: Completar coverage reports.routes.js
- **Coverage Actual:** 40.00%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### TB-009: Tests para offices.routes.js
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1.5 días
- **Estado:** ⬜ Pendiente

---

#### TB-010: Tests para notificaciones.routes.js
- **Coverage Actual:** 0%
- **Coverage Objetivo:** 70%+
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Testing Frontend - Páginas (5 días)

#### TF-009: Tests para POSPage.tsx
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### TF-010: Tests para BillingPage.tsx
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### TF-011: Tests para HospitalizationPage.tsx
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### TF-012: Tests para ReportsPage.tsx
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### TF-013: Tests para SolicitudesPage.tsx
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### TF-014: Tests para RoomsPage.tsx
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### TF-015: Tests para UsersPage.tsx
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

### E2E Testing Expansion (3 días)

#### E2E-001: Tests E2E Inventario
- **Tests:** 10 casos
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Flujos:**
```
✓ Listar productos
✓ Crear producto nuevo
✓ Editar producto
✓ Movimiento de entrada
✓ Movimiento de salida
✓ Alertas de stock bajo
✓ Búsqueda de productos
✓ Filtros por categoría
✓ Proveedores CRUD
✓ Deducción automática desde POS
```

---

#### E2E-002: Tests E2E Quirófanos
- **Tests:** 10 casos
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### E2E-003: Tests E2E Facturación
- **Tests:** 9 casos
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Performance Optimization (4 días)

#### PERF-001: Implementar React.memo en componentes de lista
- **Componentes:** 15+ identificados
- **Impacto:** +10-15% performance
- **Esfuerzo:** 2 días
- **Estado:** ⬜ Pendiente

**Componentes Objetivo:**
```
✓ DataGrid row components
✓ Lista de pacientes
✓ Lista de empleados
✓ Items del carrito POS
✓ Historial de cuentas
✓ Lista de quirófanos
✓ Lista de habitaciones
✓ Productos en inventario
✓ Notificaciones panel
✓ Solicitudes lista
✓ Cargos en factura
✓ Reportes tabla
✓ Auditoría logs
✓ Médicos dropdown
✓ Enfermeros dropdown
```

---

#### PERF-002: Incrementar uso de useMemo
- **Ubicaciones:** 15+ identificadas
- **Impacto:** Cálculos optimizados
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Ubicaciones Objetivo:**
```
✓ Filtrado de pacientes (PatientsPage)
✓ Cálculo de totales (POSPage, BillingPage)
✓ Transformación de datos (ReportsPage)
✓ Búsqueda filtrada (usePatientSearch)
✓ Formato de moneda (múltiples componentes)
✓ Agregaciones de inventario
✓ Estadísticas de quirófanos
✓ Cuentas por cobrar
✓ Disponibilidad de habitaciones
✓ Validaciones complejas
✓ Mapeo de roles a permisos
✓ Filtros de auditoría
✓ Ordenamiento de tablas
✓ Paginación calculada
✓ Resúmenes ejecutivos
```

---

#### PERF-003: Tests de performance
- **Herramientas:** React DevTools Profiler, Lighthouse
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Refactoring Frontend (6 días)

#### REF-001: Refactorizar HospitalizationPage.tsx
- **LOC Actual:** 800
- **LOC Objetivo:** <400 (dividido en 3 componentes)
- **Esfuerzo:** 1.5 días
- **Estado:** ⬜ Pendiente

**División Propuesta:**
```
HospitalizationPage.tsx (200 LOC)
├── AdmissionsTab.tsx (250 LOC)
├── ActiveAdmissionsTab.tsx (200 LOC)
└── HistoryTab.tsx (150 LOC)
```

---

#### REF-002: Refactorizar EmployeesPage.tsx
- **LOC Actual:** 778
- **LOC Objetivo:** <400
- **Esfuerzo:** 1.5 días
- **Estado:** ⬜ Pendiente

---

#### REF-003: Refactorizar SolicitudFormDialog.tsx
- **LOC Actual:** 707
- **LOC Objetivo:** <500
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### REF-004: Refactorizar OfficesTab + RoomsTab
- **LOC Actual:** 636 + 614 = 1,250
- **LOC Objetivo:** <800 combinados
- **Esfuerzo:** 2 días
- **Estado:** ⬜ Pendiente

---

### Servicios Frontend (2 días)

#### REF-005: Extraer datos de postalCodeService.ts
- **LOC Actual:** 22,492
- **LOC Objetivo:** <500 (datos a JSON)
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Acción:**
```
frontend/src/data/postal-codes.json (nuevo)
frontend/src/services/postalCodeService.ts (reducido a <500 LOC)
```

---

#### REF-006: Dividir reportsService.ts
- **LOC Actual:** 27,547
- **LOC Objetivo:** 3 archivos <10K LOC cada uno
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**División Propuesta:**
```
reportsService.ts →
  - financialReports.service.ts
  - operationalReports.service.ts
  - executiveReports.service.ts
```

---

### Hooks Frontend (1.5 días)

#### TF-016: Tests para useBaseFormDialog
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### TF-017: Tests para useDebounce
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### TF-018: Tests adicionales usePatientForm
- **Coverage Actual:** ~95%
- **Coverage Objetivo:** 100%
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

## 🟢 PRIORIDAD P2 - MEDIO (18 días)

### Edge Cases Backend (3 días)

#### EC-001: Tests de concurrencia POS
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Tests:**
```
✓ Cierre simultáneo de cuentas
✓ Agregar items concurrentemente
✓ Aplicar descuento durante modificación
```

---

#### EC-002: Boundary conditions formularios
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Tests:**
```
✓ Edad > 120 años
✓ Stock negativo
✓ Precios con >2 decimales
✓ Fechas en el pasado
✓ Nombres con caracteres especiales
✓ Emails edge cases
```

---

#### EC-003: Error handling exhaustivo
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

**Tests:**
```
✓ Database connection loss durante transacción
✓ JWT expiration durante petición larga
✓ Prisma timeout en queries complejas
✓ File upload failures
✓ Network errors
```

---

### Security Testing (1.5 días)

#### SEC-001: SQL Injection tests
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### SEC-002: XSS validation tests
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### SEC-003: CSRF protection tests
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

### Performance Testing (2 días)

#### PT-001: Load testing con Artillery
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### PT-002: Database query performance
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### CI/CD Improvements (2 días)

#### CD-002: npm audit check
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### CD-003: ESLint blocking
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### CD-004: Parallel test execution
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

#### CD-005: Cache optimization
- **Esfuerzo:** 0.5 días
- **Estado:** ⬜ Pendiente

---

### Coverage Reporting (2 días)

#### COV-001: Codecov integration
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### COV-002: Coverage badges + trend tracking
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Monitoring Básico (3 días)

#### MON-001: Health checks avanzados
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### MON-002: Prometheus basic metrics
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### MON-003: Log aggregation
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Backend Refactoring (4 días)

#### REF-007: Capa de servicios backend
- **Esfuerzo:** 4 días
- **Estado:** ⬜ Pendiente

**Estructura Propuesta:**
```
backend/services/
├── hospitalization.service.js
├── quirofanos.service.js
├── inventory.service.js
├── pos.service.js
├── billing.service.js
└── patients.service.js
```

---

## ⚪ PRIORIDAD P3 - BAJO (10 días)

### Validators Backend (2 días)

#### VAL-001: Crear validators para todos los módulos
- **Actual:** Solo 1 archivo (inventory.validators.js)
- **Objetivo:** 14 archivos validators
- **Esfuerzo:** 2 días
- **Estado:** ⬜ Pendiente

---

### Error Handling (1 día)

#### ERR-001: Error middleware centralizado
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Documentación Inline (2 días)

#### DOC-001: JSDoc para hooks complejos
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### DOC-002: JSDoc para utilidades frontend
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Snapshot Tests (1 día)

#### SNAP-001: Snapshot tests componentes UI
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Accesibilidad (2 días)

#### A11Y-001: Auditoría WCAG 2.1 AAA
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### A11Y-002: Screen reader testing
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

### Infrastructure (2 días)

#### INF-001: Docker containerization
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

#### INF-002: Nginx proxy configuration
- **Esfuerzo:** 1 día
- **Estado:** ⬜ Pendiente

---

## 📊 TRACKING Y MÉTRICAS

### Progreso por Categoría

```
Testing Backend:     [█░░░░░░░░░] 10% (10/100 items)
Testing Frontend:    [██░░░░░░░░] 15% (15/100 items)
Performance:         [░░░░░░░░░░]  0% (0/10 items)
Refactoring:         [░░░░░░░░░░]  0% (0/15 items)
CI/CD:               [██████░░░░] 60% (3/5 items)
Security:            [████████░░] 80% (4/5 items)
Documentation:       [████████░░] 85% (17/20 items)
```

### Burndown Esperado (12 semanas)

```
Semana  P0    P1    P2    P3    Total  Acumulado
  1     10%   0%    0%    0%    5%     5%
  2     25%   0%    0%    0%    12%    17%
  3     50%   0%    0%    0%    25%    42%
  4     100%  0%    0%    0%    48%    90%
  5     100%  15%   0%    0%    58%    148%
  6     100%  35%   0%    0%    68%    216%
  7     100%  50%   0%    0%    75%    291%
  8     100%  70%   0%    0%    85%    376%
  9     100%  85%   10%   0%    91%    467%
  10    100%  100%  30%   0%    96%    563%
  11    100%  100%  60%   0%    98%    661%
  12    100%  100%  100%  20%   100%   761%
```

---

## 🎯 OBJETIVOS POR SPRINT

### Sprint 1 (Semanas 1-2): Backend P0
- ✅ 100% rutas críticas con tests
- ✅ Coverage 39% → 55%
- ✅ 0 tests failing backend

### Sprint 2 (Semanas 3-4): Frontend P0
- ✅ 100% pass rate frontend
- ✅ Redux slices 80% coverage
- ✅ Hooks críticos 100% coverage

### Sprint 3 (Semana 5): Performance
- ✅ React.memo en 15+ componentes
- ✅ useMemo en 15+ ubicaciones
- ✅ +10-15% performance medido

### Sprint 4 (Semana 6): Refactoring
- ✅ 5 componentes >600 LOC refactorizados
- ✅ 2 servicios divididos
- ✅ Mantenibilidad +15%

### Sprint 5-6 (Semanas 7-8): Expansion P1
- ✅ Backend coverage 70%
- ✅ Frontend coverage 50%
- ✅ E2E 80 tests

### Sprint 7 (Semana 9): Edge Cases P2
- ✅ 20+ edge cases
- ✅ Security tests

### Sprint 8 (Semana 10): CI/CD P2
- ✅ CI/CD optimizado
- ✅ Coverage reporting

---

## 📝 NOTAS DE ACTUALIZACIÓN

**Última actualización:** 3 de Noviembre de 2025
**Próxima revisión:** Cada viernes de sprint
**Responsable:** Alfredo Manuel Reyes

**Changelog:**
- 2025-11-03: Creación inicial del documento con 248 items identificados

---

© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
