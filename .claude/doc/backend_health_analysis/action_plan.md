# Backend Health - Prioritized Action Plan
**Sistema de Gestión Hospitalaria Integral**

---

## Overview

**Overall Health Score:** 8.2/10 ⭐⭐⭐⭐
**Production Readiness:** 80%
**Blockers to Production:** 5 critical items
**Estimated Time to Production:** 3-4 days

---

## Phase 1: Production Blockers (Week 1) 🔴

**Priority:** CRITICAL | **Duration:** 3-4 days | **Status:** 🚨 BLOCKS PRODUCTION

### 1.1 Security Critical Fixes (Day 1-2)

#### Task 1.1.1: Implement Account Lockout
**Effort:** 4 hours | **Priority:** P0 - Critical

**Current State:**
- `intentosFallidos` field exists in Usuario model
- Field is tracked but not enforced
- Allows unlimited brute force login attempts

**Implementation:**
```javascript
// Location: backend/routes/auth.routes.js
// After line 70 (password validation fails)

// Increment failed attempts
await prisma.usuario.update({
  where: { id: user.id },
  data: {
    intentosFallidos: { increment: 1 },
    ultimoAcceso: new Date()
  }
});

// Check if account should be locked
if (user.intentosFallidos >= 4) { // Will be 5 after increment
  await prisma.usuario.update({
    where: { id: user.id },
    data: {
      activo: false,
      bloqueadoHasta: new Date(Date.now() + 15 * 60 * 1000) // 15 min
    }
  });

  return res.status(423).json({
    success: false,
    message: 'Cuenta bloqueada temporalmente. Intente en 15 minutos.',
    lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
  });
}

return res.status(401).json({
  success: false,
  message: `Credenciales inválidas. ${5 - user.intentosFallidos} intentos restantes.`
});
```

**Database Migration Needed:**
```prisma
// Add to Usuario model in schema.prisma
bloqueadoHasta  DateTime? @map("bloqueado_hasta")
```

**Acceptance Criteria:**
- [ ] Account locked after 5 failed attempts
- [ ] Lock lasts 15 minutes
- [ ] User informed of remaining attempts
- [ ] Lock automatically expires after 15 min
- [ ] Admin can manually unlock accounts
- [ ] Test coverage: 5 tests added

---

#### Task 1.1.2: Enable HTTPS Enforcement
**Effort:** 2 hours | **Priority:** P0 - Critical

**Current State:**
- HTTP allowed in all environments
- No redirect to HTTPS
- Credentials sent in cleartext

**Implementation:**
```javascript
// Location: backend/server-modular.js
// Add after line 13 (before middlewares)

// HTTPS enforcement for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  // Strict Transport Security
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });
}
```

**Environment Configuration:**
```bash
# Add to .env
NODE_ENV=production
FORCE_HTTPS=true
```

**Acceptance Criteria:**
- [ ] HTTP requests redirect to HTTPS in production
- [ ] HSTS header sent with 1-year max-age
- [ ] Development environment unchanged
- [ ] Test with curl/Postman
- [ ] Documentation updated

---

#### Task 1.1.3: Implement JWT Blacklist
**Effort:** 8 hours | **Priority:** P0 - Critical

**Current State:**
- JWT tokens valid until expiration (24h)
- Logout only client-side
- No server-side token invalidation

**Implementation:**

**Step 1: Install Redis**
```bash
cd backend
npm install redis ioredis
```

**Step 2: Create Redis Client**
```javascript
// Location: backend/utils/redis.js (new file)
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const blacklistToken = async (token, expiresIn = 86400) => {
  await redis.setex(`blacklist:${token}`, expiresIn, 'true');
};

const isTokenBlacklisted = async (token) => {
  const result = await redis.get(`blacklist:${token}`);
  return result === 'true';
};

module.exports = { redis, blacklistToken, isTokenBlacklisted };
```

**Step 3: Update Auth Middleware**
```javascript
// Location: backend/middleware/auth.middleware.js
// Add after line 26

const { isTokenBlacklisted } = require('../utils/redis');

// Inside authenticateToken, after line 27
const isBlacklisted = await isTokenBlacklisted(token);
if (isBlacklisted) {
  return res.status(401).json({
    success: false,
    message: 'Token ha sido revocado. Por favor inicie sesión nuevamente.'
  });
}
```

