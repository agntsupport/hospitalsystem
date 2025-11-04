# Frontend Improvement Action Plan
**Sistema de Gestión Hospitalaria Integral**

**Fecha:** 3 de Noviembre de 2025
**Objetivo:** Elevar calificación de 8.7/10 a 9.2/10
**Timeline:** 2-4 sprints (4-8 semanas)

---

## Phase 1: High-Impact Optimizations (Sprint 1-2)

### Task 1.1: Implement React.memo in List Components

**Priority:** P1 - Critical
**Effort:** 2-3 days
**Impact:** +10-15% performance
**Score Gain:** +0.2 points

**Subtasks:**

1. **Identify Candidates** (4 hours)
   - List all components rendered in loops
   - Prioritize DataGrid rows, cards, list items
   - Document props that change frequently

2. **Implement React.memo** (1.5 days)
   ```typescript
   // Target files:
   - src/pages/patients/PatientsTab.tsx (patient rows)
   - src/pages/inventory/ProductsTab.tsx (product cards)
   - src/pages/employees/EmployeesPage.tsx (employee rows)
   - src/components/pos/OpenAccountsList.tsx (account items)
   - src/components/billing/BillingStatsCards.tsx (stat cards)

   // Pattern:
   const ComponentName = React.memo(({ prop1, prop2 }) => {
     return ( ... );
   }, (prevProps, nextProps) => {
     // Custom comparison if needed
     return prevProps.id === nextProps.id &&
            prevProps.updatedAt === nextProps.updatedAt;
   });
   ```

3. **Add Performance Tests** (0.5 day)
   - Measure renders with React DevTools Profiler
   - Before/after comparison
   - Document improvements

**Acceptance Criteria:**
- [ ] At least 15 components wrapped with React.memo
- [ ] Performance improvement measured and documented
- [ ] No functional regressions
- [ ] All tests passing

**Files to Modify:**
- [ ] `src/pages/patients/PatientsTab.tsx`
- [ ] `src/pages/inventory/ProductsTab.tsx`
- [ ] `src/pages/employees/EmployeesPage.tsx`
- [ ] `src/components/pos/OpenAccountsList.tsx`
- [ ] `src/components/pos/AccountHistoryList.tsx`
- [ ] `src/components/billing/BillingStatsCards.tsx`
- [ ] `src/pages/reports/ExecutiveDashboardTab.tsx`
- [ ] 8+ more component files

---

### Task 1.2: Fix Failing UI Tests

**Priority:** P1 - High
**Effort:** 5-7 days
**Impact:** Coverage 25% → 70%
**Score Gain:** +0.3 points

**Subtasks:**

1. **Setup MSW (Mock Service Worker)** (1 day)
   ```bash
   npm install --save-dev msw
   ```

   ```typescript
   // src/mocks/handlers.ts
   import { rest } from 'msw';

   export const handlers = [
     rest.get('/api/patients', (req, res, ctx) => {
       return res(ctx.json({
         success: true,
         data: { patients: mockPatients, pagination: mockPagination }
       }));
     }),
     // ... more handlers
   ];

   // src/mocks/server.ts
   import { setupServer } from 'msw/node';
   import { handlers } from './handlers';

   export const server = setupServer(...handlers);
   ```

2. **Complete Service Mocks** (2 days)
   - [ ] `src/services/__mocks__/patientsService.ts` (completar)
   - [ ] `src/services/__mocks__/inventoryService.ts` (crear)
   - [ ] `src/services/__mocks__/employeeService.ts` (crear)
   - [ ] `src/services/__mocks__/quirofanosService.ts` (completar)
   - Ensure all mocks match TypeScript interfaces

3. **Fix PatientFormDialog Tests** (1 day)
   - [ ] `src/pages/patients/__tests__/PatientFormDialog.test.tsx`
   - Complete Redux store mock
   - Fix stepper navigation tests
   - Address 85 failing tests

4. **Fix PatientsTab Tests** (1 day)
   - [ ] `src/pages/patients/__tests__/PatientsTab.test.tsx`
   - Mock DataGrid correctly
   - Fix pagination tests
   - Address 60 failing tests

5. **Fix ProductFormDialog Tests** (1 day)
   - [ ] `src/pages/inventory/__tests__/ProductFormDialog.test.tsx`
   - Mock inventory service
   - Fix form validation tests
   - Address 60 failing tests

6. **Fix CirugiaFormDialog Tests** (0.5 day)
   - [ ] `src/pages/quirofanos/__tests__/CirugiaFormDialog.test.tsx`
   - Already partially fixed, complete remaining

