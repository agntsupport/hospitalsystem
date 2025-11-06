# Plan Accionable - Testing Frontend Opción A
**Fecha:** 6 de Noviembre 2025
**Desarrollado por:** Claude (Frontend Architect)
**Para:** Alfredo Manuel Reyes - AGNT

---

## RESUMEN DE 1 MINUTO

**Situación:**
- ✅ 873 tests existentes (99.8% passing)
- ❌ Solo 8% cobertura real
- 🎯 Meta: 60-70% cobertura

**Plan:**
- 3 fases incrementales
- 6-9 días de desarrollo
- ~230 tests nuevos

**Inicio:** Corregir 2 tests fallantes + completar 9 tests stub

---

## FASE 1: QUICK WINS (Día 1-2)

### Objetivos:
- ✅ Pasar de 8% → 25-30% cobertura
- ✅ Corregir todos los tests fallantes
- ✅ Completar tests stub existentes

### Tareas Específicas:

#### Tarea 1.1: Identificar y Corregir Tests Fallantes (0.5 día)
```bash
# Ejecutar para ver detalles
cd frontend
npm test -- --verbose --no-coverage

# Buscar líneas con "FAIL" o "●"
# Corregir los 2 tests identificados
```

**Archivos probables:**
- Revisar suites con mayor complejidad
- Verificar imports de componentes
- Verificar mocks de servicios

---

#### Tarea 1.2: Completar 9 Tests Stub (1 día)

**Template estándar para cada página:**

