# Contexto de Sesión: Análisis Completo del Sistema
**Fecha:** 28 de noviembre de 2025
**Objetivo:** Análisis exhaustivo de estructura, coherencia, consistencia y salud del sistema

---

## 1. RESUMEN EJECUTIVO

### Estado General del Sistema: 7.8/10 (requiere atención)

El Sistema de Gestión Hospitalaria es una aplicación **empresarial robusta** pero presenta varios problemas de deuda técnica que requieren atención inmediata:

| Área | Estado | Puntuación |
|------|--------|------------|
| **Arquitectura** | Sólida y modular | 9/10 |
| **Funcionalidad** | Completa (14 módulos) | 9/10 |
| **Tests Backend** | 395/479 passing (82.5%) | 7/10 |
| **Tests Frontend** | En ejecución prolongada | ?/10 |
| **TypeScript** | 26 errores en producción | 6/10 |
| **Consistencia de Tipos** | Inconsistencias detectadas | 5/10 |
| **Documentación** | Exhaustiva pero desactualizada | 8/10 |

---

## 2. PROBLEMAS CRÍTICOS DETECTADOS

### 2.1 ERRORES TYPESCRIPT EN CÓDIGO DE PRODUCCIÓN (26 errores)

**Severidad: ALTA - Afecta build de producción**

```
1. src/types/pos.types.ts(1): import './patient.types' no existe
2. src/types/billing.types.ts(3): import './patient.types' no existe
3. src/components/pos/AccountClosureDialog.tsx(297): User.nombre/apellidos no existen
4. src/components/pos/AccountDetailDialog.tsx(140-141): Property 'totales' no existe
5. src/components/pos/NewAccountDialog.tsx(85,111): 'page' no existe en PatientFilters
6. src/components/pos/PartialPaymentDialog.tsx(76): Resolver type mismatch
7. src/components/cuentas-por-cobrar/CPCPaymentDialog.tsx(80): Resolver type mismatch
8. src/components/patients/PatientHospitalizationHistory.tsx(204): username no existe
9. src/pages/cuentas-por-cobrar/CuentasPorCobrarPage.tsx(104): resumen/distribucion
10. src/pages/hospitalization/*.tsx: pagination, habitacion possibly undefined
11. src/services/hospitalizationService.ts(110): pacienteId no existe en filtros
12. src/services/index.ts(35): Export incorrecto postalCodeService
```

**Causa raíz:**
- Archivo `patient.types.ts` referenciado pero existe como `patients.types.ts`
- Tipos desactualizados vs respuestas API reales
- Interfaces incompletas

### 2.2 TESTS BACKEND FALLANDO (76 tests, 7 suites)

**Severidad: ALTA - CI/CD bloqueado**

```
Test Suites: 7 failed, 13 passed, 20 total
Tests: 76 failed, 8 skipped, 395 passed, 479 total
```

**Problemas identificados:**
1. **Foreign key constraint violated:** `detalle_solicitud_productos_solicitud_id_fkey`
   - Cleanup de solicitudes mal ordenado
   - Primero debe eliminar detalles, luego solicitudes

2. **Open handle (TCPSERVERWRAP):** Tests de hospitalización no cierran conexiones

3. **Cleanup incorrecto:** Tests dejan datos residuales

### 2.3 INCONSISTENCIAS DE TIPOS

**Severidad: MEDIA - Causa bugs en runtime**

| Archivo | Problema |
|---------|----------|
| `pos.types.ts` | Import `patient.types` vs `patients.types` |
| `billing.types.ts` | Import `patient.types` vs `patients.types` |
| `auth.types.ts` | User sin `nombre`, `apellidos` |
| `PatientFilters` | Falta propiedad `page` |
| `HospitalizationFilters` | Falta propiedad `pacienteId` |

### 2.4 DOCUMENTACIÓN VS REALIDAD

**Severidad: MEDIA - Información incorrecta**

| CLAUDE.md dice | Realidad |
|----------------|----------|
| "TypeScript: 0 errores en producción" | 26 errores en producción |
| "Frontend: 927/940 passing (98.6%)" | Tests no terminaron en 6+ minutos |
| "Backend: 395/449 passing" | 395/479 passing (82.5%) |
| "16/19 suites passing" | 13/20 suites passing |

---

## 3. ANÁLISIS DE ARQUITECTURA

### 3.1 Fortalezas

1. **Separación clara de concerns**
   - Backend: routes/, middleware/, utils/, validators/
   - Frontend: components/, pages/, services/, types/, hooks/

2. **Stack tecnológico moderno y cohesivo**
   - React 18 + TypeScript + Material-UI 5
   - Node.js + Express + Prisma ORM
   - PostgreSQL con 40 modelos

3. **Sistema de roles granular**
   - 7 roles especializados
   - Middleware de autorización robusto

4. **Auditoría completa**
   - Trail de operaciones automático
   - Sanitización PII/PHI (HIPAA)

### 3.2 Debilidades

1. **Deuda técnica acumulada**
   - Tests no mantenidos
   - Tipos desincronizados
   - Imports rotos

2. **Inconsistencia de naming**
   - `patient.types.ts` vs `patients.types.ts`
   - Propiedades API vs tipos locales

3. **Falta de validación estricta**
   - TypeScript strict mode activado pero errores ignorados
   - Tests no bloquean merge

---

## 4. PLAN DE CORRECCIONES (Priorizado)