7. **Add Missing Component Tests** (0.5 day)
   - Create tests for components without coverage
   - Focus on critical paths

**Acceptance Criteria:**
- [ ] MSW configured and working
- [ ] All service mocks complete and typed
- [ ] 0 failing tests (312/312 passing)
- [ ] Coverage: Components 20% → 70%
- [ ] Coverage: Pages 25% → 70%

**Test Count Target:**
- Current: 227 passing / 85 failing
- Target: 312 passing / 0 failing

---

### Task 1.3: Increase useMemo Usage

**Priority:** P1 - High
**Effort:** 1-2 days
**Impact:** Reduce redundant calculations
**Score Gain:** +0.1 points

**Subtasks:**

1. **Identify Expensive Calculations** (4 hours)
   - Profile components with React DevTools
   - Find calculations in render functions
   - Document candidates for useMemo

2. **Implement useMemo** (1 day)
   ```typescript
   // Target locations:

   // 1. Statistics calculations
   // src/pages/patients/PatientsPage.tsx
   const patientStats = useMemo(() => {
     return calculatePatientStats(patients);
   }, [patients]);

   // 2. Filtered lists
   // src/pages/inventory/ProductsTab.tsx
   const filteredProducts = useMemo(() => {
     return products.filter(p =>
       p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
       p.stock >= minStock
     );
   }, [products, searchTerm, minStock]);

   // 3. Chart data transformations
   // src/pages/reports/ExecutiveDashboardTab.tsx
   const chartData = useMemo(() => {
     return transformDataForChart(rawData);
   }, [rawData]);

   // 4. Sorted arrays
   const sortedPatients = useMemo(() => {
     return [...patients].sort((a, b) => a.nombre.localeCompare(b.nombre));
   }, [patients]);

   // 5. Complex derivations
   const patientsByAge = useMemo(() => {
     return groupPatientsByAgeGroup(patients);
   }, [patients]);
   ```

3. **Target Files** (15 implementations)
   - [ ] `src/pages/patients/PatientsPage.tsx` (stats)
   - [ ] `src/pages/inventory/InventoryPage.tsx` (stats, filters)
   - [ ] `src/pages/reports/ExecutiveDashboardTab.tsx` (charts)
   - [ ] `src/pages/billing/BillingPage.tsx` (calculations)
   - [ ] `src/pages/hospitalization/HospitalizationPage.tsx` (filters)
   - [ ] `src/components/reports/ReportChart.tsx` (data transform)
   - [ ] 9+ more locations

4. **Performance Testing** (2 hours)
   - Measure before/after with Profiler
   - Document improvements

**Acceptance Criteria:**
- [ ] At least 15 new useMemo implementations
- [ ] Performance improvement measured
- [ ] No functional regressions
- [ ] All tests passing

---

## Phase 2: Code Quality Improvements (Sprint 3)

### Task 2.1: Refactor Large Components

**Priority:** P2 - Medium
**Effort:** 3-4 days
**Impact:** Better maintainability
**Score Gain:** +0.1 points

**Target Components:**

1. **HospitalizationPage (800 LOC) → 4 components**
   ```
   src/pages/hospitalization/
   ├── HospitalizationPage.tsx (150 LOC)
   ├── components/
   │   ├── AdmissionsTable.tsx (200 LOC)
   │   ├── AdmissionFilters.tsx (100 LOC)
   │   ├── AdmissionStats.tsx (150 LOC)
   │   └── index.ts
   └── [existing dialogs]
   ```

2. **EmployeesPage (778 LOC) → 4 components**
   ```
   src/pages/employees/
   ├── EmployeesPage.tsx (150 LOC)
   ├── components/
   │   ├── EmployeesTable.tsx (200 LOC)
   │   ├── EmployeeFilters.tsx (100 LOC)
   │   ├── EmployeeStats.tsx (150 LOC)
   │   └── index.ts
   └── [existing dialogs]
   ```

3. **SolicitudFormDialog (707 LOC) → 3 components**
   ```
   src/pages/solicitudes/
   ├── SolicitudFormDialog.tsx (250 LOC)
   ├── components/
   │   ├── SolicitudBasicInfo.tsx (200 LOC)
   │   ├── SolicitudItemsList.tsx (200 LOC)
   │   └── index.ts
   ```

**Acceptance Criteria:**
- [ ] All 3 components refactored
- [ ] Each file <400 LOC
- [ ] Functionality preserved
- [ ] Tests updated and passing
- [ ] Props interfaces documented

