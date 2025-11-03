# Plan de Acción - Mejoras del Backend

**Fecha:** 3 de noviembre de 2025
**Objetivo:** Elevar calificación de 8.7/10 a 9.0/10
**Esfuerzo total:** 7h 45min (Sprint 1)

---

## Sprint 1: Esta Semana (7h 45min)

### Día 1 - Miércoles (2h)

#### Tarea 1.1: Actualizar Prisma Client (1h)

**Problema:** Versión desactualizada (6.13.0 vs 6.18.0 actual)
**Impacto:** Performance degradada, bugs conocidos sin fix
**Prioridad:** 🔴 P1 - Alta

**Pasos:**

```bash
# 1. Backup de package-lock.json
cp package-lock.json package-lock.json.backup

# 2. Actualizar paquetes
cd /Users/alfredo/agntsystemsc/backend
npm update @prisma/client prisma

# 3. Verificar versiones instaladas
npm list @prisma/client prisma

# Debe mostrar:
# @prisma/client@6.18.0
# prisma@6.18.0

# 4. Regenerar cliente Prisma
npx prisma generate

# 5. Verificar estado de migraciones
npx prisma migrate status

# 6. Ejecutar tests completos
npm test

# 7. Verificar que todos los tests pasen
# Expected: ~270 tests, ~92% pass rate

# 8. Commit cambios
git add package.json package-lock.json
git commit -m "chore: Update Prisma Client to 6.18.0 for performance and security fixes"
```

**Verificación exitosa:**
- ✅ `@prisma/client@6.18.0` instalado
- ✅ `prisma@6.18.0` instalado
- ✅ Tests pasan sin regresiones
- ✅ No hay warnings de Prisma

**Rollback si hay problemas:**
```bash
cp package-lock.json.backup package-lock.json
npm ci
npx prisma generate
```

---

#### Tarea 1.2: Corregir Singleton de PrismaClient (30min)

**Problema:** 2 instancias extra de PrismaClient desperdician conexiones
**Impacto:** "Too many clients" potencial en producción
**Prioridad:** 🔴 P1 - Alta

**Archivos a modificar:**

1. **`/Users/alfredo/agntsystemsc/backend/middleware/auth.middleware.js`**

```diff
- const { PrismaClient } = require('@prisma/client');
- const jwt = require('jsonwebtoken');
- const prisma = new PrismaClient();
+ const jwt = require('jsonwebtoken');
+ const { prisma } = require('../utils/database');
```

2. **`/Users/alfredo/agntsystemsc/backend/middleware/audit.middleware.js`**

```diff
- const { PrismaClient } = require('@prisma/client');
- const prisma = new PrismaClient();
+ const { prisma } = require('../utils/database');
```

**Pasos:**

```bash
cd /Users/alfredo/agntsystemsc/backend

# 1. Editar middleware/auth.middleware.js (usar editor)
# Aplicar cambios arriba

# 2. Editar middleware/audit.middleware.js (usar editor)
# Aplicar cambios arriba

# 3. Verificar que no haya más instancias
grep -r "new PrismaClient" . --include="*.js" --exclude-dir=node_modules

# Debe mostrar solo:
# ./utils/database.js:const prisma = new PrismaClient({

# 4. Ejecutar tests para verificar que todo funciona
npm test -- middleware/middleware.test.js
npm test -- auth/auth.test.js

# 5. Commit cambios
git add middleware/auth.middleware.js middleware/audit.middleware.js
git commit -m "fix: Use singleton PrismaClient from utils/database to prevent connection pool exhaustion"
```

**Verificación exitosa:**
- ✅ Solo 1 instancia de PrismaClient en codebase
- ✅ Tests de middleware pasan
- ✅ Tests de autenticación pasan
- ✅ No hay warnings de conexiones

**Impacto esperado:**
- Pool de conexiones: 30 → 10 (reducción de 67%)
- Memoria: -20MB aprox
- Consistencia en logging de Prisma

---

#### Tarea 1.3: Configurar Pool de Conexiones (30min)

**Problema:** Pool default de Prisma puede ser insuficiente en producción
**Impacto:** Timeouts en alta concurrencia
**Prioridad:** 🔴 P1 - Alta

**Pasos:**

1. **Actualizar `.env` (desarrollo)**

```bash
cd /Users/alfredo/agntsystemsc/backend

# Backup actual
cp .env .env.backup

# Editar .env
# Antes:
# DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management?schema=public"

# Después:
# DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management?schema=public&connection_limit=20&pool_timeout=20"
```

2. **Crear `.env.production.example`**

```bash
cat > .env.production.example << 'EOF'
# Production Environment Variables

# Database
DATABASE_URL="postgresql://user:password@host:5432/hospital_management?schema=public&connection_limit=20&pool_timeout=20"

# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=<CHANGE_ME_IN_PRODUCTION>
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
EOF
```

3. **Documentar en README**

Agregar sección en `/Users/alfredo/agntsystemsc/backend/README.md`:

```markdown
## Database Connection Pool

Configuración recomendada para producción:

- `connection_limit=20`: Máximo 20 conexiones concurrentes
- `pool_timeout=20`: Timeout de 20 segundos para obtener conexión

Ajustar según carga esperada:
- Bajo tráfico (<50 req/min): `connection_limit=10`
- Tráfico medio (50-200 req/min): `connection_limit=20`
- Alto tráfico (>200 req/min): `connection_limit=30`
```

4. **Verificar configuración**

```bash
# Reiniciar servidor
npm run dev

# Verificar en logs que Prisma reconoce la configuración
# Debe mostrar: "Prisma Client initialized"

# Ejecutar tests
npm test

# Commit cambios
git add .env .env.production.example README.md
git commit -m "config: Set database connection pool to 20 connections for production readiness"
```

**Verificación exitosa:**
- ✅ `.env` actualizado
- ✅ `.env.production.example` creado
- ✅ Servidor inicia correctamente
- ✅ Tests pasan sin errores de conexión

---

### Días 2-3 - Jueves/Viernes (5h 45min)

#### Tarea 1.4: Implementar Swagger/OpenAPI (6h)

**Problema:** Falta documentación formal de API
**Impacto:** Dificulta integración frontend/third-party
**Prioridad:** 🔴 P1 - Alta

**Fase 1: Instalación y Configuración Base (1h)**

```bash
cd /Users/alfredo/agntsystemsc/backend

# 1. Instalar dependencias
npm install swagger-jsdoc swagger-ui-express --save

# 2. Crear archivo de configuración
touch swagger.config.js
```

**Contenido de `swagger.config.js`:**

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management API',
      version: '1.0.0',
      description: 'API REST para Sistema de Gestión Hospitalaria Integral',
      contact: {
        name: 'Alfredo Manuel Reyes',
        email: 'alfredo@agnt.dev',
        url: 'https://github.com/your-repo'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.hospital.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/auth/login'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticación faltante o inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Token no proporcionado' }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tiene permisos para realizar esta acción',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'No tienes permisos' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './server-modular.js']
};

module.exports = swaggerJsdoc(options);
```

**Integrar en `server-modular.js`:**

```javascript
// Agregar después de línea 13 (const PORT = ...)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');

// Agregar después de línea 109 (app.get('/health', ...))
// ==============================================
// SWAGGER API DOCUMENTATION
// ==============================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Hospital API Docs'
}));

// Endpoint para OpenAPI JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log(`\n📚 API Documentation: http://localhost:${PORT}/api-docs`);
```

**Verificar:**

```bash
npm run dev

# Abrir en navegador:
# http://localhost:3001/api-docs

# Debe mostrar interfaz de Swagger UI
```

---

**Fase 2: Documentar Endpoints Principales (5h)**

**Ejemplo: Documentar `auth.routes.js`**

Agregar JSDoc comments en `/Users/alfredo/agntsystemsc/backend/routes/auth.routes.js`:

```javascript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     description: Autentica un usuario y devuelve un token JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin
 *                     rol:
 *                       type: string
 *                       example: administrador
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Cuenta bloqueada
 */
router.post('/login', async (req, res) => {
  // ... código existente
});
```

**Endpoints prioritarios a documentar (5 horas):**

1. **auth.routes.js** (30min)
   - `POST /api/auth/login`
   - `GET /api/auth/verify-token`
   - `GET /api/auth/profile`
   - `POST /api/auth/logout`

2. **patients.routes.js** (45min)
   - `GET /api/patients`
   - `POST /api/patients`
   - `GET /api/patients/:id`
   - `PUT /api/patients/:id`
   - `DELETE /api/patients/:id`

3. **employees.routes.js** (45min)
   - `GET /api/employees`
   - `POST /api/employees`
   - `PUT /api/employees/:id`
   - `PUT /api/employees/:id/activate`
   - `GET /api/employees/doctors`

4. **inventory.routes.js** (1h)
   - `GET /api/inventory/products`
   - `POST /api/inventory/products`
   - `PUT /api/inventory/products/:id`
   - `GET /api/inventory/movements`
   - `POST /api/inventory/movements`

5. **billing.routes.js** (45min)
   - `GET /api/billing/invoices`
   - `POST /api/billing/invoices`
   - `GET /api/billing/stats`
   - `GET /api/billing/accounts-receivable`

6. **hospitalization.routes.js** (45min)
   - `GET /api/hospitalization/admissions`
   - `POST /api/hospitalization/admissions`
   - `PUT /api/hospitalization/discharge`
   - `POST /api/hospitalization/notes`

7. **quirofanos.routes.js** (30min)
   - `GET /api/quirofanos`
   - `POST /api/quirofanos`
   - `GET /api/quirofanos/cirugias`
   - `POST /api/quirofanos/cirugias`

**Commit final:**

```bash
git add .
git commit -m "docs: Add Swagger/OpenAPI documentation for main API endpoints