### FASE A: Correcciones Críticas (Bloquean producción)
**Tiempo estimado: 4-6 horas**

#### A.1 Fix imports TypeScript (30 min)
```typescript
// pos.types.ts y billing.types.ts
// Cambiar: import { Patient } from './patient.types';
// Por: import { Patient } from './patients.types';
```

#### A.2 Fix tipos User (1 hora)
```typescript
// auth.types.ts - Agregar campos faltantes
interface User {
  id: number;
  username: string;
  rol: UserRole;
  nombre?: string;      // AGREGAR
  apellidos?: string;   // AGREGAR
  activo: boolean;
  createdAt: string;
}
```

#### A.3 Fix tipos de filtros (1 hora)
```typescript
// patients.types.ts
interface PatientFilters {
  // ... existentes
  page?: number;        // AGREGAR
  limit?: number;       // AGREGAR
}

// hospitalization.types.ts
interface HospitalizationFilters {
  // ... existentes
  pacienteId?: number;  // AGREGAR
}
```

#### A.4 Fix Resolver types (1 hora)
```typescript
// CPCPaymentDialog.tsx y PartialPaymentDialog.tsx
// Problema: yupResolver<Schema> no coincide con useForm<FormValues>
// Solución: Tipar correctamente el resolver
const { handleSubmit } = useForm<CPCPaymentFormValues>({
  resolver: yupResolver(schema) as Resolver<CPCPaymentFormValues>
});
```

#### A.5 Fix exports service (15 min)
```typescript
// services/index.ts
// Cambiar: export { postalCodeService } from './postalCodeService';
// Por: export { PostalCodeService } from './postalCodeService';
```

#### A.6 Fix optional chaining (30 min)
```typescript
// DischargeDialog.tsx, MedicalNotesDialog.tsx
// Agregar ?. para admission.habitacion
admission.habitacion?.numero ?? 'Sin habitación'
```

### FASE B: Correcciones de Tests (Desbloquea CI/CD)
**Tiempo estimado: 3-4 horas**

#### B.1 Fix cleanup de solicitudes (1 hora)
```javascript
// tests/solicitudes.test.js o setupTests.js
// Orden correcto de cleanup:
async function cleanupSolicitudes() {
  await prisma.detalleSolicitudProducto.deleteMany({ where: { /* test data */ } });
  await prisma.solicitudProductos.deleteMany({ where: { /* test data */ } });
}
```

#### B.2 Fix open handles (1 hora)
```javascript
// tests/hospitalization/hospitalization.test.js
// Agregar afterAll para cerrar conexiones
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // O usar server.close() si hay server abierto
});
```

#### B.3 Actualizar tests con tipos correctos (2 horas)
- ProtectedRoute.test.tsx: Agregar campos faltantes a mock User
- POSStatsCards.test.tsx: Agregar cuentasCerradas a POSStats mock

### FASE C: Actualización de Documentación
**Tiempo estimado: 1 hora**

#### C.1 Actualizar CLAUDE.md
- Métricas de tests reales
- Estado de TypeScript real
- Tareas pendientes

#### C.2 Crear KNOWN_ISSUES.md
- Documentar todos los problemas conocidos
- Workarounds temporales
- Plan de resolución

---

## 5. TAREAS PENDIENTES (Ordenadas por Prioridad)

### P0 - BLOQUEANTES (Hacer hoy)
1. [ ] Fix import `patient.types` → `patients.types` (2 archivos)
2. [ ] Fix tipo User con campos nombre/apellidos
3. [ ] Fix PatientFilters con page/limit
4. [ ] Fix cleanup de tests solicitudes

### P1 - ALTA (Hacer esta semana)
5. [ ] Fix todos los errores TypeScript (26 → 0)
6. [ ] Fix tests backend a 100% pass rate
7. [ ] Actualizar documentación CLAUDE.md

### P2 - MEDIA (Hacer próxima semana)
8. [ ] Agregar script npm run typecheck al CI
9. [ ] Revisar y completar tests frontend
10. [ ] Documentar API con Swagger actualizado

### P3 - BAJA (Backlog)
11. [ ] Migrar a TypeScript strict en más archivos
12. [ ] Añadir cobertura de tests al 80%+
13. [ ] Performance audit del bundle frontend

---

## 6. MÉTRICAS ACTUALES vs OBJETIVO

| Métrica | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| TS errors (prod) | 26 | 0 | -26 |
| Backend tests | 82.5% | 100% | -17.5% |
| Frontend tests | ? | 100% | ? |
| Test suites | 65% | 100% | -35% |
| Documentación | Desactualizada | Actualizada | - |

---

## 7. NOTAS PARA PRÓXIMA SESIÓN

1. **PRIORIDAD MÁXIMA:** Corregir errores TypeScript antes de cualquier desarrollo nuevo
2. **CI/CD:** Los tests deben pasar antes de merge a master
3. **Deuda técnica:** Dedicar 20% del tiempo a correcciones
4. **Testing:** Ejecutar `npm run typecheck` antes de commit

---

## 8. COMANDOS ÚTILES

```bash
# Verificar TypeScript (solo producción)
cd frontend && npx tsc --noEmit 2>&1 | grep -v "__tests__" | grep "error TS"

# Tests backend
cd backend && npm test

# Tests frontend (tarda ~6 min)
cd frontend && npm test -- --watchAll=false

# Contar errores TypeScript
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

**Última actualización:** 28 Nov 2025, 09:00 AM
**Próxima revisión:** Después de FASE A completada
