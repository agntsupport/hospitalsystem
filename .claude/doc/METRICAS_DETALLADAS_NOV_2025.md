# MÉTRICAS DETALLADAS - SISTEMA DE GESTIÓN HOSPITALARIA

## BACKEND - RUTAS COMPLETAS

| Archivo | LOC | Estado | Prioridad |
|---------|-----|--------|-----------|
| quirofanos.routes.js | 1,201 | Crítico - REFACTOR | Alta |
| hospitalization.routes.js | 1,096 | Crítico - REFACTOR | Alta |
| inventory.routes.js | 1,039 | Crítico - REFACTOR | Alta |
| solicitudes.routes.js | 817 | Grande - REFACTOR | Media |
| pos.routes.js | 646 | Normal | - |
| users.routes.js | 591 | Normal | - |
| patients.routes.js | 560 | Normal | - |
| billing.routes.js | 510 | Normal | - |
| employees.routes.js | 490 | Normal | - |
| reports.routes.js | 459 | Normal | - |
| offices.routes.js | 426 | Normal | - |
| rooms.routes.js | 314 | Normal | - |
| audit.routes.js | 279 | Normal | - |
| auth.routes.js | 248 | Normal | - |
| notificaciones.routes.js | 238 | Normal | - |
| **TOTAL** | **8,914** | - | - |

---

## FRONTEND - COMPONENTES >600 LOC (Requieren Refactoring)

| Componente | Archivo | LOC | Complejidad | Prioridad |
|-----------|---------|-----|-------------|-----------|
| CirugiaFormDialog Test | CirugiaFormDialog.test.tsx | 846 | Muy Alta | Media (Test) |
| Hospitalización | HospitalizationPage.tsx | 800 | Muy Alta | Alta |
| Empleados | EmployeesPage.tsx | 746 | Muy Alta | Alta |
| Solicitud Form | SolicitudFormDialog.tsx | 707 | Alta | Alta |
| Producto Form | ProductFormDialog.tsx | 698 | Alta | Alta |
| Pacientes | PatientsTab.tsx | 678 | Alta | Media |
| Notas Médicas | MedicalNotesDialog.tsx | 663 | Alta | Alta |
| Reportes Ejecutivos | ExecutiveDashboardTab.tsx | 658 | Alta | Media |
| Alta Médica | DischargeDialog.tsx | 643 | Alta | Alta |
| Empleado Form | EmployeeFormDialog.tsx | 638 | Alta | Alta |
| Producto Form Test | ProductFormDialog.test.tsx | 637 | Alta | Media (Test) |
| Proveedores | SuppliersTab.tsx | 640 | Alta | Media |
| Consultorios | OfficesTab.tsx | 636 | Alta | Media |
| Cirugías | CirugiasPage.tsx | 627 | Alta | Media |
| Hospitalización Form | AdmissionFormDialog.tsx | 620 | Alta | Alta |
| Habitaciones | RoomsTab.tsx | 614 | Normal | Media |
| Reportes Operacionales | OperationalReportsTab.tsx | 623 | Alta | Media |

**Total: 17 componentes requieren refactoring**

---

## DOCUMENTACIÓN - ARCHIVO POR ARCHIVO

### En Raíz (/Users/alfredo/agntsystemsc/)

| Archivo | LOC | Fecha | Estado |
|---------|-----|-------|--------|
| CLAUDE.md | 954 | Nov 1, 12:35 | Actualizado |
| README.md | 440 | Nov 1, 12:35 | Metrics desactualizadas |
| ACTION_PLAN_NEXT_STEPS.md | 417 | Oct 31, 15:31 | Actual |
| FASE_5_PROGRESO.md | 438 | Oct 31, 15:30 | Actual |
| TESTING_PLAN_E2E.md | 525 | Oct 29, 21:12 | OBSOLETO |
| DEUDA_TECNICA.md | 519 | Oct 31, 15:29 | Actual |
| ACTION_PLAN_2025.md | 474 | Oct 29, 22:41 | OBSOLETO (Superseded) |
| CHANGELOG.md | 258 | Oct 31, 15:29 | Actual |
| DEPLOYMENT_EASYPANEL.md | 211 | Sep 12, 10:29 | OBSOLETO |
| GUIA_CONFIGURACION_INICIAL.md | 139 | Sep 12, 10:29 | OBSOLETO |
| REFERENCIA_RAPIDA_ESTRUCTURA.txt | 827 | Oct 30, 11:59 | DUPLICADO |