- Installed swagger-jsdoc and swagger-ui-express
- Created swagger.config.js with OpenAPI 3.0 spec
- Documented 30+ critical endpoints across 7 modules
- Added /api-docs UI endpoint
- Added /api-docs.json endpoint for OpenAPI spec

API docs available at: http://localhost:3001/api-docs"
```

**Verificación final:**

```bash
# Reiniciar servidor
npm run dev

# Verificar endpoints en Swagger UI:
# http://localhost:3001/api-docs

# Probar endpoint de login desde Swagger UI
# Copiar token JWT
# Usar "Authorize" button para configurar Bearer token
# Probar endpoints protegidos
```

**Verificación exitosa:**
- ✅ Swagger UI carga correctamente
- ✅ 30+ endpoints documentados
- ✅ Ejemplos de request/response funcionan
- ✅ Autenticación JWT funciona desde UI
- ✅ Tags organizan endpoints por módulo

---

## Checklist Final Sprint 1

### Antes de Declarar Completado

- [ ] **Tarea 1.1:** Prisma Client actualizado a 6.18.0
  - [ ] `npm list @prisma/client` muestra 6.18.0
  - [ ] `npm list prisma` muestra 6.18.0
  - [ ] Tests pasan (~92% pass rate)
  - [ ] Commit realizado

- [ ] **Tarea 1.2:** Singleton de PrismaClient corregido
  - [ ] `grep -r "new PrismaClient"` muestra solo `utils/database.js`
  - [ ] Tests de middleware pasan
  - [ ] Tests de autenticación pasan
  - [ ] Commit realizado

- [ ] **Tarea 1.3:** Pool de conexiones configurado
  - [ ] `.env` actualizado con `connection_limit=20`
  - [ ] `.env.production.example` creado
  - [ ] Documentación en README agregada
  - [ ] Servidor inicia sin warnings
  - [ ] Commit realizado

- [ ] **Tarea 1.4:** Swagger implementado
  - [ ] `swagger-jsdoc` y `swagger-ui-express` instalados
  - [ ] `swagger.config.js` creado
  - [ ] `/api-docs` endpoint funcional
  - [ ] 30+ endpoints documentados
  - [ ] Autenticación JWT funciona en UI
  - [ ] Commit realizado

- [ ] **Verificación General:**
  - [ ] Todos los tests pasan (`npm test`)
  - [ ] Servidor inicia correctamente (`npm run dev`)
  - [ ] No hay errores en consola
  - [ ] Git branch limpio (todos los commits pusheados)

---

## Métricas Esperadas Post-Sprint 1

### Antes (8.7/10)
```
Arquitectura:     9.5/10
Seguridad:       10.0/10
Testing:          9.0/10
Base de Datos:    9.0/10
Mantenibilidad:   8.0/10
Performance:      8.5/10
Dependencias:     7.5/10
```

### Después (9.0/10) 🎯
```
Arquitectura:     9.5/10  (sin cambios)
Seguridad:       10.0/10  (sin cambios)
Testing:          9.0/10  (sin cambios)
Base de Datos:    9.5/10  ⬆️ (+0.5 por pool optimizado)
Mantenibilidad:   9.0/10  ⬆️ (+1.0 por Swagger + singleton)
Performance:      9.0/10  ⬆️ (+0.5 por Prisma 6.18.0)
Dependencias:     9.0/10  ⬆️ (+1.5 por Prisma actualizado)
```

**Calificación final: 9.0/10** ✅

---

## Roadmap Futuro (Opcional)

### Sprint 2: Próximas 2 Semanas (24h)

1. **Refactorizar endpoints legacy** (8h)
   - Mover 6 endpoints de `server-modular.js` a rutas modulares
   - Reducir `server-modular.js` de 1,150 LOC a ~350 LOC

2. **Implementar response helpers** (4h)
   - Crear `utils/response-helpers.js`
   - Estandarizar respuestas en 15 rutas

3. **Agregar tests faltantes** (8h)
   - Notificaciones: 20+ tests
   - Auditoría: 15+ tests
   - Logger sanitization: 10+ tests

4. **Actualizar dependencias menores** (2h)
   - Winston: 3.17.0 → 3.18.3
   - Dotenv: 16.6.1 → 17.2.3

5. **Implementar CSRF protection** (2h)
   - Instalar `csurf`
   - Aplicar a formularios sensibles

**Resultado Sprint 2:** Backend 9.2/10

### Sprint 3: Próximo Mes (40h)

1. **Migrar a Express 5.x** (16h)
2. **Implementar DataLoader** (8h)
3. **Tests de performance** (4h)
4. **Estandarizar nomenclatura** (12h)

**Resultado Sprint 3:** Backend 9.5/10

---

## Contacto y Soporte

**Documentación completa:**
- Análisis detallado: `/Users/alfredo/agntsystemsc/.claude/doc/backend_health_analysis/backend_health_report.md`
- Resumen ejecutivo: `/Users/alfredo/agntsystemsc/.claude/doc/backend_health_analysis/executive_summary.md`

**Preparado por:** Backend Research Specialist - Claude Code
**Fecha:** 3 de noviembre de 2025