**Step 4: Update Logout Endpoint**
```javascript
// Location: backend/routes/auth.routes.js
// Replace POST /logout (lines 125-132)

const { blacklistToken } = require('../utils/redis');

router.post('/logout', authenticateToken, auditMiddleware('autenticacion'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Add token to blacklist for 24h (match JWT expiration)
    await blacklistToken(token, 86400);

    logger.logAuth('LOGOUT', req.user.id, { username: req.user.username });

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    logger.logError('LOGOUT', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Error cerrando sesión'
    });
  }
});
```

**Acceptance Criteria:**
- [ ] Redis installed and configured
- [ ] Tokens blacklisted on logout
- [ ] Blacklisted tokens rejected
- [ ] Tokens expire after 24h in Redis
- [ ] Graceful fallback if Redis down
- [ ] Test coverage: 8 tests added

---

### 1.2 Database & Testing Fixes (Day 3)

#### Task 1.2.1: Apply Pending Migration
**Effort:** 10 minutes | **Priority:** P0 - Critical

**Current State:**
- Migration `20251030_add_performance_indexes` pending
- Missing performance indexes

**Implementation:**
```bash
cd backend
npx prisma migrate deploy
```

**Verification:**
```bash
npx prisma migrate status
# Should show: "Database schema is up to date!"
```

**Acceptance Criteria:**
- [ ] Migration applied successfully
- [ ] No migration warnings
- [ ] Schema matches Prisma file
- [ ] Indexes verified in PostgreSQL

---

#### Task 1.2.2: Fix Test Cleanup FK Violations
**Effort:** 4 hours | **Priority:** P0 - Critical

**Current State:**
```
Foreign key constraint violated: `cirugias_quirofano_medico_id_fkey`
```

**Problem Analysis:**
Cleanup attempts to delete `empleados` before `cirugias_quirofano`, violating FK constraint.

**Implementation:**
```javascript
// Location: backend/tests/setupTests.js
// Replace cleanup function (lines 390-410)

async cleanupSolicitudesTestData() {
  try {
    // Delete in correct order respecting FK constraints

    // 1. Delete child records first
    await prisma.detalleSolicitudProducto.deleteMany({
      where: { solicitud: { numero: { startsWith: 'TEST-' } } }
    });

    await prisma.historialSolicitud.deleteMany({
      where: { solicitud: { numero: { startsWith: 'TEST-' } } }
    });

    await prisma.notificacionSolicitud.deleteMany({
      where: { solicitud: { numero: { startsWith: 'TEST-' } } }
    });

    // 2. Delete solicitudes
    await prisma.solicitudProductos.deleteMany({
      where: { numero: { startsWith: 'TEST-' } }
    });

    // 3. Delete related records
    await prisma.cirugiaQuirofano.deleteMany({
      where: { medico: { nombre: { startsWith: 'Test' } } }
    });

    await prisma.cuentaPaciente.deleteMany({
      where: { paciente: { nombre: 'Paciente' } }
    });

    await prisma.producto.deleteMany({
      where: { nombre: { startsWith: 'Test' } }
    });

    // 4. Now safe to delete parent records
    await prisma.paciente.deleteMany({
      where: { nombre: 'Paciente' }
    });

    await prisma.empleado.deleteMany({
      where: { nombre: { startsWith: 'Test' } }
    });

    await prisma.usuario.deleteMany({
      where: { username: { startsWith: 'test' } }
    });

  } catch (error) {
    console.warn('Warning: Error cleaning test data:', error.message);
  }
}
```

**Acceptance Criteria:**
- [ ] No FK violation warnings
- [ ] All test data cleaned properly
- [ ] Tests can run repeatedly
- [ ] No orphaned records
- [ ] Test pass rate improves

---

### 1.3 Fix Failing Tests (Day 4)

#### Task 1.3.1: Fix Inventory Tests (16 TODOs)
**Effort:** 4 hours | **Priority:** P1 - High

**Current State:**
- 15/42 tests failing (36% failure rate)
- 16 TODO comments indicating issues

**Key Issues to Fix:**
1. `POST /api/inventory/products` response structure mismatch
2. `PUT /api/inventory/products/:id` response format
3. `DELETE /api/inventory/products/:id` not implemented
4. `contactoNombre` validation unclear

**Implementation Strategy:**
```javascript
// Review each TODO in tests/inventory/inventory.test.js
// Compare expected vs actual responses
// Fix either test expectations or API implementation
```

