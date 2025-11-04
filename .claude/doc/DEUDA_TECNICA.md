# DEUDA TÉCNICA - Sistema de Gestión Hospitalaria
## Inventario Completo de TODOs y Mejoras Pendientes

**Fecha:** 4 de noviembre de 2025  
**Desarrollador:** Alfredo Manuel Reyes  
**Total TODOs:** 248 items identificados

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Cantidad | Esfuerzo Est. | Prioridad |
|-----------|----------|---------------|-----------|
| **Tests Faltantes** | 115 items | ~80h | P0 🔴 |
| **Refactoring** | 67 items | ~45h | P1 ⚠️ |
| **Documentación** | 42 items | ~12h | P2 🟡 |
| **Optimizaciones** | 24 items | ~15h | P2 🟡 |
| **TOTAL** | **248 items** | **~152h** | - |

---

## 🔴 P0 - CRÍTICO (115 items, ~80h)

### Tests Faltantes Backend (33 items, ~20h)

#### Hospitalization (+15 tests, 4h)
- [ ] Test validación habitación ocupada
- [ ] Test cargos automáticos por día  
- [ ] Test edición de ingreso activo
- [ ] Test transferencia entre habitaciones
- [ ] Test validaciones de fechas (ingreso < alta)
- [ ] Test manejo de errores en transacciones
- [ ] Test alta con cuenta pendiente
- [ ] Test alta múltiple mismo paciente
- [ ] Test anticipo insuficiente
- [ ] Test cargos duplicados prevención
- [ ] Test notas médicas sin ingreso
- [ ] Test listado con filtros complejos
- [ ] Test paginación de ingresos
- [ ] Test búsqueda por paciente
- [ ] Test estadísticas de hospitalización

#### Solicitudes (+10 tests, 2h)
- [ ] Fix test "Crear solicitud como enfermero" (failing)
- [ ] Test entrega de productos
- [ ] Test validación stock insuficiente
- [ ] Test flujo completo (SOLICITADO → PREPARANDO → ENTREGADO)
- [ ] Test cancelación de solicitudes
- [ ] Test permisos por rol (enfermero vs almacenista)
- [ ] Test solicitud sin stock disponible
- [ ] Test múltiples items en solicitud
- [ ] Test historial de solicitudes
- [ ] Test filtros y búsqueda

#### Patients (+8 tests, 1.5h)
- [ ] Test búsqueda avanzada por múltiples criterios
- [ ] Test paginación con filtros activos
- [ ] Test validación RFC/CURP duplicados
- [ ] Test actualización de contacto de emergencia
- [ ] Test historial médico completo
- [ ] Test expediente con múltiples ingresos
- [ ] Test estadísticas por edad/género
- [ ] Test exportación de datos

### Tests Faltantes Frontend (82 items, ~60h)

#### Dashboard Page (20 tests, 5h)
- [ ] Test renderizado inicial
- [ ] Test carga de estadísticas
- [ ] Test gráficos de datos
- [ ] Test filtros por fecha
- [ ] Test widgets financieros
- [ ] Test widgets operacionales
- [ ] Test actualización automática
- [ ] Test permisos por rol
- [ ] Test estados de carga
- [ ] Test manejo de errores
- [ ] Test responsive design
- [ ] Test interacción con charts
- [ ] Test drill-down de métricas
- [ ] Test exportación de reportes
- [ ] Test comparación periodos
- [ ] Test alertas y notificaciones
- [ ] Test refres manual
- [ ] Test caché de datos
- [ ] Test performance con datos grandes
- [ ] Test accesibilidad (WCAG)

#### POS Page (15 tests, 4h)
- [ ] Test creación de venta rápida
- [ ] Test búsqueda de productos
- [ ] Test aplicación de descuentos
- [ ] Test múltiples métodos de pago
- [ ] Test validación de stock
- [ ] Test impresión de ticket
- [ ] Test cambio de cliente
- [ ] Test cancelación de venta
- [ ] Test historial de ventas
- [ ] Test búsqueda de cuentas
- [ ] Test aplicación de pagos a cuenta
- [ ] Test generación de factura desde venta
- [ ] Test validación de permisos (cajero)
- [ ] Test manejo de errores de inventario
- [ ] Test performance con carrito grande