```typescript
// pages/__tests__/[Page].test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import [PageName] from '../[PageName]';
import authReducer from '../../store/slices/authSlice';
import * as [serviceName] from '../../services/[serviceName]';

jest.mock('../../services/[serviceName]');

describe('[PageName]', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            nombre: 'Test User',
            rol: 'administrador'
          },
          token: 'test-token',
        },
      },
    });

    // Mock del servicio principal
    ([serviceName].getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        items: [],
        pagination: { total: 0, page: 1, perPage: 10 }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page with title', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <[PageName] />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/título de página/i)).toBeInTheDocument();
  });

  it('should render the main table/grid', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <[PageName] />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('should render the create/add button', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <[PageName] />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /agregar|crear|nuevo/i })).toBeInTheDocument();
  });

  it('should call service on mount', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <[PageName] />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect([serviceName].getAll).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Aplicar a:**
1. ✅ BillingPage.test.tsx
2. ✅ EmployeesPage.test.tsx
3. ✅ RoomsPage.test.tsx
4. ✅ SolicitudesPage.test.tsx
5. ✅ UsersPage.test.tsx
6. ✅ ReportsPage.test.tsx
7. ✅ Dashboard.test.tsx
8. ✅ POSPage.test.tsx
9. ✅ HospitalizationPage.test.tsx

---

#### Tarea 1.3: Expandir Tests de Servicios (0.5 día)

**Template para expandir servicios:**

```typescript
// services/__tests__/[service].test.ts
import axios from 'axios';
import * as service from '../[service]';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('[Service]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return data on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });
      const result = await service.getAll();
      expect(result.items).toEqual([]);
    });

    it('should handle 404 error', async () => {
      mockedAxios.get.mockRejectedValue({ response: { status: 404 } });
      await expect(service.getAll()).rejects.toThrow();
    });

    it('should handle 500 error', async () => {
      mockedAxios.get.mockRejectedValue({ response: { status: 500 } });
      await expect(service.getAll()).rejects.toThrow();
    });

    it('should handle network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      await expect(service.getAll()).rejects.toThrow('Network Error');
    });
  });

  describe('create', () => {
    it('should send correct data format', async () => {
      mockedAxios.post.mockResolvedValue({ data: { id: 1 } });
      await service.create({ name: 'Test' });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'Test' })
      );
    });

    it('should transform response data', async () => {
      mockedAxios.post.mockResolvedValue({ data: { id: 1, nombre: 'Test' } });
      const result = await service.create({ name: 'Test' });
      expect(result).toHaveProperty('id', 1);
    });
  });

  // Repetir para update, delete, otros métodos...
});
```

**Aplicar a servicios críticos:**
1. ✅ posService.test.ts (expandir con error cases)
2. ✅ patientsService.test.ts (agregar validaciones)
3. ✅ billingService.test.ts (agregar transformaciones)
4. ✅ inventoryService.test.ts (agregar stock validations)

---

### Resultado Esperado FASE 1:
- ✅ 0 tests fallantes
- ✅ 9 páginas con tests básicos funcionales
- ✅ 4 servicios con cobertura 50-60%
- ✅ **Cobertura total: 25-30%**

**Tiempo:** 1-2 días
**Tests agregados:** ~50 tests nuevos

---

## FASE 2: COMPONENTES CRÍTICOS (Día 3-5)

### Objetivos:
- ✅ Pasar de 25-30% → 45-50% cobertura
- ✅ Cubrir componentes reutilizables
- ✅ Completar Redux slices

### Tareas Específicas:

#### Tarea 2.1: Tests de common/ Components (1 día)

**Archivos a crear:**

1. **components/common/__tests__/ProtectedRoute.test.tsx**
```typescript
describe('ProtectedRoute', () => {
  it('should redirect to login if not authenticated');
  it('should render children if authenticated');
  it('should check required permissions');
  it('should redirect if permissions not met');
});
```

2. **components/common/__tests__/Layout.test.tsx**
```typescript
describe('Layout', () => {
  it('should render Sidebar and main content');
  it('should toggle sidebar on mobile');
  it('should render user info in header');
  it('should handle logout');
});
```

3. **components/common/__tests__/Sidebar.test.tsx**
```typescript
describe('Sidebar', () => {
  it('should render navigation links based on role');
  it('should highlight active route');
  it('should collapse/expand sections');
  it('should filter links by permissions');
});
```

4. **components/common/__tests__/AuditTrail.test.tsx**
5. **components/common/__tests__/PostalCodeAutocomplete.test.tsx**

---

#### Tarea 2.2: Tests de forms/ Components (0.5 día)

**Archivos a crear:**

1. **components/forms/__tests__/FormDialog.test.tsx**
```typescript
describe('FormDialog', () => {
  it('should open and close dialog');
  it('should render custom content');
  it('should call onSave with form data');
  it('should call onCancel on close');
  it('should show loading state');
});
```

2. **components/forms/__tests__/ControlledTextField.test.tsx**
3. **components/forms/__tests__/ControlledSelect.test.tsx**

---

#### Tarea 2.3: Expandir Redux Slices (0.5 día)

**Expandir tests existentes:**

1. **store/slices/__tests__/authSlice.test.ts**
```typescript
// Agregar:
- Tests de todos los reducers
- Tests de async thunks (login, logout, verify)
- Tests de selectors
- Tests de error states
// Meta: 80%+ cobertura
```

2. **store/slices/__tests__/uiSlice.test.ts**
3. **store/slices/__tests__/patientsSlice.test.ts**

---

#### Tarea 2.4: Tests de Componentes POS (1 día)

**Archivos a crear:**

1. **components/pos/__tests__/OpenAccountsList.test.tsx**
```typescript
describe('OpenAccountsList', () => {
  it('should render list of open accounts');
  it('should show account balance and patient name');
  it('should handle click to view details');
  it('should filter accounts by search');
  it('should show empty state');
});
```

2. **components/pos/__tests__/AccountDetailDialog.test.tsx**
3. **components/pos/__tests__/POSTransactionDialog.test.tsx**
4. **components/pos/__tests__/QuickSalesTab.test.tsx**

---

### Resultado Esperado FASE 2:
- ✅ 13 componentes common/forms cubiertos
- ✅ Redux slices con 80%+ cobertura
- ✅ 4 componentes POS críticos cubiertos
- ✅ **Cobertura total: 45-50%**

**Tiempo:** 2-3 días
**Tests agregados:** ~80 tests nuevos

---

## FASE 3: PÁGINAS COMPLEJAS (Día 6-9)

### Objetivos:
- ✅ Pasar de 45-50% → 60-70% cobertura
- ✅ Tests de interacción completos
- ✅ Flujos end-to-end simulados

### Tareas Específicas:

#### Tarea 3.1: Dashboard Completo (0.5 día)

**Expandir:** pages/dashboard/__tests__/Dashboard.test.tsx

```typescript
describe('Dashboard - Extended', () => {
  it('should render all metric cards with correct data');
  it('should show different metrics based on role');
  it('should navigate to modules on card click');
  it('should refresh data on button click');
  it('should show recent activities');
  it('should filter by date range');
});
```

---

#### Tarea 3.2: POSPage Interacciones (1 día)

**Expandir:** pages/pos/__tests__/POSPage.test.tsx

```typescript
describe('POSPage - Complete Flow', () => {
  describe('New Account', () => {
    it('should open new account dialog');
    it('should create account with patient selection');
    it('should show account in open accounts list');
  });

  describe('Add Items', () => {
    it('should add product to account');
    it('should add service to account');
    it('should update total amount');
    it('should show items in account detail');
  });

  describe('Close Account', () => {
    it('should open close account dialog');
    it('should process payment');
    it('should generate invoice');
    it('should remove from open accounts');
  });

  describe('Permissions', () => {
    it('should restrict create for non-cajero');
    it('should restrict close for non-cajero');
  });
});
```

---

#### Tarea 3.3: BillingPage Completo (1 día)

**Expandir:** pages/billing/__tests__/BillingPage.test.tsx

```typescript
describe('BillingPage - Complete Flow', () => {
  describe('Invoices Tab', () => {
    it('should list all invoices');
    it('should filter by date range');
    it('should search by patient');
    it('should open invoice details');
  });

  describe('Create Invoice', () => {
    it('should open create dialog');
    it('should add items');
    it('should calculate totals');
    it('should save invoice');
  });

  describe('Payments Tab', () => {
    it('should record new payment');
    it('should link payment to invoice');
    it('should update account balance');
  });

  describe('Accounts Receivable', () => {
    it('should show overdue accounts');
    it('should filter by status');
    it('should show payment history');
  });
});
```

---

#### Tarea 3.4: InventoryPage (1 día)

**Expandir:** pages/inventory/__tests__/[multiple files]

```typescript
// ProductsTab
describe('ProductsTab', () => {
  it('should CRUD products');
  it('should show stock alerts');
  it('should filter by category');
});