**Acceptance Criteria:**
- [ ] All 16 TODOs resolved
- [ ] Inventory tests pass rate > 90%
- [ ] Response structures documented
- [ ] Validation rules clarified

---

#### Task 1.3.2: Fix Quirófano Tests (9 TODOs)
**Effort:** 3 hours | **Priority:** P1 - High

**Current State:**
- 15/35 tests failing (43% failure rate)
- 9 TODO comments indicating missing validations

**Key Issues to Fix:**
1. Search parameter handling in `GET /api/quirofanos`
2. Date validation in `POST /api/quirofanos/cirugias`
3. Date range validation
4. Error handling improvements

**Acceptance Criteria:**
- [ ] All 9 TODOs resolved
- [ ] Quirófano tests pass rate > 90%
- [ ] Date validations added
- [ ] Error messages improved

---

## Phase 2: Testing & Stability (Week 2-3) 🟡

**Priority:** HIGH | **Duration:** 1.5 weeks | **Status:** Improves Reliability

### 2.1 Improve Test Coverage

#### Task 2.1.1: Enable Jest Coverage Reports
**Effort:** 2 hours | **Priority:** P1 - High

**Implementation:**
```json
// Location: backend/package.json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=html"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 80,
        "statements": 80
      }
    },
    "collectCoverageFrom": [
      "routes/**/*.js",
      "middleware/**/*.js",
      "utils/**/*.js",
      "!**/node_modules/**",
      "!**/tests/**"
    ]
  }
}
```

**Acceptance Criteria:**
- [ ] Coverage reports generated
- [ ] HTML reports viewable
- [ ] Baseline coverage documented
- [ ] CI/CD integration ready

---

#### Task 2.1.2: Add Missing Module Tests
**Effort:** 1 day | **Priority:** P1 - High

**Modules Without Tests:**
1. `audit.routes.js` - 3 endpoints
2. `reports.routes.js` - 12 endpoints
3. `notificaciones.routes.js` - 4 endpoints

**Target:** Add 30+ tests covering these modules

**Acceptance Criteria:**
- [ ] Audit tests: 6 tests added
- [ ] Reports tests: 15 tests added
- [ ] Notifications tests: 9 tests added
- [ ] All tests passing

---

#### Task 2.1.3: Add Middleware Unit Tests
**Effort:** 1 day | **Priority:** P2 - Medium

**Middleware to Test:**
1. `auth.middleware.js` - 3 functions
2. `audit.middleware.js` - 3 functions
3. `validation.middleware.js` - Multiple validators

**Target:** 80% coverage on middleware

**Acceptance Criteria:**
- [ ] Auth middleware: 10 tests
- [ ] Audit middleware: 8 tests
- [ ] Validation middleware: 12 tests
- [ ] Mock Prisma properly

---

### 2.2 Target 85% Coverage

**Current:** ~30% estimated
**Target:** 85% overall coverage
**Effort:** 2 days

**Focus Areas:**
1. Utilities (database.js, helpers.js, logger.js)
2. Legacy endpoints in server-modular.js
3. Error paths and edge cases

---

## Phase 3: Performance Optimization (Week 4-5) 🟢

**Priority:** MEDIUM | **Duration:** 2 weeks | **Status:** Improves Scalability

### 3.1 Implement Redis Caching (Week 4)

#### Task 3.1.1: Install and Configure Redis
**Effort:** 4 hours | **Priority:** P2 - Medium

**Implementation:**
```bash
# Install Redis locally
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server
```

**Configuration:**
```javascript
// backend/utils/cache.js (new file)
const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 1, // Use DB 1 for cache (DB 0 for JWT blacklist)
  keyPrefix: 'cache:',
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
});

const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null; // Fail gracefully
    }
  },

  async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache SET error:', error);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache DEL error:', error);
    }
  },

  async invalidatePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }
};

module.exports = cache;
```

---

#### Task 3.1.2: Cache Frequently Accessed Data
**Effort:** 1 day | **Priority:** P2 - Medium

**Endpoints to Cache:**

1. **Services (30min TTL)**
```javascript
// routes/services.routes.js
router.get('/api/services', async (req, res) => {
  const cacheKey = 'services:active';
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: { items: cached },
      cached: true
    });
  }

  const servicios = await prisma.servicio.findMany({
    where: { activo: true }
  });

  await cache.set(cacheKey, servicios, 1800); // 30min
  res.json({ success: true, data: { items: servicios } });
});
```