---

### Task 2.2: Consolidate Duplicate Types

**Priority:** P2 - Medium
**Effort:** 1 day
**Impact:** Cleaner codebase
**Score Gain:** +0.05 points

**Subtasks:**

1. **Merge patient types** (4 hours)
   - Merge `patient.types.ts` and `patients.types.ts`
   - Keep in `patient.types.ts`
   - Update all imports

2. **Review other duplications** (2 hours)
   - Check for other type duplications
   - Consolidate if found

3. **Update imports** (2 hours)
   - Find all imports with `patients.types`
   - Replace with `patient.types`
   - Verify build passes

**Acceptance Criteria:**
- [ ] Only 1 patient types file exists
- [ ] All imports updated
- [ ] No TypeScript errors
- [ ] All tests passing

---

### Task 2.3: Implement Reselect Selectors

**Priority:** P2 - Medium
**Effort:** 2-3 days
**Impact:** Performance in state derivations
**Score Gain:** +0.05 points

**Subtasks:**

1. **Install reselect** (5 min)
   ```bash
   npm install reselect
   ```

2. **Create selectors for authSlice** (1 day)
   ```typescript
   // src/store/slices/authSlice.ts
   import { createSelector } from '@reduxjs/toolkit';

   // Base selectors
   const selectAuthState = (state: RootState) => state.auth;

   // Memoized selectors
   export const selectUser = createSelector(
     [selectAuthState],
     (auth) => auth.user
   );

   export const selectUserRole = createSelector(
     [selectUser],
     (user) => user?.rol
   );

   export const selectIsAdmin = createSelector(
     [selectUserRole],
     (role) => role === 'administrador'
   );
   ```

3. **Create selectors for patientsSlice** (1 day)
   ```typescript
   // src/store/slices/patientsSlice.ts
   export const selectFilteredPatients = createSelector(
     [(state: RootState) => state.patients.patients,
      (state: RootState) => state.patients.filters],
     (patients, filters) => {
       return patients.filter(patient => {
         if (filters.search && !patient.nombre.includes(filters.search)) {
           return false;
         }
         if (filters.esMenorEdad !== undefined &&
             patient.esMenorEdad !== filters.esMenorEdad) {
           return false;
         }
         return true;
       });
     }
   );
   ```

4. **Update components to use selectors** (0.5 day)

**Acceptance Criteria:**
- [ ] Selectors created for all 3 slices
- [ ] Components updated to use selectors
- [ ] Performance improvement measured
- [ ] Tests passing

---

### Task 2.4: Fix TypeScript Errors in Tests

**Priority:** P2 - Medium
**Effort:** 1-2 days
**Impact:** Complete type safety
**Score Gain:** +0.05 points

**Subtasks:**

1. **Fix useAccountHistory test types** (4 hours)
   - Complete PatientAccount mocks with all required fields
   - Fix null assignments

2. **Fix usePatientForm test types** (2 hours)
   - Fix null assignments to Patient type

3. **Fix usePatientSearch test types** (4 hours)
   - Remove 'offset' from pagination mocks
   - Fix null assignments

4. **Verify all tests** (2 hours)
   ```bash
   npx tsc --noEmit
   ```
   - Should show 0 errors

**Acceptance Criteria:**
- [ ] 0 TypeScript errors in entire codebase
- [ ] All mocks match interfaces
- [ ] Tests still passing

---

## Phase 3: Nice-to-Have Improvements (Sprint 4 - Optional)

### Task 3.1: Add Error Boundaries

**Priority:** P3 - Low
**Effort:** 1 day
**Impact:** Better error handling

**Implementation:**

```typescript
// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error reporting service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box p={4} textAlign="center">
          <Typography variant="h5" color="error">
            Algo salió mal
          </Typography>
          <Button onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <Router>...</Router>
</ErrorBoundary>
```

**Acceptance Criteria:**
- [ ] ErrorBoundary component created
- [ ] Wrapped around App in main.tsx
- [ ] Error states tested
- [ ] Fallback UI designed

---

### Task 3.2: Virtual Scrolling for Custom Lists (Optional)

**Priority:** P3 - Low
**Effort:** 1-2 days

Only implement if:
- Lists exceed 500 items regularly
- Not using DataGrid (which has built-in virtualization)

**Libraries to Consider:**
- react-window
- react-virtualized

---

## Timeline & Resource Allocation

### Sprint 1 (Weeks 1-2)
**Focus:** High-impact optimizations

