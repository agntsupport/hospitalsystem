# DEUDA TÉCNICA DEL SISTEMA
**Sistema de Gestión Hospitalaria Integral**
**Fecha:** 6 de noviembre de 2025
**Analista:** Claude Code

---

## 🎯 RESUMEN EJECUTIVO

Este documento registra la deuda técnica identificada en el sistema, incluyendo:
- Funcionalidades faltantes de los flujos de trabajo críticos
- Mejoras de calidad de código
- Optimizaciones pendientes
- Bugs conocidos

**Estado General:** 7.7/10 → Objetivo: 9.2/10

---

## 📋 CATEGORÍAS DE DEUDA TÉCNICA

### P0 - CRÍTICO (Bloqueadores para Producción)
Debe resolverse ANTES de deployment a producción.

### P1 - ALTO (Afecta funcionalidad importante)
Debe resolverse en las próximas 2-4 semanas.

### P2 - MEDIO (Mejoras de calidad)
Puede resolverse en backlog normal (1-3 meses).

### P3 - BAJO (Optimizaciones)
Nice-to-have, sin timeline definido.

---

## 🚨 P0 - CRÍTICO

### 1. Tests Backend Fallando (49% pass rate)
**Estado:** ❌ ACTIVO
**Prioridad:** P0
**Módulo:** Testing Backend
**Descubierto:** 6 de noviembre de 2025

**Descripción:**
- **Reportado:** "415 tests (100% passing, 19/19 suites)"
- **Realidad:** 220/449 tests passing (49% pass rate), 7/19 suites passing
- **221 tests FALLANDO**

**Impacto:**
- Sistema NO puede ir a producción
- Calidad del código sin validar
- Riesgo alto de regresiones

**Causa Raíz:**
- Connection pool exhausted (Prisma)
- Singleton pattern no funciona correctamente en tests
- Foreign key violations en cleanup

**Solución:**
Refactorizar `backend/tests/setupTests.js` con:
- Singleton global robusto
- Cleanup ordenado por foreign keys
- globalTeardown garantizado

**Archivos afectados:**
- `backend/tests/setupTests.js`
- `backend/tests/globalTeardown.js`
- `backend/jest.config.js`

**Estimación:** 4-6 horas
**Asignado a:** Fase 1, Tarea 1.1
**Fecha objetivo:** 8 de noviembre de 2025

---

### 2. Tabla de Ocupación en Tiempo Real - NO IMPLEMENTADA
**Estado:** ❌ FALTANTE
**Prioridad:** P0
**Módulo:** Dashboard
**Requerimiento:** Flujo Adicional - FLUJOS_TRABAJO_CRITICOS.md

**Descripción:**
TODOS los roles deben tener en su dashboard una tabla mostrando ocupación en tiempo real de:
- 🏥 Consultorio General
- 🛏️ Habitaciones
- 🏥 Quirófanos

**Componentes faltantes:**
- ❌ Endpoint `GET /api/dashboard/ocupacion` NO existe
- ❌ Componente `frontend/src/components/dashboard/OcupacionTable.tsx` NO existe
- ❌ Servicio `frontend/src/services/ocupacionService.ts` NO existe
- ❌ Integración en dashboards de roles NO existe

**Impacto:**
- Requerimiento fundamental del sistema NO cumplido
- Personal del hospital NO puede ver ocupación en tiempo real
- Flujo operativo crítico afectado

**Solución:**
1. Crear endpoint backend `GET /api/dashboard/ocupacion`
2. Crear componente frontend `OcupacionTable.tsx`
3. Implementar polling cada 30 segundos
4. Integrar en dashboard de TODOS los roles

**Estimación:** 2-3 días
**Asignado a:** Fase 1 (nueva tarea)
**Fecha objetivo:** 10 de noviembre de 2025

---

### 3. Modelos ServicioHabitacion y ServicioQuirofano - NO EXISTEN EN SCHEMA
**Estado:** ⚠️ IMPLEMENTACIÓN PARCIAL
**Prioridad:** P0
**Módulo:** Base de Datos + Hospitalización
**Requerimiento:** Flujos 1.5 y 1.6 - FLUJOS_TRABAJO_CRITICOS.md

**Descripción:**
Los modelos `ServicioHabitacion` y `ServicioQuirofano` NO aparecen en `prisma/schema.prisma`, pero hay evidencia de implementación parcial en código.

**Evidencia encontrada:**
- ✅ Función `generarCargosHabitacion()` existe en hospitalization.routes.js:360-366
- ❌ Modelo `ServicioHabitacion` NO encontrado en schema
- ❌ Modelo `ServicioQuirofano` NO encontrado en schema

**Impacto:**
- Cargos automáticos de habitaciones podrían NO persistirse correctamente
- Cargos automáticos de quirófanos probablemente NO funcionan
- Trazabilidad de cargos afectada

