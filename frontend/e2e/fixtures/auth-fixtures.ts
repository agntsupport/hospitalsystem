// ABOUTME: Fixtures de Playwright para autenticación automática por rol
// ABOUTME: Proporciona páginas pre-autenticadas (cajero, almacenista, admin) para tests independientes

import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  cajeroPage: Page;
  almacenistaPage: Page;
  adminPage: Page;
  enfermerPage: Page;
  medicoPage: Page;
};

/**
 * Helper para hacer login con credenciales específicas
 * Usa locators específicos para Material-UI TextField que pone data-testid en el input nativo
 */
async function doLogin(page: Page, username: string, password: string) {
  await page.goto('http://localhost:3000/login');

  // Esperar a que el formulario de login esté visible
  await page.waitForLoadState('networkidle');

  // En Material-UI, inputProps.data-testid se aplica al input nativo
  // Usamos locator con CSS selector para mayor precisión
  const usernameInput = page.locator('[data-testid="username-input"]');
  const passwordInput = page.locator('[data-testid="password-input"]');
  const loginButton = page.locator('[data-testid="login-button"]');

  // Esperar a que los campos estén visibles
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });

  // Llenar credenciales
  await usernameInput.fill(username);
  await passwordInput.fill(password);

  // Esperar un momento para que el formulario se valide
  await page.waitForTimeout(500);

  // Click en botón de login
  await loginButton.click();

  // Esperar redirección al dashboard
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });

  // Esperar a que la tabla de ocupación cargue (indica que el dashboard está listo)
  await page.getByTestId('ocupacion-table').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Fixtures extendidas con páginas autenticadas
 */
export const test = base.extend<AuthFixtures>({
  cajeroPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await doLogin(page, 'cajero1', 'cajero123');

    await use(page);

    await context.close();
  },

  almacenistaPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await doLogin(page, 'almacen1', 'almacen123');

    await use(page);

    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await doLogin(page, 'admin', 'admin123');

    await use(page);

    await context.close();
  },

  enfermerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await doLogin(page, 'enfermero1', 'enfermero123');

    await use(page);

    await context.close();
  },

  medicoPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await doLogin(page, 'especialista1', 'medico123');

    await use(page);

    await context.close();
  },
});

export { expect } from '@playwright/test';