2. **Suppliers (15min TTL)**
3. **Active Employees (5min TTL)**
4. **Patient Stats (2min TTL)**

**Cache Invalidation:**
```javascript
// Invalidate on POST/PUT/DELETE
router.post('/api/services', async (req, res) => {
  // ... create service
  await cache.del('services:active');
  res.json({ success: true, data: newService });
});
```

---

### 3.2 Query Performance Monitoring (Week 5)

#### Task 3.2.1: Enable Prisma Query Logging
**Effort:** 2 hours | **Priority:** P2 - Medium

**Implementation:**
```javascript
// backend/utils/database.js
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'stdout', level: 'warn' }
  ]
});

// Log slow queries (> 100ms)
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params
    });
  }
});
```

---

#### Task 3.2.2: Batch Audit Log Inserts
**Effort:** 4 hours | **Priority:** P2 - Medium

**Current:** Individual inserts on every operation
**Target:** Batch inserts every 5 seconds

**Implementation:**
```javascript
// backend/middleware/audit.middleware.js
const auditBuffer = [];
let flushTimer = null;

const flushAuditLogs = async () => {
  if (auditBuffer.length === 0) return;

  const logsToInsert = [...auditBuffer];
  auditBuffer.length = 0;

  try {
    await prisma.auditoriaOperacion.createMany({
      data: logsToInsert,
      skipDuplicates: true
    });
    logger.info(`✅ Flushed ${logsToInsert.length} audit logs`);
  } catch (error) {
    logger.error('Error flushing audit logs:', error);
  }
};

// Replace setImmediate with buffer (line 35)
auditBuffer.push(auditData);

// Start flush timer if not running
if (!flushTimer) {
  flushTimer = setInterval(flushAuditLogs, 5000);
}
```

---

#### Task 3.2.3: Refactor Large Transaction
**Effort:** 1 day | **Priority:** P2 - Medium

**Location:** `server-modular.js` lines 380-667 (287 lines)
**Target:** Break into service functions

**New Structure:**
```javascript
// backend/services/patient-accounts.service.js (new file)
class PatientAccountService {
  async closeAccount(accountId, userId, paymentDetails) {
    // Validate account
    const account = await this.validateAccount(accountId);

    // Calculate charges
    const charges = await this.calculateCharges(account);

    // Create invoice
    const invoice = await this.createInvoice(account, charges);

    // Process payment
    await this.processPayment(invoice, paymentDetails);

    // Discharge patient
    await this.dischargePatient(account);

    return { account, invoice };
  }

  // ... split into 8-10 focused functions
}
```

---

## Phase 4: Architecture Improvements (Week 6-7) 🟢

**Priority:** MEDIUM | **Duration:** 2 weeks | **Status:** Code Maintainability

### 4.1 Extract Legacy Endpoints (Day 1)

**Task 4.1.1: Create Missing Route Files**
**Effort:** 4 hours | **Priority:** P3 - Medium

**Files to Create:**
1. `backend/routes/services.routes.js` (1 endpoint)
2. Move `/api/patient-accounts/*` to `pos.routes.js` (4 endpoints)

**Target:** Reduce `server-modular.js` from 1,115 to ~300 lines

---

### 4.2 Standardize API Design (Day 2-3)

**Task 4.2.1: API Naming Convention**
**Effort:** 1 day | **Priority:** P3 - Medium

**Decision:** Use kebab-case consistently
- `/api/patient-accounts` ✅
- `/api/available-numbers` ✅
- `/api/accounts-receivable` ✅

**Refactor:** 8 endpoints using camelCase

---

### 4.3 Create Config Module (Day 4)

**Task 4.3.1: Centralize Environment Variables**
**Effort:** 4 hours | **Priority:** P3 - Medium

**Implementation:**
```javascript
// backend/config/index.js (new file)
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('24h'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  RATE_LIMIT_WINDOW: Joi.number().default(900000), // 15min
  RATE_LIMIT_MAX: Joi.number().default(100),
  BCRYPT_ROUNDS: Joi.number().default(12)
}).unknown();

const { error, value: config } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = config;
```

**Replace:** 33 `process.env` references with `config.*`

---

## Phase 5: Documentation (Week 8-9) ⚪

