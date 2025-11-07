# Tests E2E con Playwright
## Sistema de Gestión Hospitalaria Integral

Este directorio contiene tests End-to-End (E2E) usando Playwright para validar flujos críticos del sistema.

## 📋 Tests Implementados

### ✅ ITEM 3: Validación de Formularios (`item3-patient-form-validation.spec.ts`)
Valida que el formulario de pacientes NO permita submit sin validación correcta.

**Fix validado:** `frontend/src/pages/patients/PatientFormDialog.tsx`

**Escenarios cubiertos:**
- ✅ Prevenir submit con campos requeridos vacíos
- ✅ Validar campos requeridos en cada step del wizard
- ✅ Validar formato de email
- ✅ Permitir crear paciente con datos válidos completos
- ✅ Prevenir submit forzado sin validación (bypass eliminado)

**Total:** 6 test cases

---

### ✅ ITEM 4: Skip Links WCAG 2.1 AA (`item4-skip-links-wcag.spec.ts`)
Valida cumplimiento de accesibilidad WCAG 2.1 AA con Skip Links.

**Fix validado:**
- `frontend/src/components/common/Layout.tsx`
- `frontend/src/components/common/Sidebar.tsx`

**Criterios WCAG validados:**
- ✅ 2.4.1 Bypass Blocks (Level A)
- ✅ Skip links como primer elemento focusable
- ✅ Visibilidad al recibir foco
- ✅ Funcionalidad de salto correcta
- ✅ z-index alto para visibilidad
- ✅ Outline visible para accesibilidad
- ✅ Atributos ARIA correctos
- ✅ Navegación por teclado completa

**Total:** 13 test cases

---

## 🚀 Ejecución de Tests

### Pre-requisitos

1. **Backend corriendo en puerto 3001:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Base de datos PostgreSQL activa:**
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql
   ```

3. **Usuario admin en base de datos:**
   - Username: `admin`
   - Password: `admin123`

### Comandos Disponibles

```bash
# Ejecutar todos los tests E2E (requiere backend + frontend)
npm run test:e2e

# Ejecutar con interfaz visual
npm run test:e2e:ui

# Ejecutar con navegador visible (headed mode)
npm run test:e2e:headed

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver reporte de última ejecución
npm run test:e2e:report
```

### Ejecución Rápida (Todo en uno)

Usa el script helper que inicia backend, frontend y tests automáticamente:

```bash
# Desde la raíz del proyecto
./test-e2e-full.sh
```

### Ejecución Manual Paso a Paso

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (Playwright lo inicia automáticamente)
# No necesario, Playwright tiene webServer configurado

# Terminal 3: Tests
cd frontend
npm run test:e2e
```

---

## 📊 Configuración

### `playwright.config.ts`

Configuración principal de Playwright:

- **Browsers:** chromium, firefox, webkit, mobile chrome, mobile safari
- **Base URL:** http://localhost:3000
- **Traces:** on-first-retry
- **Screenshots:** only-on-failure
- **Video:** retain-on-failure
- **Web Server:** Auto-start frontend en puerto 3000

### Parallelización

- **CI:** Tests secuenciales (1 worker)
- **Local:** Tests paralelos (workers automáticos)

---

## 🧪 Estructura de Tests

```
e2e/
├── README.md                              # Esta documentación
├── item3-patient-form-validation.spec.ts  # Tests ITEM 3 (6 casos)
└── item4-skip-links-wcag.spec.ts          # Tests ITEM 4 (13 casos)
```

---

## 📝 Agregar Nuevos Tests

### Template Básico

```typescript
import { test, expect } from '@playwright/test';

test.describe('Nombre del módulo', () => {
  test.beforeEach(async ({ page }) => {
    // Login y setup
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('debe hacer X', async ({ page }) => {
    // Test implementation
    await page.goto('/ruta');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Buenas Prácticas

1. **Usar selectores semánticos:** Preferir `text=`, `role=`, `aria-label`
2. **Esperar elementos:** Usar `waitForLoadState`, `waitForURL`
3. **Assertions explícitas:** `toBeVisible()`, `toHaveText()`, `toBeEnabled()`
4. **Cleanup:** Usar `beforeEach` para estado limpio
5. **Screenshots en fallos:** Automático, revisar `test-results/`

---

## 🔍 Debugging Tests

### Modo UI (Recomendado)

```bash
npm run test:e2e:ui
```

Abre interfaz gráfica con:
- Timeline visual de acciones
- Screenshots de cada paso
- Consola del navegador
- Network requests
- Re-run tests individuales

### Modo Debug

```bash
npm run test:e2e:debug
```

Pausa ejecución y permite:
- Inspeccionar elementos
- Ver selectores
- Ejecutar comandos en consola
- Step-by-step execution

### Playwright Inspector

Durante ejecución en modo debug, usa:
- `Pick Locator`: Seleccionar elementos visualmente
- `Copy Selector`: Copiar selector óptimo
- `Step Over`: Ejecutar siguiente acción
- `Resume`: Continuar ejecución

---

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Setup database
        run: |
          # Setup PostgreSQL
          # Run migrations
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: |
          cd backend && npm run dev &
          cd frontend && npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 🐛 Troubleshooting

### Error: "Backend no responde"

**Solución:**
```bash
# Verificar que backend está corriendo
curl http://localhost:3001/health