**Total Raíz: 4,375 LOC en 11 archivos**

### En /docs

| Archivo | LOC | Estado |
|---------|-----|--------|
| hospital_erd_completo.md | 14,546 | Referencia importante |
| sistema_roles_permisos.md | 8,480 | Referencia importante |
| estructura_proyecto.md | 8,912 | DUPLICADO (en CLAUDE.md) |

**Total /docs: 31,938 LOC**

### En /.claude/doc (40 archivos)

**Raíz /.claude/doc/ (13 archivos):**
- TESTING_ACTION_PLAN.md (957 LOC)
- TESTING_INFRASTRUCTURE_ANALYSIS.md (897 LOC)
- QA_ACCEPTANCE_VALIDATION_REPORT_2025-10-30.md (25,453 LOC)
- QA_SUMMARY_EXECUTIVE.md (3,655 LOC)
- TESTING_EXECUTIVE_SUMMARY.md (15,380 LOC)
- Y 8 archivos adicionales

**Subdirectorio analisis_octubre_2025/ (13 archivos):**
- PLAN_ACCION_COMPLETO_NOV_2025.md (1,934 LOC)
- ESTRUCTURA_CODEBASE_COMPLETA_ANALISIS.md (1,077 LOC)
- ANALISIS_EXHAUSTIVO_ESTRUCTURA_31_OCT_2025.md (931 LOC)
- Y 10 archivos adicionales

**Subdirectorio analisis_frontend/ (8 archivos):**
- frontend_analysis.md (2,612 LOC)
- frontend.md (1,873 LOC)
- executive_summary.md (1,456 LOC)
- god_components_refactoring.md (1,240 LOC)
- Y 4 archivos adicionales

**Subdirectorio backend_analysis/ (9 archivos):**
- comprehensive_backend_analysis.md (1,994 LOC)
- ENDPOINTS_REFERENCE.md (1,613 LOC)
- backend.md (1,236 LOC)
- Y 6 archivos adicionales

**Subdirectorio backend_architecture_analysis/ (4 archivos):**
- technical_recommendations.md (2,338 LOC)
- executive_report.md (1,934 LOC)
- Y 2 archivos adicionales

**Subdirectorio analisis_sistema/ (2 archivos):**
- backend_health_report.md
- executive_summary.md

**Subdirectorio ui_ux_analysis/ (1 archivo):**
- ui_analysis.md (1,444 LOC)

**Subdirectorio obsolete_2025/ (3 archivos):**
- frontend_analysis/ (subdirectorio con 3 archivos)
- Claramente marcado como obsoleto pero NO ELIMINADO

**Total /.claude/doc: 37,333 LOC en 40+ archivos**

---

## RESUMEN DE DUPLICACIÓN