// StockMovementsTab
describe('StockMovementsTab', () => {
  it('should record entrada');
  it('should record salida');
  it('should update stock quantity');
  it('should show movement history');
});

// StockAlerts
describe('StockAlerts', () => {
  it('should show low stock products');
  it('should configure alert thresholds');
  it('should send notifications');
});
```

---

#### Tarea 3.5: HospitalizationPage (0.5 día)

**Expandir:** pages/hospitalization/__tests__/HospitalizationPage.test.tsx

```typescript
describe('HospitalizationPage - Complete Flow', () => {
  describe('Admissions', () => {
    it('should create new admission');
    it('should assign room and doctor');
    it('should charge admission fee');
    it('should show in active admissions');
  });

  describe('Medical Notes', () => {
    it('should add medical note (doctor only)');
    it('should show notes history');
    it('should restrict by role');
  });

  describe('Discharge', () => {
    it('should process discharge');
    it('should calculate total charges');
    it('should generate final invoice');
    it('should free up room');
  });
});
```

---

### Resultado Esperado FASE 3:
- ✅ 5 páginas principales con tests completos
- ✅ Flujos de usuario end-to-end simulados
- ✅ Validaciones de permisos por rol
- ✅ **Cobertura total: 60-70%**

**Tiempo:** 3-4 días
**Tests agregados:** ~100 tests nuevos

---

## COMANDOS ÚTILES

### Testing:
```bash
# Ejecutar todos los tests
cd frontend && npm test

# Tests con cobertura
cd frontend && npm run test:coverage

# Tests en modo watch (desarrollo)
cd frontend && npm run test:watch

# Tests de un archivo específico
cd frontend && npm test -- PatientForm

# Tests verbose (para debug)
cd frontend && npm test -- --verbose

# Tests con actualización de snapshots
cd frontend && npm test -- -u
```

### Verificación de Cobertura:
```bash
# Ver reporte HTML
cd frontend/coverage && open index.html

# Ver cobertura por archivo
cd frontend && npx jest --coverage --coverageReporters=text

# Verificar umbrales
cd frontend && npm test -- --coverage --coverageThreshold='{"global":{"statements":60}}'
```

---

## CHECKLIST DE CALIDAD

### Para Cada Test Nuevo:
- [ ] Describe block con nombre descriptivo
- [ ] beforeEach para setup común
- [ ] afterEach para cleanup
- [ ] Mocks de servicios configurados
- [ ] Store de Redux con estado inicial
- [ ] Tests de render básico
- [ ] Tests de interacción
- [ ] Tests de casos de error
- [ ] Tests de validaciones
- [ ] Tests de permisos (si aplica)

### Para Cada Componente:
- [ ] Tests de props
- [ ] Tests de eventos
- [ ] Tests de estados
- [ ] Tests de efectos
- [ ] Tests de edge cases

### Para Cada Servicio:
- [ ] Tests de happy path
- [ ] Tests de error 4xx
- [ ] Tests de error 5xx
- [ ] Tests de network errors
- [ ] Tests de transformaciones
- [ ] Tests de validaciones

---

## MÉTRICAS DE ÉXITO

### Por Fase:
| Fase | Cobertura | Tests | Tiempo |
|------|-----------|-------|--------|
| Inicial | 8% | 873 | - |
| Fase 1 | 25-30% | ~920 | 1-2 días |
| Fase 2 | 45-50% | ~1000 | 2-3 días |
| Fase 3 | 60-70% | ~1100 | 3-4 días |

### Objetivos Finales:
- ✅ Cobertura: 60-70%
- ✅ Pass Rate: >98%
- ✅ Tests: ~1,100
- ✅ Tiempo: <5 min (paralelo)
- ✅ 0 tests fallantes
- ✅ 0 tests duplicados

---

## SIGUIENTE ACCIÓN INMEDIATA

**Comando a ejecutar:**
```bash
cd /Users/alfredo/agntsystemsc/frontend
npm test -- --verbose --no-coverage 2>&1 | grep -A 10 "FAIL\|●"
```

**Objetivo:** Identificar los 2 tests fallantes específicos

**Luego:**
1. Corregir tests fallantes
2. Comenzar con BillingPage.test.tsx
3. Continuar con los otros 8 tests stub

---

**Reporte:** Plan 100% accionable
**Listo para:** Implementación inmediata
**Próxima revisión:** Al completar Fase 1

**Desarrollado por:** Claude (Frontend Architect)
**Para:** Alfredo Manuel Reyes - AGNT
**Fecha:** 6 de Noviembre 2025
