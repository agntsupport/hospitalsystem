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
 */
async function doLogin(page: Page, username: string, password: string) {
  await page.goto('http://localhost:3000/login');

  // Llenar credenciales usando data-testid
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);

  // Click en botón de login
  await page.getByTestId('login-button').click();

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