| Task | Days | Assignee | Dependencies |
|------|------|----------|--------------|
| 1.1 React.memo | 2-3 | Frontend Dev | None |
| 1.3 useMemo | 1-2 | Frontend Dev | None |

**Total:** 3-5 days

### Sprint 2 (Weeks 3-4)
**Focus:** Testing improvements

| Task | Days | Assignee | Dependencies |
|------|------|----------|--------------|
| 1.2 Fix UI Tests | 5-7 | Frontend Dev + QA | None |

**Total:** 5-7 days

### Sprint 3 (Weeks 5-6)
**Focus:** Code quality

| Task | Days | Assignee | Dependencies |
|------|------|----------|--------------|
| 2.1 Refactor Large Components | 3-4 | Frontend Dev | None |
| 2.2 Consolidate Types | 1 | Frontend Dev | None |
| 2.3 Reselect Selectors | 2-3 | Frontend Dev | None |
| 2.4 Fix TS Errors in Tests | 1-2 | Frontend Dev | Task 1.2 |

**Total:** 7-10 days

### Sprint 4 (Weeks 7-8 - Optional)
**Focus:** Nice-to-have

| Task | Days | Assignee | Dependencies |
|------|------|----------|--------------|
| 3.1 Error Boundaries | 1 | Frontend Dev | None |

**Total:** 1 day

---

## Success Metrics

### Performance Metrics

**Before:**
- Initial bundle load: ~400KB
- Largest chunk: 554KB
- Average component re-renders: Baseline (measure)
- Page load time: Baseline (measure)

**After (Target):**
- Initial bundle load: ~400KB (same)
- Largest chunk: 554KB (same)
- Average component re-renders: -10-15%
- Page load time: -5-10%

### Testing Metrics

**Before:**
- Total tests: 312
- Passing: 227 (73%)
- Coverage: Hooks 95%, Components 20%, Pages 25%

**After (Target):**
- Total tests: 312+
- Passing: 312 (100%)
- Coverage: Hooks 95%, Components 70%, Pages 70%

### Code Quality Metrics

**Before:**
- Components >600 LOC: 5
- React.memo usage: 0
- useMemo usage: 3
- TypeScript errors: 25 (in tests)

**After (Target):**
- Components >600 LOC: 0
- React.memo usage: 15+
- useMemo usage: 18+
- TypeScript errors: 0

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| React.memo breaks functionality | Low | High | Thorough testing, gradual rollout |
| MSW setup complex | Medium | Medium | Allocate extra time, seek help if needed |
| Refactoring introduces bugs | Medium | High | Comprehensive test coverage first |
| Timeline slippage | Medium | Low | Prioritize P1 tasks, P3 are optional |

---

## Rollout Strategy

### Week 1-2 (Sprint 1)
1. Create feature branch: `feature/frontend-optimizations-phase1`
2. Implement React.memo + useMemo
3. Run performance tests
4. Create PR, get review
5. Merge to main

### Week 3-4 (Sprint 2)
1. Create feature branch: `feature/frontend-testing-improvements`
2. Setup MSW
3. Fix all failing tests
4. Achieve 100% pass rate
5. Create PR, merge

### Week 5-6 (Sprint 3)
1. Create feature branch: `feature/frontend-code-quality`
2. Refactor large components
3. Consolidate types
4. Implement selectors
5. Create PR, merge

### Week 7-8 (Sprint 4 - Optional)
1. Error boundaries
2. Additional improvements

---

## Monitoring & Validation

### Performance Monitoring
- Use React DevTools Profiler before/after
- Measure with Lighthouse (Performance score)
- Track bundle sizes with webpack-bundle-analyzer

### Testing Validation
- CI/CD must pass (GitHub Actions)
- Manual QA testing of critical paths
- E2E tests must remain at 100% pass rate

### Code Quality Validation
- ESLint checks pass
- TypeScript compilation passes
- No console errors/warnings

---

## Post-Implementation Review

After all phases complete:

1. **Measure Improvements**
   - Performance metrics
   - Test coverage
   - Code quality metrics

2. **Update Documentation**
   - Update CLAUDE.md with new scores
   - Document new patterns
   - Update architectural diagrams

3. **Team Retrospective**
   - What went well?
   - What could be improved?
   - Lessons learned

4. **Final Health Report**
   - Re-run this analysis
   - Confirm 9.2/10 score achieved
   - Document final state

---

**Action Plan Created By:** Claude Code - Frontend Architect Agent
**Date:** November 3, 2025
**Next Review:** After Sprint 1 completion