**Priority:** LOW | **Duration:** 2 weeks | **Status:** Developer Experience

### 5.1 Generate OpenAPI/Swagger Docs (Week 8)

**Task 5.1.1: Install Swagger Tools**
**Effort:** 4 hours

```bash
npm install swagger-jsdoc swagger-ui-express
```

**Task 5.1.2: Document All 121 Endpoints**
**Effort:** 2 days

**Target:** OpenAPI 3.0 specification with examples

---

### 5.2 Create Developer Guides (Week 9)

**Task 5.2.1: Onboarding Guide**
**Effort:** 1 day

**Contents:**
1. Setup instructions
2. Database schema overview
3. Authentication flow
4. Common development tasks
5. Testing guidelines

**Task 5.2.2: Architecture Documentation**
**Effort:** 1 day

**Contents:**
1. System architecture diagram
2. Data flow diagrams
3. Security architecture
4. Deployment architecture

---

## Summary & Timeline

### Critical Path (Production Blockers)

```
Week 1: Security & Critical Fixes
├── Day 1: Account lockout + HTTPS (6h)
├── Day 2: JWT blacklist (8h)
├── Day 3: Migration + FK fixes (5h)
└── Day 4: Fix failing tests (7h)

Total: 26 hours (3-4 days)
Status: 🔴 BLOCKS PRODUCTION
```

### Post-Production Improvements

```
Week 2-3: Testing & Stability (80h)
Week 4-5: Performance (80h)
Week 6-7: Architecture (80h)
Week 8-9: Documentation (80h)

Total: 320 hours (8 weeks)
Status: 🟢 ENHANCES QUALITY
```

---

## Success Metrics

### Week 1 Targets (Production Blockers)
- [ ] Account lockout: ✅ Implemented and tested
- [ ] HTTPS: ✅ Enforced in production
- [ ] JWT blacklist: ✅ Redis integrated
- [ ] Migration: ✅ Applied successfully
- [ ] FK violations: ✅ Fixed, no warnings
- [ ] Test pass rate: ✅ > 90% (from 78.5%)

### Month 1 Targets (Post-Production)
- [ ] Test coverage: ✅ > 85% (from ~30%)
- [ ] Redis caching: ✅ 30-50% query reduction
- [ ] Query monitoring: ✅ Slow queries detected
- [ ] Legacy endpoints: ✅ All extracted
- [ ] API standardization: ✅ Consistent naming

### Quarter 1 Targets (Long-term)
- [ ] OpenAPI docs: ✅ 121 endpoints documented
- [ ] Horizontal scaling: ✅ Load balancer configured
- [ ] E2E tests: ✅ Critical workflows covered
- [ ] Monitoring: ✅ Prometheus + Grafana

---

## Risk Mitigation

### High-Risk Items
1. **Redis Integration**: Can fail gracefully, cache optional
2. **Large Refactoring**: Break into small commits with tests
3. **Database Changes**: Test in development first, backup production
4. **API Changes**: Version endpoints, maintain backward compatibility

### Rollback Plans
1. **Account Lockout**: Feature flag to disable
2. **JWT Blacklist**: Fallback to old behavior if Redis down
3. **Migration**: Prisma has rollback commands
4. **Test Fixes**: Git revert individual commits

---

## Resource Requirements

### Team Allocation
- **Backend Developer (Senior)**: Full-time, Weeks 1-9
- **DevOps Engineer**: Part-time, Weeks 1, 4-5 (Redis setup)
- **QA Engineer**: Part-time, Weeks 1-3 (test fixes)

### Infrastructure
- **Redis Server**: Development + Production
- **Monitoring**: Prometheus/Grafana setup
- **CI/CD**: GitHub Actions configuration

### Budget Estimate
- **Development**: 320 hours @ $80/hr = $25,600
- **Infrastructure**: ~$100/month (Redis hosting)
- **Tools/Services**: ~$50/month (monitoring)

**Total:** ~$26,000 for complete backend optimization

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Review this action plan with team
2. ✅ Prioritize Phase 1 tasks
3. ✅ Set up development environment (Redis, etc.)
4. ✅ Create GitHub issues for each task
5. ✅ Assign tasks to developers

### Ongoing
- Daily standup to track progress
- Weekly review of test coverage
- Monthly review of performance metrics
- Quarterly architectural review

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Owner:** Backend Research Specialist
**Status:** ✅ Ready for Review and Execution

---