**Solución:**
1. Verificar si modelos existen con otro nombre
2. Si NO existen, agregar a schema.prisma:
```prisma
model ServicioHabitacion {
  id                  Int      @id @default(autoincrement())
  hospitalizacionId   Int      @map("hospitalizacion_id")
  habitacionId        Int      @map("habitacion_id")
  precioHabitacion    Decimal  @map("precio_habitacion") @db.Decimal(8, 2)
  fecha               DateTime
  createdAt           DateTime @default(now()) @map("created_at")

  // Relaciones
  hospitalizacion Hospitalizacion @relation(fields: [hospitalizacionId], references: [id])
  habitacion      Habitacion      @relation(fields: [habitacionId], references: [id])

  @@map("servicios_habitacion")
}

model ServicioQuirofano {
  id              Int      @id @default(autoincrement())
  cirugiaId       Int      @map("cirugia_id")
  quirofanoId     Int      @map("quirofano_id")
  precioQuirofano Decimal  @map("precio_quirofano") @db.Decimal(8, 2)
  duracion        Int      // minutos
  fecha           DateTime
  createdAt       DateTime @default(now()) @map("created_at")

  // Relaciones
  cirugia   CirugiaQuirofano @relation(fields: [cirugiaId], references: [id])
  quirofano Quirofano        @relation(fields: [quirofanoId], references: [id])

  @@map("servicios_quirofano")
}
```
3. Ejecutar migración
4. Validar que cargos automáticos funcionan

**Estimación:** 3-4 horas
**Asignado a:** Fase 1, Tarea 1.4-1.5
**Fecha objetivo:** 9 de noviembre de 2025

---

### 4. Validación: Consultorio General NO Genera Cargos
**Estado:** ⚠️ POR VERIFICAR
**Prioridad:** P0
**Módulo:** Hospitalización
**Requerimiento:** Flujo 1.4 - FLUJOS_TRABAJO_CRITICOS.md

**Descripción:**
Según especificación, el Consultorio General **NO debe generar cargos** por habitación (a diferencia de habitaciones estándar/premium).

**Regla de Negocio:**
- Consultorio General: **COSTO $0.00** por día
- Habitaciones estándar/premium: **Cargo automático diario**

**Verificación requerida:**
```javascript
// En generarCargosHabitacion() debe existir:
const habitacion = await prisma.habitacion.findUnique({ where: { id: habitacionId } });

if (habitacion.tipo === 'consultorio_general') {
  return; // NO generar cargo
}

// Solo generar cargo si NO es consultorio general
await prisma.transaccionCuenta.create({
  data: {
    // ... cargo de habitación
  }
});
```

**Archivos a revisar:**
- `backend/routes/hospitalization.routes.js` (función `generarCargosHabitacion`)
- `backend/prisma/schema.prisma` (campo `tipo` en modelo `Habitacion`)

**Impacto:**
Si NO está implementado correctamente:
- Consultorio General podría cobrar cuando NO debe
- Pacientes cobrados incorrectamente
- Conflicto con flujo de trabajo especificado

**Solución:**
1. Verificar código de `generarCargosHabitacion()`
2. Agregar validación si falta
3. Crear test unitario específico

**Estimación:** 1-2 horas
**Asignado a:** Fase 1, Tarea 1.4
**Fecha objetivo:** 9 de noviembre de 2025

---

## ⚠️ P1 - ALTO

### 5. Documentación ABOUTME Inconsistente
**Estado:** ❌ FALTANTE
**Prioridad:** P1
**Módulo:** Documentación Inline

**Descripción:**
- **Backend:** 0/16 rutas con comentarios ABOUTME
- **Frontend:** 2/16 servicios con comentarios ABOUTME

**Impacto:**
- Mantenibilidad reducida (-20%)
- Onboarding de desarrolladores más lento
- Código difícil de entender

**Solución:**
Agregar comentarios ABOUTME al inicio de todos los archivos siguiendo formato:
```javascript
// ABOUTME: [Descripción breve de qué hace el archivo en 1-2 líneas]
```

**Estimación:** 2 días (32 archivos)
**Asignado a:** Fase 2, Tarea 2.1
**Fecha objetivo:** 15 de noviembre de 2025

---

### 6. Logs Sin Rotación (3.3MB combined.log)
**Estado:** ❌ ACTIVO
**Prioridad:** P1
**Módulo:** Logging

**Descripción:**
- `backend/logs/combined.log`: 3.3 MB
- `backend/logs/error.log`: 1.3 MB
- Sin rotación automática

**Impacto:**
- Uso de disco creciente
- Logs difíciles de analizar
- Performance de logging afectada

**Solución:**
Implementar `winston-daily-rotate-file`:
- Rotación diaria o cada 20MB
- Retención: 14 días logs generales, 30 días logs de error
- Compresión automática de archivos antiguos

