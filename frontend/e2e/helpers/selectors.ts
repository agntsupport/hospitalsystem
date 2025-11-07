// ABOUTME: Helpers de selectores robustos para tests E2E con Material-UI
// Soluciona el problema de selectores que apuntan a contenedores en vez de inputs reales

import { Page, Locator } from '@playwright/test';

/**
 * Llena un TextField de Material-UI
 * @param page - Página de Playwright
 * @param testId - data-testid del TextField
 * @param value - Valor a escribir
 * @returns Promise<void>
 *
 * @example
 * await fillTextField(page, 'username-input', 'cajero1');
 *
 * NOTA: Intenta primero input[data-testid], luego [data-testid] input
 */
export async function fillTextField(page: Page, testId: string, value: string): Promise<void> {
  // Intenta primero: data-testid directo en el input (caso Login.tsx)
  let locator = page.locator(`input[data-testid="${testId}"]`);

  try {
    await locator.waitFor({ state: 'visible', timeout: 2000 });
  } catch {
    // Si falla, intenta: data-testid en contenedor, input dentro
    locator = page.locator(`[data-testid="${testId}"] input`);
    await locator.waitFor({ state: 'visible', timeout: 5000 });
  }

  await locator.fill(value);
}

/**
 * Llena un campo de password de Material-UI
 * @param page - Página de Playwright
 * @param testId - data-testid del TextField
 * @param value - Valor a escribir
 * @returns Promise<void>
 *
 * NOTA: Intenta primero input[data-testid][type="password"], luego fallback genérico
 */
