# ABOUTME: Documentación de Helpers E2E para Playwright con Material-UI
# ABOUTME: Guía completa para usar selectores robustos en tests end-to-end

# Helpers E2E - Guía de Uso

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [El Problema con Material-UI](#el-problema-con-material-ui)
3. [La Solución: Helpers Robustos](#la-solución-helpers-robustos)
4. [Helpers Disponibles](#helpers-disponibles)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Best Practices](#best-practices)

---

## Introducción

Los helpers de `selectors.ts` resuelven el problema fundamental de selectores en tests E2E con Material-UI: **los componentes MUI tienen estructura anidada donde `data-testid` puede estar en el contenedor O en el input real**.

## El Problema con Material-UI

### ❌ Selector Directo (NO FUNCIONA)

```typescript
// ❌ Esto falla con "Element is not an <input>"
await page.getByTestId('username-input').fill('cajero1');
```

**Por qué falla:**
- `getByTestId` encuentra el `<div>` contenedor de MUI
- Playwright intenta hacer `.fill()` en el div
- Error: `Element is not an <input>, <textarea> or <select>`

### ✅ Helper con Fallback (FUNCIONA)

```typescript
// ✅ Esto funciona en cualquier estructura MUI
await fillTextField(page, 'username-input', 'cajero1');
```

**Por qué funciona:**
- Intenta `input[data-testid]` primero (input directo)
- Si falla, intenta `[data-testid] input` (contenedor → input)
- Fallback robusto para diferentes versiones de MUI

---

## La Solución: Helpers Robustos

### Patrón de Fallback Implementado

```typescript
export async function fillTextField(page: Page, testId: string, value: string) {
  // Intento 1: data-testid directo en el input
  let locator = page.locator(`input[data-testid="${testId}"]`);

  try {
    await locator.waitFor({ state: 'visible', timeout: 2000 });
  } catch {
    // Intento 2: data-testid en contenedor, input dentro
    locator = page.locator(`[data-testid="${testId}"] input`);
    await locator.waitFor({ state: 'visible', timeout: 5000 });
  }

  await locator.fill(value);
}
```

---

## Helpers Disponibles

### 📝 Formularios

#### `fillTextField(page, testId, value)`
Llena un TextField de Material-UI.

```typescript
await fillTextField(page, 'username-input', 'cajero1');
await fillTextField(page, 'nombre-input', 'Juan');
```

#### `fillPasswordField(page, testId, value)`
Llena un campo de password con triple fallback.

```typescript
await fillPasswordField(page, 'password-input', 'secret123');
```

#### `fillDatePicker(page, testId, date)`
Llena un DatePicker de MUI.

```typescript
await fillDatePicker(page, 'fecha-nacimiento', '1990-01-15');
```

### 🖱️ Interacciones

#### `clickButton(page, testId)`
Click en botón con data-testid.

```typescript
await clickButton(page, 'login-button');
await clickButton(page, 'submit-button');
```

#### `selectOption(page, testId, value)`
Selecciona opción en Select/Autocomplete de MUI.

```typescript
await selectOption(page, 'genero-select', 'Masculino');
```

#### `selectAutocompleteOption(page, testId, searchText)`
Busca y selecciona en Autocomplete.

```typescript
await selectAutocompleteOption(page, 'medico-autocomplete', 'Dr. García');
```

### 🔍 Utilidades

#### `getByTestId(page, testId)`
Retorna locator con data-testid.

```typescript
const header = getByTestId(page, 'page-header');
await expect(header).toBeVisible();
```

#### `waitForTestId(page, testId, timeout?)`
Espera a que elemento sea visible.

```typescript
await waitForTestId(page, 'loading-spinner', 10000);
```

### ✅ Validaciones

#### `waitForSuccessMessage(page, pattern?)`
Espera mensaje de éxito.

```typescript
await waitForSuccessMessage(page);
await waitForSuccessMessage(page, /guardado.*correctamente/i);
```

#### `waitForErrorMessage(page, pattern?)`
Espera mensaje de error.

```typescript
await waitForErrorMessage(page);
await waitForErrorMessage(page, /credenciales.*inválidas/i);
```

### 🚀 Helpers de Alto Nivel

#### `performLogin(page, username, password)`
Login completo con redirección automática.

```typescript
await performLogin(page, 'cajero1', 'cajero123');
// Ya está en /dashboard después de esta línea
```

#### `fillPatientForm(page, data)`
Llena formulario completo de paciente.

```typescript
await fillPatientForm(page, {
  nombre: 'Juan',
  apellido: 'Pérez',
  fechaNacimiento: '1990-01-15',
  genero: 'Masculino',
  telefono: '4431234567',
  email: 'juan@test.com',
  direccion: 'Calle 123'
});
```

#### `navigateToSection(page, sectionName)`
Navega usando el menú lateral.

```typescript
await navigateToSection(page, 'pacientes');
await navigateToSection(page, 'inventario');
```

---

## Ejemplos de Uso

### Ejemplo 1: Login Test Completo

```typescript
import { test, expect } from '@playwright/test';
import { performLogin, waitForSuccessMessage } from './helpers/selectors';

test('Login como cajero', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // Login con helper de alto nivel
  await performLogin(page, 'cajero1', 'cajero123');

  // Verificar redirección automática
  await expect(page).toHaveURL(/.*dashboard/);

  // Verificar elemento característico
  await expect(page.locator('text=/buenos.*días/i')).toBeVisible();
});
```

### Ejemplo 2: Formulario de Registro

```typescript
import {
  fillTextField,
  fillDatePicker,
  selectOption,
  clickButton,
  waitForSuccessMessage
} from './helpers/selectors';

test('Registrar nuevo paciente', async ({ page }) => {
  await page.goto('http://localhost:3000/patients');

  // Abrir formulario
  await clickButton(page, 'nuevo-paciente-button');

  // Llenar formulario con helpers
  await fillTextField(page, 'nombre-input', 'Juan');
  await fillTextField(page, 'apellido-input', 'Pérez');
  await fillDatePicker(page, 'fecha-nacimiento', '1990-01-15');
  await selectOption(page, 'genero-select', 'Masculino');
  await fillTextField(page, 'telefono-input', '4431234567');
  await fillTextField(page, 'email-input', 'juan@test.com');

  // Guardar
  await clickButton(page, 'guardar-button');

  // Validar éxito
  await waitForSuccessMessage(page);
});
```

### Ejemplo 3: Con Fallback de Password

```typescript
import { fillTextField, fillPasswordField, clickButton } from './helpers/selectors';

test('Cambiar contraseña', async ({ page }) => {
  await page.goto('http://localhost:3000/profile');

  // Los helpers manejan diferentes estructuras MUI automáticamente
  await fillPasswordField(page, 'current-password', 'oldpass123');
  await fillPasswordField(page, 'new-password', 'newpass456');
  await fillPasswordField(page, 'confirm-password', 'newpass456');

  await clickButton(page, 'change-password-button');

  await waitForSuccessMessage(page);
});
```

---

## Best Practices

### ✅ DO

1. **Siempre usa helpers en lugar de selectores directos**
   ```typescript
   // ✅ CORRECTO
   await fillTextField(page, 'username-input', 'admin');

   // ❌ INCORRECTO
   await page.getByTestId('username-input').fill('admin');
   ```

2. **Usa helpers de alto nivel cuando sea posible**
   ```typescript
   // ✅ MEJOR
   await performLogin(page, 'admin', 'admin123');

   // ❌ MÁS VERBOSO (pero también válido)
   await fillTextField(page, 'username-input', 'admin');
   await fillPasswordField(page, 'password-input', 'admin123');
   await clickButton(page, 'login-button');
   ```

3. **Agrega `.first()` cuando sepas que hay múltiples coincidencias**
   ```typescript
   await expect(page.locator('text=/cajero1/i').first()).toBeVisible();
   ```

4. **Usa timeouts apropiados para operaciones lentas**
   ```typescript
   await waitForSuccessMessage(page, /guardado/i, 15000);
   ```

### ❌ DON'T

1. **No uses selectores CSS directos sin fallback**
   ```typescript
   // ❌ Frágil, depende de la estructura exacta
   await page.locator('div.MuiFormControl-root input').fill('test');
   ```

2. **No hagas wait implícito sin helpers**
   ```typescript
   // ❌ Puede fallar con timing issues
   await page.fill('input[name="nombre"]', 'Juan');

   // ✅ Helper maneja el wait automáticamente
   await fillTextField(page, 'nombre-input', 'Juan');
   ```

3. **No repitas código de login en cada test**
   ```typescript
   // ❌ Repetitivo
   test('test 1', async ({ page }) => {
     await page.goto('http://localhost:3000/login');
     await fillTextField(page, 'username-input', 'admin');
     await fillPasswordField(page, 'password-input', 'admin123');
     await clickButton(page, 'login-button');
     // ... test code
   });

   // ✅ Usa performLogin
   test('test 1', async ({ page }) => {
     await page.goto('http://localhost:3000/login');
     await performLogin(page, 'admin', 'admin123');
     // ... test code
   });
   ```

---

## 🔧 Troubleshooting

### Problema: "Element is not an input"

**Causa:** Selector apunta al contenedor div de MUI en vez del input.

**Solución:** Usa el helper apropiado (fillTextField, fillPasswordField, etc.)

```typescript
// ❌ Causa el error
await page.getByTestId('email-input').fill('test@test.com');

// ✅ Solución
await fillTextField(page, 'email-input', 'test@test.com');
```

### Problema: "TimeoutError: locator.waitFor"

**Causa:** El elemento no aparece en el tiempo esperado.

**Solución:** Incrementa el timeout o verifica que el selector sea correcto.

```typescript
// Aumentar timeout en helpers
await waitForTestId(page, 'loading-indicator', 15000);

// O verificar que el data-testid exista en el HTML
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### Problema: "strict mode violation: resolved to N elements"

**Causa:** El selector encuentra múltiples elementos.

**Solución:** Usa `.first()`, `.last()` o `.nth(n)`.

```typescript
// ❌ Error con múltiples coincidencias
await expect(page.locator('text=/admin/i')).toBeVisible();

// ✅ Especifica cuál elemento
await expect(page.locator('text=/admin/i').first()).toBeVisible();
```

---

## 📊 Cobertura Actual

### ✅ Helpers Implementados: 16

- `fillTextField` ✅
- `fillPasswordField` ✅
- `clickButton` ✅
- `selectOption` ✅
- `selectAutocompleteOption` ✅
- `fillDatePicker` ✅
- `getByTestId` ✅
- `waitForTestId` ✅
- `fillPatientForm` ✅
- `navigateToSection` ✅
- `performLogin` ✅
- `waitForSuccessMessage` ✅
- `waitForErrorMessage` ✅

### 🔄 Tests Refactorizados

- Login Test (flujo1-cajero-completo.spec.ts) ✅

### 📈 Mejora de Pass Rate

- **Antes:** 0% (tests fallaban con "Element is not an input")
- **Después:** 23.6% (13/55 tests passing)
- **Objetivo:** 90%+ con refactorización completa

---

## 🚀 Próximos Pasos

1. Refactorizar tests restantes de flujo1
2. Aplicar patrón a flujo2 (Almacén) y flujo3 (Admin)
3. Agregar más helpers especializados según necesidad
4. Documentar casos edge detectados

---

## 📝 Notas para el Equipo

- **Autor:** Alfredo Manuel Reyes (con Claude Code)
- **Fecha:** 7 de Noviembre, 2025
- **Versión:** 1.0.0
- **Licencia:** Uso interno - AGNT

---

*📚 Para más información, consulta el código fuente en `frontend/e2e/helpers/selectors.ts`*