**Estimación:** 1 día
**Asignado a:** Fase 2, Tarea 2.3
**Fecha objetivo:** 18 de noviembre de 2025

---

### 7. Bundle Size Grande (8.7 MB)
**Estado:** ❌ ACTIVO
**Prioridad:** P1
**Módulo:** Frontend Build

**Descripción:**
- Bundle total: 8.7 MB
- Objetivo: <5 MB
- Afecta tiempo de carga inicial

**Impacto:**
- Performance reducida (-10%)
- Experiencia de usuario afectada en conexiones lentas

**Solución:**
- Analizar con `rollup-plugin-visualizer`
- Lazy loading adicional (charts, dialogs)
- Manual chunks más granulares
- Tree shaking optimizado
- Eliminar `console.log` en producción

**Estimación:** 1 semana
**Asignado a:** Fase 2, Tarea 2.4
**Fecha objetivo:** 22 de noviembre de 2025

---

### 8. Validadores de Negocio Faltantes
**Estado:** ❌ FALTANTE (1/8 módulos)
**Prioridad:** P1
**Módulo:** Backend Middleware

**Descripción:**
Solo 1 archivo de validadores existe:
- ✅ `inventory.validators.js` (único)
- ❌ `patients.validators.js` (falta)
- ❌ `employees.validators.js` (falta)
- ❌ `hospitalization.validators.js` (falta)
- ❌ `quirofanos.validators.js` (falta)
- ❌ `billing.validators.js` (falta)
- ❌ `pos.validators.js` (falta)
- ❌ `rooms.validators.js` (falta)

**Impacto:**
- Validaciones inconsistentes entre módulos
- Seguridad reducida (-15%)
- Datos inválidos podrían entrar al sistema

**Solución:**
Crear 7 archivos de validadores usando `express-validator` con formato consistente.

**Estimación:** 1 semana (7 archivos)
**Asignado a:** Fase 2, Tarea 2.2
**Fecha objetivo:** 20 de noviembre de 2025

---

### 9. Endpoint de Ocupación - Backend
**Estado:** ❌ FALTANTE
**Prioridad:** P1
**Módulo:** API Routes
**Relacionado con:** Gap #2 (Tabla de Ocupación)

**Descripción:**
Crear endpoint `GET /api/dashboard/ocupacion` que retorne:
```json
{
  "consultorioGeneral": { "total": 1, "ocupados": 1, "detalle": [...] },
  "habitaciones": { "total": 20, "ocupadas": 15, "detalle": [...] },
  "quirofanos": { "total": 5, "ocupados": 2, "detalle": [...] }
}
```

**Impacto:**
Sin este endpoint, la tabla de ocupación NO puede funcionar.

**Solución:**
1. Crear `backend/routes/dashboard.routes.js`
2. Implementar lógica de consulta a BD
3. Agregar tests unitarios
4. Documentar en Swagger

**Estimación:** 1 día
**Asignado a:** Fase 1 (nueva tarea)
**Fecha objetivo:** 10 de noviembre de 2025

---

## 📊 P2 - MEDIO

### 10. Coverage Frontend Baja (8.5%)
**Estado:** ⚠️ ACTIVO
**Prioridad:** P2
**Módulo:** Testing Frontend

**Descripción:**
- Coverage actual: 8.5%
- Objetivo: 20%+
- Muchos componentes sin tests

**Impacto:**
- Calidad de código frontend sin validar completamente
- Riesgo medio de regresiones

**Solución:**
Agregar tests para componentes prioritarios:
- PatientFormDialog
- EmployeeFormDialog
- RoomFormDialog
- ProductFormDialog
- InvoiceFormDialog

**Estimación:** 2 semanas
**Asignado a:** Fase 3, Tarea 3.1
**Fecha objetivo:** 30 de noviembre de 2025

---

### 11. Swagger Documentation Incompleta
**Estado:** ⚠️ PARCIAL
**Prioridad:** P2
**Módulo:** API Documentation

**Descripción:**
No todos los 136 endpoints tienen documentación Swagger completa.

**Impacto:**
- Documentación API incompleta
- Integración de terceros dificultada

**Solución:**
Agregar JSDoc/Swagger annotations a todos los endpoints.

**Estimación:** 1 semana
**Asignado a:** Fase 3, Tarea 3.3
**Fecha objetivo:** 2 de diciembre de 2025

---

### 12. E2E Tests - Flows Adicionales
**Estado:** ⚠️ MEJORABLE
**Prioridad:** P2
**Módulo:** Testing E2E

**Descripción:**
51 tests E2E actuales, pero faltan flows completos:
- Inventory full flow (productos + proveedores + movimientos)
- Billing full flow (factura + pago + reporte)
- Employee management (CRUD + schedule + roles)