export async function fillPasswordField(page: Page, testId: string, value: string): Promise<void> {
  // Intenta primero: data-testid directo en el input password
  let locator = page.locator(`input[data-testid="${testId}"][type="password"]`);

  try {
    await locator.waitFor({ state: 'visible', timeout: 2000 });
  } catch {
    // Si falla, intenta: contenedor con data-testid, input password dentro
    locator = page.locator(`[data-testid="${testId}"] input[type="password"]`);
    try {
      await locator.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Último fallback: input con data-testid (sin verificar type)
      locator = page.locator(`input[data-testid="${testId}"]`);
      await locator.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  await locator.fill(value);
}

/**
 * Click en un botón con data-testid
 * @param page - Página de Playwright
 * @param testId - data-testid del botón
 * @returns Promise<void>
 *
 * @example
 * await clickButton(page, 'login-button');
 */
export async function clickButton(page: Page, testId: string): Promise<void> {
  const locator = page.locator(`button[data-testid="${testId}"]`);
  await locator.waitFor({ state: 'visible', timeout: 5000 });
  await locator.click();
}

/**
 * Selecciona una opción en un Select/Autocomplete de Material-UI
 * @param page - Página de Playwright
 * @param testId - data-testid del Select
 * @param value - Valor a seleccionar
 * @returns Promise<void>
 */
export async function selectOption(page: Page, testId: string, value: string): Promise<void> {
  // Click en el select para abrir el menú
  const selectLocator = page.locator(`[data-testid="${testId}"]`);
  await selectLocator.waitFor({ state: 'visible', timeout: 5000 });
  await selectLocator.click();

  // Esperar a que aparezca el menú de opciones
  await page.waitForTimeout(500);

  // Click en la opción deseada
  const optionLocator = page.locator(`li[role="option"]:has-text("${value}")`);
  await optionLocator.click();
}

/**
 * Selecciona una opción en un Autocomplete buscando por texto
 * @param page - Página de Playwright
 * @param testId - data-testid del Autocomplete
 * @param searchText - Texto a buscar
 * @returns Promise<void>
 */
export async function selectAutocompleteOption(
  page: Page,
  testId: string,
  searchText: string
): Promise<void> {
  // Click en el autocomplete
  const autocompleteLocator = page.locator(`[data-testid="${testId}"]`);
  await autocompleteLocator.waitFor({ state: 'visible', timeout: 5000 });

  // Buscar el input dentro del autocomplete
  const inputLocator = autocompleteLocator.locator('input');
  await inputLocator.fill(searchText);

  // Esperar a que aparezcan las opciones
  await page.waitForTimeout(1000);

  // Click en la primera opción que coincida
  const optionLocator = page.locator(`li[role="option"]:has-text("${searchText}")`).first();
  await optionLocator.click();
}

/**
 * Llena un DatePicker de Material-UI
 * @param page - Página de Playwright
 * @param testId - data-testid del DatePicker
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns Promise<void>
 */
export async function fillDatePicker(page: Page, testId: string, date: string): Promise<void> {
  const locator = page.locator(`[data-testid="${testId}"] input`);
  await locator.waitFor({ state: 'visible', timeout: 5000 });

  // Limpiar el campo primero
  await locator.clear();

  // Llenar con la fecha
  await locator.fill(date);

  // Presionar Enter para confirmar
  await locator.press('Enter');
}

/**
 * Verifica que un elemento con data-testid sea visible
 * @param page - Página de Playwright
 * @param testId - data-testid del elemento
 * @returns Promise<Locator>
 */
export function getByTestId(page: Page, testId: string): Locator {
  return page.locator(`[data-testid="${testId}"]`);
}

/**
 * Espera a que un elemento con data-testid sea visible
 * @param page - Página de Playwright
 * @param testId - data-testid del elemento
 * @param timeout - Timeout en ms (default: 5000)
 * @returns Promise<void>
 */
export async function waitForTestId(
  page: Page,
  testId: string,
  timeout: number = 5000
): Promise<void> {
  await page.locator(`[data-testid="${testId}"]`).waitFor({
    state: 'visible',
    timeout
  });
}

/**
 * Llena un formulario completo de paciente
 * Helper de alto nivel para formularios comunes
 */
export async function fillPatientForm(
  page: Page,
  data: {
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    genero: string;
    telefono: string;
    email?: string;
    direccion?: string;
  }
): Promise<void> {
  await fillTextField(page, 'nombre-input', data.nombre);
  await fillTextField(page, 'apellido-input', data.apellido);
  await fillDatePicker(page, 'fecha-nacimiento-input', data.fechaNacimiento);
  await selectOption(page, 'genero-select', data.genero);
  await fillTextField(page, 'telefono-input', data.telefono);

  if (data.email) {
    await fillTextField(page, 'email-input', data.email);
  }

  if (data.direccion) {
    await fillTextField(page, 'direccion-input', data.direccion);
  }
}

/**
 * Navega a una sección del sistema usando el menú lateral
 * @param page - Página de Playwright
 * @param sectionName - Nombre de la sección (case-insensitive regex)
 * @returns Promise<void>
 */
export async function navigateToSection(page: Page, sectionName: string): Promise<void> {
  const menuItem = page.locator(`text=/${sectionName}/i`);
  await menuItem.waitFor({ state: 'visible', timeout: 5000 });
  await menuItem.click();

  // Esperar a que la navegación complete
  await page.waitForTimeout(1000);
}

/**
 * Realiza login con credenciales
 * Helper de alto nivel para login
 */
export async function performLogin(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('http://localhost:3000/login');

  // Usar los helpers específicos
  await fillTextField(page, 'username-input', username);
  await fillPasswordField(page, 'password-input', password);
  await clickButton(page, 'login-button');

  // Esperar a que el login complete y redirija
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

/**
 * Espera a que aparezca un mensaje de éxito
 * @param page - Página de Playwright
 * @param messagePattern - Patrón regex del mensaje
 * @returns Promise<void>
 */
export async function waitForSuccessMessage(
  page: Page,
  messagePattern: string | RegExp = /éxito|success|completado/i
): Promise<void> {
  const message = page.locator(`text=${messagePattern}`);
  await message.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Espera a que aparezca un mensaje de error
 * @param page - Página de Playwright
 * @param messagePattern - Patrón regex del mensaje
 * @returns Promise<void>
 */
export async function waitForErrorMessage(
  page: Page,
  messagePattern: string | RegExp = /error|fallo|falló/i
): Promise<void> {
  const message = page.locator(`text=${messagePattern}`);
  await message.waitFor({ state: 'visible', timeout: 10000 });
}
