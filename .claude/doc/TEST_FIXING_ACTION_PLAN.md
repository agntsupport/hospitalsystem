# Test Fixing Action Plan
**Hospital Management System - Test Stabilization Roadmap**

**Date:** October 30, 2025
**Current Status:** 93/151 tests passing (61.5%)
**Target:** 136/151 tests passing (90%+)
**Timeline:** 1-2 weeks

---

## CURRENT TEST STATUS

### Backend Test Results

```
Test Suites: 6 failed, 1 passed, 7 total
Tests:       58 failed, 93 passed, 151 total
Pass Rate:   61.5%
```

### Test Suite Breakdown

| Suite | Status | Tests | Pass Rate | Priority |
|-------|--------|-------|-----------|----------|
| auth.test.js | PASS | 10/10 | 100% | N/A |
| simple.test.js | FAIL | ~18/19 | ~95% | LOW |
| patients.test.js | FAIL | ~13/16 | ~81% | MEDIUM |
| inventory.test.js | FAIL | ~11/29 | ~38% | HIGH |
| middleware.test.js | FAIL | Unknown | Unknown | HIGH |
| quirofanos.test.js | FAIL | ~27/36 | ~75% | MEDIUM |
| solicitudes.test.js | FAIL | Unknown | Unknown | HIGH |

---

## ROOT CAUSES IDENTIFIED

### 1. Test Infrastructure Issues

**Problem:** Test helpers not updated after recent changes
- bcrypt integration issues (password hashing)
- Field naming inconsistencies (nombreUsuario → username)
- Prisma model naming (snake_case vs camelCase)

**Impact:** 30-40 tests failing

### 2. Foreign Key Constraint Violations

**Problem:** Solicitudes tests fail due to FK constraints
- Missing patient records
- Missing cuenta_paciente records
- Invalid user IDs

**Impact:** ~10-15 tests failing

### 3. Middleware Test Configuration

**Problem:** Server startup issues in middleware tests
- Open handles not closed
- Database connections not cleaned up
- Test isolation issues

**Impact:** Unknown (all middleware tests failing)

### 4. Setup/Teardown Issues

**Problem:** Tests not properly cleaning up
- Database state pollution between tests
- Prisma client not reset
- Open connections

**Impact:** Intermittent failures ~5-10 tests

---

## FIXING STRATEGY

### PHASE 1: Quick Wins (Days 1-2)

**Goal:** Fix 15-20 easy tests to reach 75% pass rate

**Tasks:**

1. **Fix simple.test.js (1 failing test)**
   - Investigate single failing test
   - Likely assertion or data issue
   - Effort: 30 minutes

2. **Update Test Helpers**
   - Fix bcrypt integration in createTestUser
   - Update field naming (nombreUsuario → username)
   - Update Prisma model references
   - Effort: 2-3 hours

3. **Fix patients.test.js (3 failing tests)**
   - Update test data structures
   - Fix field name references
   - Verify API response formats
   - Effort: 2-3 hours

**Expected Result:** 108/151 tests passing (71%)

---

### PHASE 2: Medium Complexity (Days 3-5)

**Goal:** Fix inventory and quirofanos tests to reach 85% pass rate

**Tasks:**

1. **Fix inventory.test.js (18 failing tests)**
   - Update supplier test factory
   - Fix product test factory
   - Update movement test data
   - Fix API response parsing
   - Effort: 6-8 hours

2. **Fix quirofanos.test.js (9 failing tests)**
   - Update surgery test data
   - Fix FK constraint issues
   - Update field references
   - Test recent route fixes
   - Effort: 4-6 hours

**Expected Result:** 135/151 tests passing (89%)

---

### PHASE 3: Complex Issues (Days 6-7)

**Goal:** Fix middleware and solicitudes tests to reach 90%+ pass rate

**Tasks:**

1. **Fix middleware.test.js**
   - Implement proper server startup/shutdown
   - Fix test isolation
   - Close database connections
   - Update auth middleware tests
   - Effort: 4-6 hours

2. **Fix solicitudes.test.js**
   - Create complete test data dependencies
   - Fix FK constraint issues
   - Add proper patient/cuenta setup
   - Test notification system
   - Effort: 4-6 hours

**Expected Result:** 136-140/151 tests passing (90-93%)

---

### PHASE 4: Cleanup (Days 8-10)

**Goal:** Final cleanup and optimization

**Tasks:**

1. **Test Optimization**
   - Remove duplicate tests
   - Improve test data factories
   - Add helper utilities
   - Document test patterns
   - Effort: 4-6 hours

2. **Documentation**
   - Document test fixing process
   - Create test writing guide
   - Update test README
   - Add troubleshooting guide
   - Effort: 2-3 hours

3. **CI/CD Preparation**
   - Create test run scripts
   - Configure GitHub Actions
   - Add coverage reporting
   - Setup test monitoring
   - Effort: 3-4 hours

**Expected Result:** 140+/151 tests passing (93%+)

---

## DETAILED FIXING GUIDE

### Step 1: Update Test Helpers

**File:** `backend/tests/helpers/testHelpers.js`

**Changes needed:**

```javascript
// Add bcrypt to createTestUser
const bcrypt = require('bcryptjs');

async function createTestUser(data = {}) {
  const passwordHash = await bcrypt.hash(
    data.password || 'test123',
    10
  );

  return await prisma.usuario.create({
    data: {
      username: data.username || 'testuser',  // NOT nombreUsuario
      passwordHash,  // Use hashed password
      email: data.email || 'test@test.com',
      rol: data.rol || 'enfermero',
      activo: true
    }
  });
}
```

