# PLAN DE ACCIÓN INMEDIATA - Desde Análisis de Estructura
## Basado en Análisis Exhaustivo del 31 de Octubre de 2025

**Objetivo:** Limpiar y optimizar estructura en 4 semanas

---

## SEMANA 1: LIMPIAR Y ACTUALIZAR (5-8 horas)

### Lunes (Dependencias)

1. Fijar conflicto bcrypt/bcryptjs
   - Editar backend/package.json
   - REMOVER: "bcryptjs": "^2.4.3"
   - MANTENER: "bcrypt": "^6.0.0"

2. Sincronizar Prisma
   - Cambiar: "prisma": "^5.22.0"
   - Por: "prisma": "^6.13.0"

3. Instalar y verificar
   - npm install && npm test

4. Commit
   - git commit -m "Fix: Remover bcryptjs y sincronizar Prisma a v6.13.0"

**Tiempo:** 15 minutos

---

### Martes (Documentación)

1. Actualizar CLAUDE.md (línea 28)
   - DE: 141 tests backend
   - A: 110 tests backend

2. Actualizar README.md (línea 93)
   - DE: 338 tests unit
   - A: 300 tests unit

3. Commit
   - git commit -m "Docs: Actualizar números de tests correctamente"

**Tiempo:** 30 minutos

---

### Miércoles (Limpiar)

1. Agregar a .gitignore
   - logs/
   - coverage/
   - *.log

2. Eliminar logs existentes
   - rm -rf /backend/logs/*

3. Commit
   - git commit -m "Config: Agregar logs/ a .gitignore"

**Tiempo:** 15 minutos

---

### Jueves (Documentar)

1. Crear backend/tests/README_SCRIPTS_OBSOLETOS.md
2. Documentar propósito de scripts obsoletos
3. Commit

**Tiempo:** 20 minutos

---

### Viernes (BD)

1. Revisar PERFORMANCE_INDEXES_REPORT.md
2. Crear migration para índices
3. npx prisma migrate dev --name add_indexes
4. Commit

**Tiempo:** 2-3 horas

---

## SEMANA 2: CONSOLIDAR DOCUMENTACIÓN (4-6 horas)

1. Crear /docs/architecture/
2. Crear /docs/guides/
3. Crear /docs/api/
4. Mover archivos a nueva estructura
5. Crear docs/INDEX.md
6. Archivar duplicados en .claude/archives/

---

## SEMANA 2-3: TESTING BACKEND (5-7 días)

1. Ejecutar: npm test -- --verbose
2. Crear PLAN_FIXES_TESTS.md
3. Identificar 68 tests failing
4. Fijar por módulo:
   - Solicitudes
   - Quirófanos
   - Inventory
   - Middleware

---

## SEMANA 4: REFACTORIZAR Y CI/CD (3-4 días)

1. Refactorizar 3 God Components
2. Crear .github/workflows/test.yml
3. Implementar GitHub Actions

---

## COMMITS ESPERADOS

1. Fix: Dependencias Backend (15 min)
2. Docs: Números tests (30 min)
3. Config: Logs cleanup (15 min)
4. Docs: Scripts obsoletos (20 min)
5. Database: Índices (2-3 h)
6. Docs: Consolidar (2-3 h)
7. Test: Plan fixes (5-7 d)
8. Frontend: Refactorizar (2-3 d)
9. CI/CD: GitHub Actions (2 h)

---

## MÉTRICAS ESPERADAS

Antes:
- Conflictos dependencias: 2
- Documentación: 1.4 MB dispersa
- Logs: 1.4 MB en repo
- Tests failing: 68/110
- Índices BD: 6 de 25+
- CI/CD: No

Después:
- Conflictos: 0
- Documentación: /docs/ centralizado
- Logs: -1.4 MB
- Tests failing: 0/110
- Índices BD: 25+ implementados
- CI/CD: GitHub Actions activo

---

**Total Estimado:** 40-60 horas (4 semanas)

