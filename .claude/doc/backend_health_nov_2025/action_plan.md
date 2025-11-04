# Plan de Acción - Mejoras del Backend
**Sistema de Gestión Hospitalaria Integral**
**Fecha:** 3 de noviembre de 2025
**Desarrollador:** Alfredo Manuel Reyes - AGNT

---

## Resumen del Plan

Este documento detalla las acciones concretas para llevar el backend desde **9.0/10** hasta **9.5+/10**, priorizadas por impacto y esfuerzo.

**Timeline estimado total:** 4 semanas
**Esfuerzo total estimado:** ~80 horas

---

## FASE 1: Quick Wins (Semana 1)
**Objetivo:** Resolver issues críticos antes de producción
**Duración:** 1 semana
**Esfuerzo:** 7 horas

### P1.1 - Migrar console.log a logger
**Duración:** 2 horas
**Impacto:** Alto (producción)
**Archivos afectados:** `server-modular.js`

**Ubicaciones a corregir (6 ocurrencias):**

```javascript
// ANTES (líneas 46, 53, 55, 1145-1170)
console.warn(`⚠️  HTTP request redirected to HTTPS: ${req.url}`);
console.log('✅ HTTPS enforcement enabled (production mode)');
console.log('⚠️  HTTPS enforcement disabled (development mode)');
console.log('📚 Swagger documentation available at /api-docs');
console.log(`🏥 Servidor Hospital con Arquitectura Modular iniciado`);
console.log(`🚀 Ejecutándose en: http://localhost:${PORT}`);
console.log(`🗄️  Base de datos: PostgreSQL con Prisma ORM`);
// ... etc

// DESPUÉS
logger.warn('HTTP request redirected to HTTPS', { url: req.url });
logger.info('HTTPS enforcement enabled (production mode)');
logger.info('HTTPS enforcement disabled (development mode)');
logger.info('Swagger documentation available at /api-docs');
logger.info('Servidor Hospital iniciado', {
  port: PORT,
  database: 'PostgreSQL con Prisma ORM',
  architecture: 'Modular Routes',
  documentation: '/api-docs',
  health: '/health'
});
```

**Checklist:**
- [ ] Importar logger al inicio de server-modular.js
- [ ] Reemplazar 6 console.log/console.warn con logger.info/logger.warn
- [ ] Agregar contexto estructurado (objetos) en lugar de strings
- [ ] Probar localmente: `npm run dev`
- [ ] Verificar logs en `/backend/logs/combined.log`

**Criterios de éxito:**
- ✅ 0 console.log/console.warn en server-modular.js
- ✅ Logs estructurados en archivos de log
- ✅ Servidor inicia correctamente

---

### P1.2 - Implementar health check avanzado
**Duración:** 4 horas
**Impacto:** Alto (monitoring)
**Archivo nuevo:** `routes/health.routes.js`

**Paso 1: Crear ruta de health check (2 horas)**

Crear archivo `/backend/routes/health.routes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const logger = require('../utils/logger');
const os = require('os');