**Impacto:**
- Flows críticos sin validación E2E
- Riesgo medio de bugs en integraciones

**Solución:**
Agregar 3 specs Playwright nuevos.

**Estimación:** 1 semana
**Asignado a:** Fase 3, Tarea 3.2
**Fecha objetivo:** 28 de noviembre de 2025

---

### 13. Directorios Vacíos en .claude/
**Estado:** ⚠️ LIMPIEZA
**Prioridad:** P2
**Módulo:** Estructura de Proyecto

**Descripción:**
- `.claude/doc/` solo contiene `.DS_Store`
- `.claude/sessions/` solo contiene `.DS_Store`

**Impacto:**
- Confusión en estructura de proyecto
- Archivos innecesarios en repositorio

**Solución:**
- Eliminar `.DS_Store`
- Agregar `.gitkeep` o documentación en directorios
- Actualizar `.gitignore`

**Estimación:** 1 hora
**Asignado a:** Fase 1, Tarea 1.7
**Fecha objetivo:** 9 de noviembre de 2025

---

## 📝 P3 - BAJO

### 14. Health Checks Avanzados
**Estado:** ⚠️ BÁSICO
**Prioridad:** P3
**Módulo:** Monitoring

**Descripción:**
Solo existe `/health` básico. Faltan:
- `/health/ready` (readiness probe)
- `/metrics` (Prometheus-compatible)

**Solución:**
Agregar endpoints adicionales en Fase 3.

**Estimación:** 1 día
**Asignado a:** Fase 3, Tarea 3.4
**Fecha objetivo:** 4 de diciembre de 2025

---

### 15. WebSockets para Ocupación Tiempo Real
**Estado:** 💡 FUTURO
**Prioridad:** P3
**Módulo:** Real-time Updates

**Descripción:**
Actualmente polling cada 30 segundos. Ideal: WebSockets para updates instantáneos.

**Solución:**
Implementar en roadmap futuro (post Fase 3).

**Estimación:** 2 semanas
**Fecha objetivo:** Q1 2026

---

### 16. Containerización Completa
**Estado:** ⚠️ PARCIAL
**Prioridad:** P3
**Módulo:** DevOps

**Descripción:**
Existe `docker-compose.yml` pero no optimizado para producción.

**Solución:**
Crear `docker-compose.production.yml` con:
- Multi-stage builds
- Health checks
- Resource limits
- Secrets management

**Estimación:** 1 semana
**Asignado a:** Fase 3, Tarea 3.5
**Fecha objetivo:** 6 de diciembre de 2025

---

## 📊 RESUMEN DE DEUDA TÉCNICA

### Por Prioridad
| Prioridad | Cantidad | % Total |
|-----------|----------|---------|
| P0 (Crítico) | 4 gaps | 25% |
| P1 (Alto) | 5 gaps | 31% |
| P2 (Medio) | 4 gaps | 25% |
| P3 (Bajo) | 3 gaps | 19% |
| **TOTAL** | **16 gaps** | **100%** |

### Por Módulo
| Módulo | Gaps |
|--------|------|
| Testing | 3 |
| Backend | 4 |
| Frontend | 3 |
| Documentación | 2 |
| DevOps | 2 |
| Monitoring | 2 |

### Timeline de Resolución

**Fase 1 (Semana 1-2):** 4 gaps P0 críticos
**Fase 2 (Semana 3-4):** 5 gaps P1 altos
**Fase 3 (Semana 5-6):** 4 gaps P2 medios
**Post Fase 3:** 3 gaps P3 bajos (backlog)

---

## 🔄 PROCESO DE GESTIÓN

### Agregar Nueva Deuda Técnica
```markdown
### [ID]. [Nombre del Gap]
**Estado:** ❌ ACTIVO / ⚠️ PARCIAL / ✅ RESUELTO
**Prioridad:** P0 / P1 / P2 / P3
**Módulo:** [Nombre del módulo]
**Descubierto:** [Fecha]

**Descripción:**
[Qué falta o no funciona]

**Impacto:**
[Cómo afecta al sistema]

**Solución:**
[Cómo implementarlo]

**Estimación:** [Tiempo necesario]
**Asignado a:** [Fase o persona]
**Fecha objetivo:** [Cuándo debe estar resuelto]
```

### Cerrar Deuda Técnica
Cuando se resuelve un gap:
1. Cambiar estado a ✅ RESUELTO
2. Agregar fecha de resolución
3. Agregar link a commit/PR
4. Mover a sección "Deuda Técnica Resuelta"

---

## ✅ DEUDA TÉCNICA RESUELTA

(Vacío por ahora - se irá poblando conforme se resuelvan gaps)

---

**Última actualización:** 6 de noviembre de 2025
**Próxima revisión:** 13 de noviembre de 2025 (post Fase 1)

---

*© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial. Todos los derechos reservados.*