### Step 2: Fix Field Naming Issues

**Search and replace in all test files:**

- `nombreUsuario` → `username`
- `cargo` → `tipoEmpleado`
- Snake_case field names → camelCase

### Step 3: Fix Foreign Key Dependencies

**Pattern for solicitudes tests:**

```javascript
// Always create in order:
// 1. Patient
const patient = await createTestPatient();

// 2. User (for cuenta)
const user = await createTestUser({ rol: 'cajero' });

// 3. CuentaPaciente
const cuenta = await prisma.cuentaPaciente.create({
  data: {
    pacienteId: patient.id,
    tipoAtencion: 'hospitalizacion',
    cajeroAperturaId: user.id,
    // ... rest of fields
  }
});

// 4. Solicitud (now FK constraints satisfied)
const solicitud = await prisma.solicitudProductos.create({
  data: {
    pacienteId: patient.id,
    cuentaPacienteId: cuenta.id,
    solicitanteId: user.id,
    // ... rest of fields
  }
});
```

### Step 4: Fix Server Startup/Shutdown

**Pattern for middleware tests:**

```javascript
// Use conditional server start
let server;

beforeAll(async () => {
  if (!global.testServer) {
    const app = require('../server-modular');
    server = app.listen(0); // Random port
    global.testServer = server;
  }
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});
```

---

## TEST FIXING CHECKLIST

### Pre-Fixing Setup

- [ ] Backup current test files
- [ ] Document current failures
- [ ] Set up test monitoring
- [ ] Create fixing branch

### Phase 1 Tasks

- [ ] Fix simple.test.js (1 test)
- [ ] Update createTestUser with bcrypt
- [ ] Fix field naming (nombreUsuario → username)
- [ ] Update Prisma model references
- [ ] Fix patients.test.js (3 tests)
- [ ] Run tests and verify 71%+ pass rate

### Phase 2 Tasks

- [ ] Fix inventory supplier factory
- [ ] Fix inventory product factory
- [ ] Update inventory API tests
- [ ] Fix quirofanos FK constraints
- [ ] Update quirofanos test data
- [ ] Run tests and verify 85%+ pass rate

### Phase 3 Tasks

- [ ] Fix middleware server startup
- [ ] Implement proper test isolation
- [ ] Close database connections properly
- [ ] Fix solicitudes FK dependencies
- [ ] Add patient/cuenta setup helpers
- [ ] Run tests and verify 90%+ pass rate

### Phase 4 Tasks

- [ ] Optimize test data factories
- [ ] Remove duplicate tests
- [ ] Document test patterns
- [ ] Create test writing guide
- [ ] Setup CI/CD
- [ ] Add coverage reporting

---

## SUCCESS METRICS

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Pass Rate | 61.5% | 90%+ | Week 1 |
| Passing Tests | 93/151 | 136/151 | Week 1 |
| Test Suites Passing | 1/7 | 6/7 | Week 1 |
| Setup Time | Unknown | <5 min | Week 2 |
| CI/CD Integration | No | Yes | Week 2 |

---

## RISK MITIGATION

### High Risk

**Risk:** Breaking currently passing tests
**Mitigation:**
- Run full test suite after each change
- Fix one suite at a time
- Use Git branches for each phase

### Medium Risk

**Risk:** FK constraint fixes break other tests
**Mitigation:**
- Create comprehensive test data factories
- Document FK dependencies
- Use transaction rollbacks

### Low Risk

**Risk:** Time overrun
**Mitigation:**
- Focus on high-impact fixes first
- Document blockers immediately
- Parallel work on independent suites

---

## TESTING BEST PRACTICES

### Moving Forward

1. **Always use test helpers**
   - createTestUser (with bcrypt)
   - createTestPatient
   - createTestSupplier
   - createTestProduct

2. **Proper test isolation**
   - Clean database between tests
   - Use transactions when possible
   - Close all connections

3. **FK constraint awareness**
   - Create dependencies in correct order
   - Use cascading deletes
   - Document relationships

4. **Consistent naming**
   - Use camelCase (Prisma convention)
   - Match schema exactly
   - Update tests when schema changes

---

## RESOURCES

### Helpful Commands

```bash
# Run all tests
npm test

# Run specific suite
npm test auth.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Verbose output
npm test -- --verbose
```

### Documentation

- Test helpers: `backend/tests/helpers/testHelpers.js`
- Prisma schema: `backend/prisma/schema.prisma`
- Test config: `backend/jest.config.js`

---

## TIMELINE SUMMARY

| Week | Focus | Tasks | Expected Pass Rate |
|------|-------|-------|-------------------|
| Week 1, Days 1-2 | Quick Wins | Simple + helpers + patients | 71% |
| Week 1, Days 3-5 | Medium | Inventory + quirofanos | 89% |
| Week 1, Days 6-7 | Complex | Middleware + solicitudes | 93% |
| Week 2, Days 8-10 | Cleanup | Optimization + docs + CI/CD | 93%+ |

**Total Effort:** 30-40 hours
**Total Cost:** $1,500 - $2,000 (@ $50/hour)

---

## CONCLUSION

Fixing the failing tests is achievable in 1-2 weeks with focused effort. The issues are well-understood and primarily related to:

1. Test infrastructure updates (helpers, bcrypt)
2. Field naming consistency
3. FK constraint setup
4. Server startup/shutdown

Following this action plan systematically will bring the test suite from 61.5% to 90%+ pass rate, making the system production-ready.

---

**Created by:** QA Acceptance Validator Agent
**Date:** October 30, 2025
**Status:** READY FOR EXECUTION