# Si no responde, reiniciar backend
cd backend
pkill -f nodemon
npm run dev
```

### Error: "Target closed"

**Causa:** El navegador se cerró inesperadamente

**Solución:**
- Aumentar timeout en test
- Verificar memoria disponible
- Ejecutar en headed mode para ver el error

### Error: "Element not found"

**Causa:** Selector incorrecto o elemento no cargado

**Solución:**
```typescript
// Usar waitFor antes de interact
await page.waitForSelector('button:has-text("Submit")');
await page.click('button:has-text("Submit")');

// O usar expect con timeout
await expect(page.locator('button')).toBeVisible({ timeout: 10000 });
```

### Tests lentos

**Optimizaciones:**
- Reducir `waitForTimeout` innecesarios
- Usar `waitForLoadState('networkidle')` con precaución
- Ejecutar solo un browser en local: `npm run test:e2e -- --project=chromium`

---

## 📚 Recursos

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

## ✅ Checklist Pre-Commit

Antes de hacer commit con nuevos tests:

- [ ] Tests pasan localmente (`npm run test:e2e`)
- [ ] Tests documentados en este README
- [ ] Selectores semánticos y estables
- [ ] Timeouts apropiados
- [ ] Screenshots configurados en failures
- [ ] beforeEach para setup común
- [ ] Nombres descriptivos de tests

---

## 🔄 FASE 2: Tests Refactorizados (Noviembre 2025)

### Nueva Arquitectura de Tests

La **FASE 2** introduce una arquitectura mejorada de tests E2E:

**Archivos Nuevos:**
```
e2e/
├── fixtures/
│   └── auth-fixtures.ts              # Fixtures de autenticación por rol ✨ NUEVO
├── helpers/
│   └── test-data-helpers.ts          # Helpers para crear datos de prueba ✨ NUEVO
├── flujo1-cajero-refactored.spec.ts  # Flujo cajero independiente ✨ NUEVO
├── flujo2-almacen-refactored.spec.ts # Flujo almacén independiente ✨ NUEVO
└── flujo3-admin-refactored.spec.ts   # Flujo admin independiente ✨ NUEVO
```

### Fixtures de Autenticación

Las fixtures proporcionan páginas pre-autenticadas:

```typescript
import { test, expect } from './fixtures/auth-fixtures';

test('Mi test con cajero', async ({ cajeroPage }) => {
  // La página ya está autenticada como cajero
  await cajeroPage.goto('http://localhost:3000/patients');
});
```

**Fixtures Disponibles:**
- `cajeroPage` - Usuario: `cajero1` / `cajero123`
- `almacenistaPage` - Usuario: `almacen1` / `almacen123`
- `adminPage` - Usuario: `admin` / `admin123`
- `enfermerPage` - Usuario: `enfermero1` / `enfermero123`
- `medicoPage` - Usuario: `especialista1` / `medico123`

### Helpers de Datos de Prueba

**`createTestPatient(page)`** - Crea un paciente de prueba con datos únicos

**`createTestProduct(page)`** - Crea un producto de prueba con COSTO y PRECIO DE VENTA

**`navigateToModule(page, moduleName)`** - Navega a un módulo específico

**`generateUniqueData()`** - Genera datos únicos para evitar colisiones

### Mejoras vs Tests Originales

| Aspecto | Original | Refactorizado |
|---------|----------|---------------|
| **Independencia** | ❌ Dependen unos de otros | ✅ Totalmente independientes |
| **Autenticación** | Login manual cada vez | ✅ Fixture pre-autenticada |
| **Datos de prueba** | Compartidos | ✅ Cada test crea los suyos |
| **Ejecución paralela** | ❌ No funciona bien | ✅ Funciona perfectamente |
| **Mantenibilidad** | Baja | ✅ Alta (tests aislados) |

### Ejecutar Tests Refactorizados

```bash
# Todos los tests refactorizados
npx playwright test e2e/*-refactored.spec.ts

# Solo Flujo 1 (Cajero)
npx playwright test e2e/flujo1-cajero-refactored.spec.ts

# Con UI mode
npx playwright test e2e/flujo1-cajero-refactored.spec.ts --ui
```

---

**Desarrollado por:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Última actualización:** 6 de noviembre de 2025
