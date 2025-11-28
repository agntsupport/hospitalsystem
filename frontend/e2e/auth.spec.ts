// ABOUTME: Tests E2E para Autenticación y Autorización del Sistema Hospitalario
// ABOUTME: Valida login, logout, protección de rutas, validación JWT, y roles

import { test, expect } from '@playwright/test';
import { TOKEN_KEY, USER_KEY } from './helpers/constants';

// Helper para realizar login
async function performLogin(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Esperar a que los campos estén visibles y habilitados
  const usernameInput = page.getByTestId('username-input');
  const passwordInput = page.getByTestId('password-input');
  const loginButton = page.getByTestId('login-button');

  await usernameInput.waitFor({ state: 'visible' });
  await usernameInput.fill(username);

  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill(password);

  // Esperar que el botón esté habilitado antes de hacer click
  await loginButton.waitFor({ state: 'visible' });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
}

test.describe('Autenticación y Autorización', () => {
  test('debe hacer login exitoso con credenciales válidas', async ({ page }) => {
    await performLogin(page, 'admin', 'admin123');

    // Esperar redirección al dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en el dashboard
    expect(page.url()).toContain('/dashboard');

    // Verificar que el token está guardado en localStorage
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeTruthy();

    // Verificar que el usuario está guardado
    const userStr = await page.evaluate((key) => localStorage.getItem(key), USER_KEY);
    expect(userStr).toBeTruthy();

    const user = JSON.parse(userStr!);
    expect(user.username).toBe('admin');
    expect(user.rol).toBe('administrador');
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await performLogin(page, 'usuario_invalido', 'password_invalida');

    // Esperar a que aparezca el mensaje de error
    await page.waitForTimeout(2000);

    // Verificar que seguimos en la página de login
    expect(page.url()).toContain('/login');

    // Verificar que no hay token en localStorage
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeFalsy();
  });

  test('debe proteger rutas privadas sin autenticación', async ({ page }) => {
    // Intentar acceder a una ruta privada sin login
    await page.goto('/dashboard');

    // Debe redirigir al login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // Intentar acceder a pacientes
    await page.goto('/patients');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('debe validar token JWT en cada carga de página', async ({ page }) => {
    // Login exitoso
    await performLogin(page, 'admin', 'admin123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Guardar token válido
    const validToken = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(validToken).toBeTruthy();

    // Navegar a otra página y verificar que el token sigue siendo válido
    await page.goto('/patients');
    await page.waitForURL('**/patients', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // No debe redirigir al login
    expect(page.url()).toContain('/patients');

    // Invalidar token
    await page.evaluate((key) => localStorage.setItem(key, 'token_invalido'), TOKEN_KEY);

    // Recargar la página
    await page.reload();
    await page.waitForTimeout(2000);

    // Debe redirigir al login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('debe cerrar sesión correctamente (logout)', async ({ page }) => {
    // Login exitoso
    await performLogin(page, 'admin', 'admin123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Verificar que hay token
    let token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeTruthy();

    // Hacer logout - buscar botón de cerrar sesión en el sidebar
    const logoutButton = page.getByRole('button', { name: /Cerrar Sesión/i });
    await logoutButton.waitFor({ state: 'visible' });
    await logoutButton.click();

    // Esperar redirección al login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // Verificar que el token fue eliminado
    token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeFalsy();

    // Verificar que el usuario fue eliminado
    const user = await page.evaluate((key) => localStorage.getItem(key), USER_KEY);
    expect(user).toBeFalsy();
  });

  test('debe mantener sesión después de recargar página', async ({ page }) => {
    // Login exitoso
    await performLogin(page, 'admin', 'admin123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Recargar la página
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Debe seguir en el dashboard (no redirigir a login)
    expect(page.url()).toContain('/dashboard');

    // Verificar que el token persiste
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeTruthy();
  });

  test('debe mostrar diferentes interfaces según el rol del usuario', async ({ page }) => {
    // Login como cajero
    await performLogin(page, 'cajero1', 'cajero123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Verificar que el rol es cajero
    const userStr = await page.evaluate((key) => localStorage.getItem(key), USER_KEY);
    expect(userStr).toBeTruthy();
    const user = JSON.parse(userStr!);
    expect(user.rol).toBe('cajero');

    // Verificar que tiene acceso al POS
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/pos');

    // Hacer logout
    const logoutButton = page.getByRole('button', { name: /Cerrar Sesión/i });
    await logoutButton.waitFor({ state: 'visible' });
    await logoutButton.click();
    await page.waitForURL('**/login', { timeout: 10000 });

    // Login como enfermero (no debe tener acceso completo)
    await performLogin(page, 'enfermero1', 'enfermero123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Verificar rol enfermero
    const userStr2 = await page.evaluate((key) => localStorage.getItem(key), USER_KEY);
    expect(userStr2).toBeTruthy();
    const user2 = JSON.parse(userStr2!);
    expect(user2.rol).toBe('enfermero');
  });
});