// GET /health/detailed - Health check completo
router.get('/detailed', async (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Database health
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      healthData.database = {
        status: 'connected',
        latency: `${latency}ms`,
        provider: 'PostgreSQL',
        version: 'Prisma 6.18.0'
      };
    } catch (error) {
      healthData.status = 'degraded';
      healthData.database = {
        status: 'error',
        error: error.message
      };
    }

    // Memory health
    const memoryUsage = process.memoryUsage();
    healthData.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };

    // System health
    healthData.system = {
      platform: os.platform(),
      cpuUsage: process.cpuUsage(),
      loadAverage: os.loadavg(),
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`
    };

    // Services health
    healthData.services = {
      auth: 'ok',
      prisma: healthData.database.status === 'connected' ? 'ok' : 'error',
      logger: 'ok',
      swagger: 'ok'
    };

    // Responder con código apropiado
    const statusCode = healthData.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// GET /health/liveness - Kubernetes liveness probe
router.get('/liveness', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// GET /health/readiness - Kubernetes readiness probe
router.get('/readiness', async (req, res) => {
  try {
    // Verificar BD
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: 'Database not accessible'
    });
  }
});

module.exports = router;
```

**Paso 2: Registrar ruta en server-modular.js (1 hora)**

```javascript
// Agregar después de las importaciones de rutas
const healthRoutes = require('./routes/health.routes');

// Registrar antes del health check simple actual
app.use('/health', healthRoutes);

// Mantener el health check simple para compatibilidad
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sistema Hospitalario API (PostgreSQL + Arquitectura Modular)',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL con Prisma',
    architecture: 'Modular Routes',
    documentation: '/api-docs',
    detailedHealth: '/health/detailed' // Agregar referencia
  });
});
```

**Paso 3: Testing (1 hora)**

Crear test en `/backend/tests/health/health.test.js`:

```javascript
const request = require('supertest');
const { app } = require('../../server-modular');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.detailedHealth).toBe('/health/detailed');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body.database.status).toBe('connected');
    });
  });

  describe('GET /health/liveness', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/liveness');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /health/readiness', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/readiness');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });
  });
});
```

**Checklist:**
- [ ] Crear archivo `routes/health.routes.js`
- [ ] Implementar `/health/detailed`
- [ ] Implementar `/health/liveness`
- [ ] Implementar `/health/readiness`
- [ ] Registrar ruta en `server-modular.js`
- [ ] Crear tests en `tests/health/health.test.js`
- [ ] Ejecutar tests: `npm test -- health.test.js`
- [ ] Probar endpoints manualmente:
  - `curl http://localhost:3001/health/detailed`
  - `curl http://localhost:3001/health/liveness`
  - `curl http://localhost:3001/health/readiness`

**Criterios de éxito:**
- ✅ Endpoint `/health/detailed` retorna información completa
- ✅ Endpoint `/health/liveness` responde en <100ms
- ✅ Endpoint `/health/readiness` verifica conexión BD
- ✅ Tests pasan exitosamente
- ✅ Documentado en Swagger

---

### P1.3 - Activar Morgan con logger.stream
**Duración:** 1 hora
**Impacto:** Medio (logging HTTP)
**Archivo afectado:** `server-modular.js`

**Implementación:**

```javascript
// Agregar import después de las importaciones existentes
const morgan = require('morgan');
const logger = require('./utils/logger');

// Agregar después de los parsers de body (línea ~78)
// HTTP request logging con Morgan + Winston
app.use(morgan('combined', {
  stream: logger.stream,
  skip: (req, res) => {
    // No loggear health checks (reduce ruido)
    return req.url.includes('/health');
  }
}));

// Agregar logging de errores HTTP
app.use((req, res, next) => {
  // Capturar tiempo de inicio
  req.startTime = Date.now();

  // Interceptar res.json para loggear respuestas
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - req.startTime;

    // Loggear solo errores o requests lentas (>2s)
    if (res.statusCode >= 400 || duration > 2000) {
      logger.warn('Slow or error request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
    }

    return originalJson(data);
  };

  next();
});
```

**Checklist:**
- [ ] Importar `morgan` y `logger`
- [ ] Configurar Morgan con `logger.stream`
- [ ] Skip health checks en logs
- [ ] Agregar logging de requests lentas
- [ ] Probar localmente: `npm run dev`
- [ ] Verificar logs HTTP en `/backend/logs/combined.log`
- [ ] Ejecutar request lenta (>2s) y verificar log

**Criterios de éxito:**
- ✅ Requests HTTP loggeados en formato combinado
- ✅ Health checks excluidos de logs (reduce ruido)
- ✅ Requests lentas (>2s) loggeadas con warning
- ✅ Errores 4xx/5xx loggeados

---

## FASE 2: Consolidación (Semanas 2-3)
**Objetivo:** Aumentar calidad y mantenibilidad
**Duración:** 2 semanas
**Esfuerzo:** 40 horas

### P2.1 - Aumentar cobertura de tests a 85%+
**Duración:** 1 semana (40 horas)
**Impacto:** Alto (calidad)
**Archivos afectados:** `billing.routes.js`, `reports.routes.js`, `notificaciones.routes.js`

**Estrategia por módulo:**

#### Módulo 1: Billing (3 días)

**Estado actual:** ~70% cobertura
**Objetivo:** 85%+ cobertura

**Tests faltantes:**

1. **Cuentas por cobrar (Accounts Receivable)**
```javascript
// tests/billing/accounts-receivable.test.js
describe('GET /api/billing/accounts-receivable', () => {
  it('should list overdue invoices', async () => { ... });
  it('should filter by patient', async () => { ... });
  it('should filter by date range', async () => { ... });
  it('should calculate aging report (30/60/90 days)', async () => { ... });
});
```

2. **Pagos parciales**
```javascript
describe('POST /api/billing/invoices/:id/payments', () => {
  it('should register partial payment', async () => { ... });
  it('should update invoice status to partial', async () => { ... });
  it('should prevent overpayment', async () => { ... });
  it('should track payment history', async () => { ... });
});
```

3. **Cancelación de facturas**
```javascript
describe('DELETE /api/billing/invoices/:id', () => {
  it('should cancel invoice with reason', async () => { ... });
  it('should require admin role', async () => { ... });
  it('should audit cancellation', async () => { ... });
  it('should prevent cancellation of paid invoices', async () => { ... });
});
```

**Checklist Billing:**
- [ ] Crear `tests/billing/accounts-receivable.test.js` (15 tests)
- [ ] Crear `tests/billing/partial-payments.test.js` (10 tests)
- [ ] Crear `tests/billing/invoice-cancellation.test.js` (8 tests)
- [ ] Ejecutar tests: `npm test -- billing`
- [ ] Verificar cobertura: `npm test -- --coverage billing`
- [ ] Objetivo: 85%+ líneas, 80%+ branches

#### Módulo 2: Reports (2 días)

**Estado actual:** ~65% cobertura
**Objetivo:** 85%+ cobertura

**Tests faltantes:**

1. **Reportes financieros**
```javascript
describe('GET /api/reports/financial', () => {
  it('should generate monthly revenue report', async () => { ... });
  it('should filter by date range', async () => { ... });
  it('should include revenue breakdown by service', async () => { ... });
  it('should calculate profit margins', async () => { ... });
});
```

2. **Reportes operativos**
```javascript
describe('GET /api/reports/operational', () => {
  it('should generate occupancy report', async () => { ... });
  it('should track patient admissions', async () => { ... });
  it('should report inventory levels', async () => { ... });
  it('should calculate staff utilization', async () => { ... });
});
```

**Checklist Reports:**
- [ ] Crear `tests/reports/financial.test.js` (12 tests)
- [ ] Crear `tests/reports/operational.test.js` (10 tests)
- [ ] Crear mocks de datos financieros complejos
- [ ] Ejecutar tests: `npm test -- reports`
- [ ] Verificar cobertura: `npm test -- --coverage reports`
- [ ] Objetivo: 85%+ líneas

#### Módulo 3: Notificaciones (2 días)

**Estado actual:** ~60% cobertura
**Objetivo:** 85%+ cobertura

**Tests faltantes:**

1. **Notificaciones de solicitudes**
```javascript
describe('POST /api/notificaciones', () => {
  it('should create notification for new request', async () => { ... });
  it('should notify warehouse staff', async () => { ... });
  it('should include request details', async () => { ... });
});

describe('PUT /api/notificaciones/:id/mark-read', () => {
  it('should mark notification as read', async () => { ... });
  it('should update timestamp', async () => { ... });
  it('should prevent marking others notifications', async () => { ... });
});
```

2. **Filtrado de notificaciones**
```javascript
describe('GET /api/notificaciones', () => {
  it('should filter by read status', async () => { ... });
  it('should filter by user', async () => { ... });
  it('should sort by date', async () => { ... });
  it('should paginate results', async () => { ... });
});
```

**Checklist Notificaciones:**
- [ ] Crear `tests/notificaciones/notifications.test.js` (18 tests)
- [ ] Crear helpers de creación de notificaciones
- [ ] Ejecutar tests: `npm test -- notificaciones`
- [ ] Verificar cobertura: `npm test -- --coverage notificaciones`
- [ ] Objetivo: 85%+ líneas

**Resumen P2.1:**
- Total tests nuevos: ~73 tests
- Cobertura objetivo global: 85%+
- Duración: 7 días (56 horas efectivas)

---

### P2.2 - Consolidar validaciones con express-validator
**Duración:** 1 semana (40 horas)
**Impacto:** Medio (mantenibilidad)
**Archivos afectados:** Todos los routes/*.js

**Estrategia:**

**Paso 1: Crear validators centralizados (2 días)**

Crear archivo `/backend/validators/common.validators.js`:

```javascript
const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validadores comunes
const commonValidators = {
  // Email
  email: () => body('email')
    .optional()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  // CURP
  curp: () => body('curp')
    .optional()
    .matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/)
    .withMessage('CURP inválido'),

  // Teléfono México
  telefono: () => body('telefono')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Teléfono debe ser 10 dígitos'),

  // Fecha
  fecha: (field) => body(field)
    .optional()
    .isISO8601().withMessage(`${field} debe ser fecha válida`)
    .toDate(),

  // ID numérico
  id: (field = 'id') => param(field)
    .isInt({ min: 1 }).withMessage(`${field} debe ser entero positivo`)
    .toInt(),

  // Paginación
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('page debe ser entero positivo')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1-100')
      .toInt()
  ],

  // Búsqueda
  search: () => query('search')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('Búsqueda máximo 100 caracteres')
};

module.exports = {
  handleValidationErrors,
  commonValidators
};
```

Crear archivo `/backend/validators/patients.validators.js`:

```javascript
const { body } = require('express-validator');
const { handleValidationErrors, commonValidators } = require('./common.validators');

const patientValidators = {
  // Crear paciente
  create: [
    body('nombre')
      .notEmpty().withMessage('Nombre es requerido')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Nombre entre 2-50 caracteres'),

    body('apellidoPaterno')
      .notEmpty().withMessage('Apellido paterno es requerido')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Apellido entre 2-50 caracteres'),

    body('apellidoMaterno')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Apellido máximo 50 caracteres'),

    body('fechaNacimiento')
      .notEmpty().withMessage('Fecha de nacimiento es requerida')
      .isISO8601().withMessage('Fecha inválida')
      .toDate()
      .custom((value) => {
        const age = (new Date() - value) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 0 || age > 120) {
          throw new Error('Fecha de nacimiento inválida');
        }
        return true;
      }),

    body('genero')
      .notEmpty().withMessage('Género es requerido')
      .isIn(['M', 'F', 'Otro']).withMessage('Género inválido'),

    commonValidators.email(),
    commonValidators.telefono(),
    commonValidators.curp(),

    handleValidationErrors
  ],

  // Actualizar paciente
  update: [
    commonValidators.id('id'),
    body('nombre').optional().trim().isLength({ min: 2, max: 50 }),
    body('apellidoPaterno').optional().trim().isLength({ min: 2, max: 50 }),
    body('genero').optional().isIn(['M', 'F', 'Otro']),
    commonValidators.email(),
    commonValidators.telefono(),
    commonValidators.curp(),
    handleValidationErrors
  ]
};

module.exports = patientValidators;
```

**Paso 2: Aplicar validators en rutas (3 días)**

Modificar `/backend/routes/patients.routes.js`:

```javascript
const patientValidators = require('../validators/patients.validators');

// ANTES
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, apellidoPaterno, ... } = req.body;
    // Validaciones manuales aquí
    ...
  }
});

// DESPUÉS
router.post('/',
  authenticateToken,
  patientValidators.create, // Validación automática
  async (req, res) => {
    try {
      const { nombre, apellidoPaterno, ... } = req.body;
      // Sin validaciones manuales, ya validado
      ...
    }
  }
);
```

**Paso 3: Testing de validadores (2 días)**

Crear tests en `/backend/tests/validators/validators.test.js`:

```javascript
describe('Patient Validators', () => {
  it('should reject empty nombre', async () => {
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ apellidoPaterno: 'Test' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'nombre' })
    );
  });

  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test',
        apellidoPaterno: 'Test',
        email: 'invalid-email'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'email' })
    );
  });
});
```

**Checklist P2.2:**
- [ ] Crear `validators/common.validators.js`
- [ ] Crear `validators/patients.validators.js`
- [ ] Crear `validators/employees.validators.js`
- [ ] Crear `validators/inventory.validators.js`
- [ ] Aplicar validators en `routes/patients.routes.js`
- [ ] Aplicar validators en `routes/employees.routes.js`
- [ ] Aplicar validators en `routes/inventory.routes.js`
- [ ] Crear `tests/validators/validators.test.js` (30+ tests)
- [ ] Ejecutar tests: `npm test -- validators`
- [ ] Ejecutar tests de integración completos

**Criterios de éxito:**
- ✅ Validaciones centralizadas y reutilizables
- ✅ Mensajes de error consistentes
- ✅ 90%+ de rutas con validadores
- ✅ Tests pasan exitosamente

---

### P2.3 - Refactorizar rutas >800 LOC
**Duración:** 1 semana (40 horas)
**Impacto:** Medio (mantenibilidad)
**Archivos afectados:** `hospitalization.routes.js`, `quirofanos.routes.js`, `patients.routes.js`

**Estrategia: Patrón Controller-Service**

**Estructura objetivo:**
```
routes/
├── patients/
│   ├── patients.routes.js        # Router (100-150 LOC)
│   ├── patients.controller.js    # Controllers (300-400 LOC)
│   ├── patients.service.js       # Business logic (300-400 LOC)
│   └── patients.validators.js    # Validations
```

**Ejemplo de refactoring (patients):**

**patients.routes.js (nuevo, ~120 LOC):**
```javascript
const express = require('express');
const router = express.Router();
const patientController = require('./patients.controller');
const patientValidators = require('../../validators/patients.validators');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { validatePagination } = require('../../middleware/validation.middleware');

// GET /api/patients - Listar pacientes
router.get('/',
  authenticateToken,
  validatePagination,
  patientController.list
);

// GET /api/patients/:id - Obtener paciente
router.get('/:id',
  authenticateToken,
  patientValidators.getById,
  patientController.getById
);

// POST /api/patients - Crear paciente
router.post('/',
  authenticateToken,
  patientValidators.create,
  patientController.create
);

// PUT /api/patients/:id - Actualizar paciente
router.put('/:id',
  authenticateToken,
  patientValidators.update,
  patientController.update
);

// DELETE /api/patients/:id - Eliminar paciente (soft delete)
router.delete('/:id',
  authenticateToken,
  patientValidators.delete,
  patientController.delete
);

// GET /api/patients/stats - Estadísticas
router.get('/stats',
  authenticateToken,
  patientController.getStats
);

module.exports = router;
```

**patients.controller.js (nuevo, ~350 LOC):**
```javascript
const patientService = require('./patients.service');
const logger = require('../../utils/logger');

const patientController = {
  // GET /api/patients
  list: async (req, res) => {
    try {
      const { page, limit, offset } = req.pagination;
      const filters = req.query;

      const result = await patientService.list({
        page,
        limit,
        offset,
        filters
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.logError('patientController.list', error, req.query);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pacientes'
      });
    }
  },

  // GET /api/patients/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const patient = await patientService.getById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }

      res.json({
        success: true,
        data: { patient }
      });
    } catch (error) {
      logger.logError('patientController.getById', error, { id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Error obteniendo paciente'
      });
    }
  },

  // POST /api/patients
  create: async (req, res) => {
    try {
      const patientData = req.body;
      const userId = req.user.id;

      const newPatient = await patientService.create(patientData, userId);

      res.status(201).json({
        success: true,
        data: { patient: newPatient },
        message: 'Paciente creado exitosamente'
      });
    } catch (error) {
      logger.logError('patientController.create', error, req.body);
      res.status(500).json({
        success: false,
        message: 'Error creando paciente'
      });
    }
  },

  // ... resto de controllers
};

module.exports = patientController;
```

**patients.service.js (nuevo, ~400 LOC):**
```javascript
const { prisma } = require('../../utils/database');
const { calcularEdad } = require('../../utils/helpers');

const patientService = {
  // Listar pacientes con filtros
  list: async ({ page, limit, offset, filters }) => {
    const { search, genero, ciudad, estado } = filters;

    // Construir filtros WHERE
    const where = { activo: true };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellidoPaterno: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (genero) where.genero = genero;
    if (ciudad) where.ciudad = { contains: ciudad, mode: 'insensitive' };
    if (estado) where.estado = { contains: estado, mode: 'insensitive' };

    // Ejecutar queries
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        orderBy: { apellidoPaterno: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.paciente.count({ where })
    ]);

    // Formatear respuesta
    const items = pacientes.map(p => ({
      id: p.id,
      numeroExpediente: p.numeroExpediente,
      nombreCompleto: `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`.trim(),
      edad: calcularEdad(p.fechaNacimiento),
      genero: p.genero,
      telefono: p.telefono,
      email: p.email
    }));

    return {
      items,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        offset
      }
    };
  },

  // Obtener paciente por ID
  getById: async (id) => {
    return await prisma.paciente.findUnique({
      where: { id: parseInt(id) },
      include: {
        responsable: true,
        cuentas: {
          where: { estado: 'abierta' },
          take: 5
        }
      }
    });
  },

  // Crear paciente
  create: async (patientData, userId) => {
    // Generar número de expediente
    const numeroExpediente = await generateExpediente();

    // Crear paciente
    const newPatient = await prisma.paciente.create({
      data: {
        ...patientData,
        numeroExpediente,
        esMenorEdad: calcularEdad(patientData.fechaNacimiento) < 18
      }
    });

    return newPatient;
  },

  // ... resto de servicios
};

module.exports = patientService;
```

**Checklist por módulo (3 módulos x 2-3 días):**

**Pacientes (2 días):**
- [ ] Crear `routes/patients/patients.controller.js`
- [ ] Crear `routes/patients/patients.service.js`
- [ ] Refactorizar `routes/patients.routes.js`
- [ ] Migrar lógica de negocio a service
- [ ] Migrar handlers a controller
- [ ] Actualizar tests
- [ ] Verificar: `npm test -- patients`

**Hospitalización (3 días):**
- [ ] Crear `routes/hospitalization/hospitalization.controller.js`
- [ ] Crear `routes/hospitalization/hospitalization.service.js`
- [ ] Refactorizar `routes/hospitalization.routes.js`
- [ ] Migrar lógica compleja (anticipo, alta, cargos)
- [ ] Actualizar tests
- [ ] Verificar: `npm test -- hospitalization`

**Quirófanos (2 días):**
- [ ] Crear `routes/quirofanos/quirofanos.controller.js`
- [ ] Crear `routes/quirofanos/quirofanos.service.js`
- [ ] Refactorizar `routes/quirofanos.routes.js`
- [ ] Migrar lógica de cirugías
- [ ] Actualizar tests
- [ ] Verificar: `npm test -- quirofanos`

**Criterios de éxito:**
- ✅ Todas las rutas <200 LOC
- ✅ Controllers <400 LOC
- ✅ Services <500 LOC
- ✅ Lógica de negocio separada de routing
- ✅ Tests siguen pasando

---

### P2.4 - Implementar caché Redis
**Duración:** 3 días (24 horas)
**Impacto:** Medio (performance)
**Archivos nuevos:** `utils/cache.js`, configuración Redis

**Paso 1: Instalar y configurar Redis (4 horas)**

```bash
# Instalar dependencia
npm install ioredis

# Instalar Redis (macOS)
brew install redis
brew services start redis

# Verificar
redis-cli ping
# Respuesta: PONG
```

Crear archivo `/backend/utils/cache.js`:

```javascript
const Redis = require('ioredis');
const logger = require('./logger');

// Cliente Redis con configuración
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  maxRetriesPerRequest: 3
});

// Event handlers
redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error) => {
  logger.error('Redis error', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache helper functions
const cache = {
  // Get con fallback
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  },

  // Set con TTL
  async set(key, value, ttlSeconds = 300) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  },

  // Delete
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache del error', { key, error: error.message });
      return false;
    }
  },

  // Delete pattern
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache delPattern error', { pattern, error: error.message });
      return 0;
    }
  },

  // Health check
  async ping() {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
};

module.exports = { cache, redis };
```

**Paso 2: Implementar caché en servicios (12 horas)**

Crear middleware de caché:

```javascript
// middleware/cache.middleware.js
const { cache } = require('../utils/cache');

// Middleware de caché para GET requests
const cacheMiddleware = (ttlSeconds = 300, keyPrefix = 'api') => {
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generar cache key
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    try {
      // Intentar obtener del caché
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey });
        return res.json(cachedData);
      }

      // Cache miss - interceptar response
      const originalJson = res.json.bind(res);
      res.json = async function(data) {
        // Solo cachear respuestas exitosas
        if (data.success) {
          await cache.set(cacheKey, data, ttlSeconds);
          logger.debug('Cache set', { key: cacheKey, ttl: ttlSeconds });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      next(); // Continuar sin caché en caso de error
    }
  };
};

module.exports = { cacheMiddleware };
```

Aplicar caché en rutas frecuentes:

```javascript
// routes/inventory.routes.js
const { cacheMiddleware } = require('../middleware/cache.middleware');

// GET /api/inventory/products - Con caché de 5 minutos
router.get('/products',
  authenticateToken,
  cacheMiddleware(300, 'products'), // TTL: 5 min
  inventoryController.listProducts
);

// GET /api/services - Con caché de 10 minutos
router.get('/services',
  authenticateToken,
  cacheMiddleware(600, 'services'), // TTL: 10 min
  servicesController.list
);
```

Invalidar caché en updates:

```javascript
// routes/inventory.routes.js
const { cache } = require('../utils/cache');

// POST /api/inventory/products - Invalidar caché
router.post('/products',
  authenticateToken,
  async (req, res) => {
    // ... crear producto
    await inventoryService.create(req.body);

    // Invalidar caché
    await cache.delPattern('products:*');

    res.json({ success: true });
  }
);
```

**Paso 3: Agregar Redis a health check (2 horas)**

Modificar `/backend/routes/health.routes.js`:

```javascript
const { cache } = require('../utils/cache');

router.get('/detailed', async (req, res) => {
  // ... health checks existentes

  // Redis health
  try {
    const redisHealthy = await cache.ping();
    healthData.redis = {
      status: redisHealthy ? 'connected' : 'disconnected'
    };
  } catch (error) {
    healthData.redis = {
      status: 'error',
      error: error.message
    };
  }

  // ...
});
```

**Paso 4: Testing de caché (6 horas)**

Crear tests en `/backend/tests/cache/cache.test.js`:

```javascript
const { cache } = require('../../utils/cache');

describe('Redis Cache', () => {
  beforeEach(async () => {
    // Limpiar caché antes de cada test
    await cache.delPattern('test:*');
  });

  it('should set and get value', async () => {
    await cache.set('test:key', { value: 'test' });
    const result = await cache.get('test:key');

    expect(result).toEqual({ value: 'test' });
  });

  it('should expire after TTL', async () => {
    await cache.set('test:key', { value: 'test' }, 1); // 1 segundo

    // Esperar 1.5 segundos
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await cache.get('test:key');
    expect(result).toBeNull();
  });

  it('should delete by pattern', async () => {
    await cache.set('test:key1', { value: 1 });
    await cache.set('test:key2', { value: 2 });

    const deleted = await cache.delPattern('test:*');
    expect(deleted).toBe(2);

    const result1 = await cache.get('test:key1');
    const result2 = await cache.get('test:key2');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});
```

**Checklist P2.4:**
- [ ] Instalar Redis: `brew install redis`
- [ ] Instalar ioredis: `npm install ioredis`
- [ ] Crear `utils/cache.js`
- [ ] Crear `middleware/cache.middleware.js`
- [ ] Aplicar caché en `routes/inventory.routes.js`
- [ ] Aplicar caché en servicios frecuentes
- [ ] Agregar invalidación de caché en updates
- [ ] Agregar Redis a health check
- [ ] Crear `tests/cache/cache.test.js`
- [ ] Agregar variables a `.env.example`:
  ```bash
  # Redis Cache
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=
  ```
- [ ] Documentar uso de caché en README

**Criterios de éxito:**
- ✅ Redis conectado y funcionando
- ✅ Caché aplicado en endpoints frecuentes
- ✅ Invalidación automática en updates
- ✅ Health check incluye Redis
- ✅ Tests pasan exitosamente
- ✅ Reducción >50% en queries repetitivas

---

## FASE 3: Escalabilidad (3+ meses)
**Objetivo:** Preparar para >100K usuarios concurrentes
**Duración:** 3+ meses
**Esfuerzo:** Variable

### P3.1 - Read Replicas de PostgreSQL

**Objetivo:** Separar lecturas de escrituras

**Implementación:**
- Configurar replica de solo lectura en PostgreSQL
- Modificar Prisma para usar read replica
- Dirigir queries de lectura a replica
- Dirigir escrituras a master

**Beneficio:** 2-3x mejora en throughput de lecturas

### P3.2 - Queue System con Bull

**Objetivo:** Procesar tareas pesadas en background

**Casos de uso:**
- Generación de reportes complejos
- Envío de emails/notificaciones
- Procesamiento de archivos
- Cálculos de estadísticas

**Beneficio:** Reducción de timeouts en requests lentas

### P3.3 - Sentry Error Tracking

**Objetivo:** Monitoreo de errores en producción

**Implementación:**
- Instalar @sentry/node
- Configurar Sentry DSN
- Capturar errores automáticamente
- Alertas por email/Slack

**Beneficio:** Detección proactiva de bugs en producción

### P3.4 - Rate Limiting por Usuario

**Objetivo:** Límites personalizados por rol

**Implementación:**
- Rate limit diferenciado por rol
- Admin: ilimitado
- Médicos: 1000 req/hora
- Cajeros: 500 req/hora
- Otros: 200 req/hora

**Beneficio:** Prevención de abuso de API

---

## Resumen del Plan

| Fase | Duración | Esfuerzo | Prioridad | Impacto |
|------|----------|----------|-----------|---------|
| **FASE 1: Quick Wins** | 1 semana | 7 horas | P1 | Alto |
| **FASE 2: Consolidación** | 2 semanas | 40 horas | P2 | Medio |
| **FASE 3: Escalabilidad** | 3+ meses | Variable | P3 | Bajo |

**Total FASES 1+2:** 3 semanas, 47 horas

---

## Criterios de Éxito Global

### FASE 1 (Quick Wins)
- ✅ 0 console.log en producción
- ✅ Health check avanzado disponible
- ✅ Morgan integrado con Winston

**Calificación esperada:** 9.2/10

### FASE 2 (Consolidación)
- ✅ Cobertura de tests >85%
- ✅ Validaciones centralizadas con express-validator
- ✅ Todas las rutas <300 LOC
- ✅ Caché Redis implementado

**Calificación esperada:** 9.5/10

### FASE 3 (Escalabilidad)
- ✅ Read replicas funcionando
- ✅ Queue system procesando tareas pesadas
- ✅ Sentry monitoreando errores
- ✅ Rate limiting por usuario

**Calificación esperada:** 9.8/10 (Enterprise-grade)

---

**Desarrollador:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479
**Fecha de Plan:** 3 de noviembre de 2025

---

**FIN DEL PLAN DE ACCIÓN**