#### Billing Page (12 tests, 3h)
- [ ] Test listado de facturas
- [ ] Test creación de factura manual
- [ ] Test aplicación de pagos
- [ ] Test cuentas por cobrar
- [ ] Test filtros por estado/fecha
- [ ] Test búsqueda por paciente
- [ ] Test impresión de factura
- [ ] Test envío por email
- [ ] Test cancelación de factura
- [ ] Test estadísticas financieras
- [ ] Test reportes de cobranza
- [ ] Test validaciones CFDI

#### Hospitalization Page (15 tests, 4h)
- [ ] Test creación de ingreso
- [ ] Test selección de habitación
- [ ] Test cálculo de anticipo ($10K)
- [ ] Test alta de paciente
- [ ] Test creación de notas médicas
- [ ] Test transferencia de habitación
- [ ] Test listado de ingresos activos
- [ ] Test filtros por médico/paciente
- [ ] Test búsqueda avanzada
- [ ] Test visualización de cargos
- [ ] Test validación de habitación ocupada
- [ ] Test permisos por rol
- [ ] Test estados de carga
- [ ] Test manejo de errores
- [ ] Test responsive design

#### Employees, Rooms, Solicitudes, Users, Reports (48 tests, 12h)
- [ ] 10 tests Employees Page
- [ ] 8 tests Rooms Page
- [ ] 10 tests Solicitudes Page
- [ ] 12 tests Users Page
- [ ] 8 tests Reports Page

---

## ⚠️ P1 - ALTA (67 items, ~45h)

### Refactoring de God Components (28h)

#### EmployeesPage.tsx (778 LOC → <400 LOC, 6h)
- [ ] Extraer EmployeeFormDialog a componente separado
- [ ] Extraer EmployeeFilters a componente
- [ ] Extraer EmployeeTable a componente
- [ ] Extraer EmployeeStats a componente
- [ ] Crear custom hook useEmployees
- [ ] Mover lógica de validación a schema Yup

#### QuickSalesTab.tsx (752 LOC → <400 LOC, 6h)
- [ ] Extraer ProductSearch a componente
- [ ] Extraer ShoppingCart a componente
- [ ] Extraer PaymentDialog a componente
- [ ] Extraer CustomerSelector a componente
- [ ] Crear custom hook usePOSSale
- [ ] Optimizar re-renders con React.memo

#### SolicitudFormDialog.tsx (707 LOC → <400 LOC, 5h)
- [ ] Extraer ItemsSelector a componente
- [ ] Extraer StockValidator a componente
- [ ] Extraer FormButtons a componente
- [ ] Crear custom hook useSolicitudForm
- [ ] Simplificar validaciones Yup

#### Otros God Components (ProductFormDialog, PatientsTab, etc.) (11h)
- [ ] Refactor ProductFormDialog (698 LOC)
- [ ] Refactor PatientsTab (678 LOC)
- [ ] Refactor MedicalNotesDialog (663 LOC)
- [ ] Refactor UsersPage (652 LOC)
- [ ] Refactor RoomsPage (634 LOC)
- [ ] Refactor CirugiaFormDialog (622 LOC)
- [ ] Refactor BillingPage (611 LOC)
- [ ] Refactor ReportsPage (608 LOC)

### Optimizaciones React (8h)

#### React.memo Implementation (2h)
- [ ] Agregar React.memo a 30 componentes presentacionales
- [ ] Memoizar ProductCard
- [ ] Memoizar StatsCard
- [ ] Memoizar TableRow components
- [ ] Memoizar FormFields

#### Reselect Selectors (2h)
- [ ] Crear selectEmployeesByRole (memoizado)
- [ ] Crear selectActivePatients (memoizado)
- [ ] Crear selectAvailableRooms (memoizado)
- [ ] Crear selectInventoryStats (memoizado)
- [ ] Crear selectFinancialSummary (memoizado)

#### Redux Slices Faltantes (4h)
- [ ] Crear employeesSlice
- [ ] Crear roomsSlice
- [ ] Crear solicitudesSlice
- [ ] Crear usersSlice
- [ ] Crear reportsSlice
- [ ] Crear quirofanosSlice
- [ ] Crear hospitalizationSlice
- [ ] Crear dashboardSlice