| Tipo | Original | Duplicado | Ubicación |
|------|----------|-----------|-----------|
| Estructura | CLAUDE.md | estructura_proyecto.md | /docs + /.claude/doc |
| Análisis Frontend | analisis_frontend/*.md | obsolete_2025/frontend_analysis/* | /.claude/doc |
| Análisis Backend | backend_analysis/* | backend_architecture_analysis/* | /.claude/doc |

---

## ARCHIVOS A ELIMINAR (Críticos)

```
1. ACTION_PLAN_2025.md (474 LOC)
   Motivo: Superseded by ACTION_PLAN_NEXT_STEPS.md
   Fecha: Oct 29 (Superseded Oct 31)
   Impacto: Confusión sobre plan actual

2. DEPLOYMENT_EASYPANEL.md (211 LOC)
   Motivo: Info de Septiembre, no mantenido
   Fecha: Sep 12, 2025
   Impacto: Información desactualizada

3. REFERENCIA_RAPIDA_ESTRUCTURA.txt (827 LOC)
   Motivo: Duplica CLAUDE.md, métricas OLD
   Fecha: Oct 30, 11:59
   Impacto: Redundancia, información conflictiva

Total a eliminar: 1,512 LOC
Tiempo: <30 minutos
```

---

## ARCHIVOS A ARCHIVAR (Media Prioridad)

```
1. GUIA_CONFIGURACION_INICIAL.md (139 LOC)
   Motivo: Info inicial, ahora en CLAUDE.md
   Ubicación: /.claude/doc/archived/

2. TESTING_PLAN_E2E.md (525 LOC)
   Motivo: Plan antiguo, E2E expandido en FASE 4
   Ubicación: /.claude/doc/archived/

3. /.claude/doc/obsolete_2025/ (entire directory)
   Motivo: Marcado obsoleto
   Acción: Mover completo a /.claude/doc/archived/

Total a archivar: 3,500+ LOC
Tiempo: <1 hora
```

---

## TESTS - DISTRIBUCIÓN ACTUAL

### Backend Tests (11 archivos)

| Archivo | Tests | Passing | Estado |
|---------|-------|---------|--------|
| patients.test.js | 16 | 13 | 81% |
| simple.test.js | 3 | 3 | 100% |
| auth.test.js | 10 | 10 | 100% |
| inventory.test.js | 29 | 11 | 38% |
| rooms.test.js | 15 | 15 | 100% |
| solicitudes.test.js | 13 | 13 | 100% |
| quirofanos.test.js | 78 | 68 | 87% |
| billing.test.js | 26 | ? | ? |
| reports.test.js | 20 | 5 | 25% |
| employees.test.js | 20 | 20 | 100% |
| middleware.test.js | 10 | ? | ? |
| **TOTAL** | **240** | **163** | **67.9%** |

### Frontend Tests (8 archivos)

| Archivo | Tests | Passing | Estado |
|---------|-------|---------|--------|
| patientsService.test.ts | 27 | 27 | 100% |
| patientsService.simple.test.ts | ? | ? | 100% |
| useAccountHistory.test.ts | 67 | 67 | 100% |
| usePatientSearch.test.ts | 63 | 63 | 100% |
| usePatientForm.test.ts | 50 | 50 | 100% |
| Login.test.tsx | ? | ? | ? |
| PatientsTab.test.tsx | ? | ? | ? |
| PatientsTab.simple.test.tsx | ? | ? | ? |
| ProductFormDialog.test.tsx | ? | ? | ? |
| CirugiaFormDialog.test.tsx | ? | ? | ? |
| **TOTAL** | **~88** | **57** | **64.8%** |

### E2E Tests (6 archivos)

| Archivo | Tests | Estado |
|---------|-------|--------|
| auth.spec.ts | 7 | ✅ Passing |
| patients.spec.ts | 9 | ✅ Passing |
| pos.spec.ts | 9 | ✅ Passing |
| hospitalization.spec.ts | 7 | ✅ Passing |
| item3-patient-form-validation.spec.ts | ? | ✅ Passing |
| item4-skip-links-wcag.spec.ts | ? | ✅ Passing |
| **TOTAL** | **32+** | **✅ Passing** |

---

## PRISMA SCHEMA

| Entidad | Descripción | Estado |
|---------|------------|--------|
| 37 Models | Diseño modular completo | ✅ Bien estructurado |
| 38 Indexes | Performance optimizado | ✅ Escalable a >50K registros |
| 12 Transacciones | Timeouts configurados | ✅ Deadlock prevention |
| 25+ PII/PHI Fields | Redaction implementado | ✅ HIPAA compliance |

---

## CONCLUSIÓN

**Documentación Total del Sistema: 73,646 LOC**
- Código: 46,079 LOC (backend + frontend)
- Tests: ~320 tests (380+ con E2E y hooks)
- Documentación: 73,646 LOC (DEMASIADO)

**Necesita:**
- Eliminar: 1,512 LOC (5 archivos)
- Archivar: 3,500+ LOC (4 items)
- Consolidar: 40+ archivos → 3-4 índices
- Refactoring: 21 archivos (17 componentes + 4 rutas)

**Tiempo Total: ~1 semana para limpieza completa**