### Backend Issues (9h)

#### PrismaClient Singleton (5min)
- [ ] Fix pos.routes.js línea 8 (usar database.js singleton)

#### Dependencias No Usadas (10min)
- [ ] Remover express-validator o implementar
- [ ] Remover joi o implementar
- [ ] Limpiar package.json

#### Tests Skipped (2h)
- [ ] Justificar o eliminar 51 tests skipped
- [ ] Resolver dependencias de tests
- [ ] Documentar razones de skip

#### TODOs en Código Backend (16 items, 3h)
- [ ] Resolver TODOs en tests (16 comentarios)
- [ ] Implementar validaciones pendientes
- [ ] Completar manejo de errores

#### Comentarios ABOUTME (4h)
- [ ] Agregar ABOUTME a 16 archivos de rutas
- [ ] Agregar ABOUTME a 3 middleware
- [ ] Agregar ABOUTME a 6 utils

---

## 🟡 P2 - MEDIA (42 items, ~12h)

### Documentación (42 items, 12h)

#### Actualizar CLAUDE.md (2h)
- [ ] Corregir calificación Testing 9.5 → 6.2
- [ ] Corregir calificación general 8.8 → 6.8
- [ ] Actualizar coverage backend 75% → 60-65%
- [ ] Corregir frontend pass rate 72% → 100%
- [ ] Actualizar tests totales 733 → 805
- [ ] Documentar métricas reales verificadas

#### Actualizar README.md (1h)
- [ ] Actualizar badges con métricas reales
- [ ] Corregir estadísticas de testing
- [ ] Actualizar roadmap con plan real
- [ ] Agregar sección de deuda técnica

#### Consolidar Docs (.claude/doc/) (2h)
- [ ] Eliminar duplicados
- [ ] Crear índice centralizado
- [ ] Estandarizar formato
- [ ] Actualizar fechas

#### Crear Documentación Faltante (7h)
- [ ] Architecture diagrams (visual)
- [ ] API documentation (Swagger completo)
- [ ] Component library (Storybook)
- [ ] Database ER diagram (actualizado)
- [ ] Deployment guide (producción)
- [ ] Contributing guide
- [ ] Code style guide

---

## 🟢 P3 - BAJA (24 items, ~15h)

### Mejoras Incrementales

#### Naming Consistency (1h)
- [ ] Resolver patients.types.ts vs patient.types.ts
- [ ] Estandarizar plural/singular en types
- [ ] Estandarizar camelCase/PascalCase

#### Barrel Exports (1h)
- [ ] Crear frontend/src/services/index.ts
- [ ] Crear frontend/src/components/index.ts
- [ ] Crear frontend/src/utils/index.ts

#### Archivos Legacy (30min)
- [ ] Eliminar o documentar test_filter.js
- [ ] Eliminar o documentar migrate-room-services.js
- [ ] Eliminar o documentar recalcular-cuentas.js

#### Features Modernos (12.5h)
- [ ] Implementar virtualization para listas largas (4h)
- [ ] Implementar useTransition (React 18) (2h)
- [ ] Implementar Dark mode toggle (3h)
- [ ] Implementar coverage reports automáticos (2h)
- [ ] Generar architecture diagrams automáticos (1.5h)

---

## 📅 ROADMAP DE RESOLUCIÓN

### Sprint 1 (Semanas 1-2): P0 Backend + Docs - 20h
- 33 tests backend nuevos
- Actualizar documentación con métricas reales
- Fix 3 issues P1 backend

### Sprint 2 (Semanas 3-4): P0 Frontend - 60h
- 82 tests frontend nuevos
- Cerrar gap de 9 páginas sin tests

### Sprint 3 (Semanas 5-6): P1 Refactoring - 45h
- Eliminar 12 God Components
- Implementar React.memo y Reselect
- Crear 8 Redux slices

### Sprint 4 (Semanas 7-8): P2-P3 Final - 27h
- Consolidar documentación
- Features modernos (virtualization, dark mode)
- Cleanup final

**Total Esfuerzo: ~152 horas (~19 días laborales)**

---

**© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial**  
**Desarrollador:** Alfredo Manuel Reyes | **Teléfono:** 443 104 7479
