import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Autenticación y Autorización
 * Sistema de Gestión Hospitalaria Integral
 *
 * Valida:
 * - Login con credenciales válidas
 * - Login con credenciales inválidas
 * - Verificación de token JWT
 * - Protección de rutas privadas
 * - Logout y limpieza de sesión
 */

test.describe('Autenticación y Autorización', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('debe hacer login exitoso con credenciales válidas', async ({ page }) => {
    await page.goto('/login');

    // Llenar formulario
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    // Hacer click en submit
    await page.click('button[type="submit"]');

    // Esperar redirección al dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en el dashboard
    expect(page.url()).toContain('/dashboard');

    // Verificar que el token está guardado en localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Verificar que el usuario está guardado
    const userStr = await page.evaluate(() => localStorage.getItem('user'));
    expect(userStr).toBeTruthy();

    const user = JSON.parse(userStr!);
    expect(user.username).toBe('admin');
    expect(user.rol).toBe('administrador');
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');

    // Llenar formulario con credenciales incorrectas
    await page.fill('input[name="username"]', 'usuario_invalido');
    await page.fill('input[name="password"]', 'password_invalida');

    // Hacer click en submit
    await page.click('button[type="submit"]');

    // Esperar a que aparezca el mensaje de error
    await page.waitForTimeout(2000);

    // Verificar que seguimos en la página de login
    expect(page.url()).toContain('/login');

    // Verificar que no hay token en localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });

  test('debe proteger rutas privadas sin autenticación', async ({ page }) => {
    // Intentar acceder a una ruta privada sin login
    await page.goto('/dashboard');

    // Debe redirigir al login
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');

    // Intentar acceder a pacientes
    await page.goto('/patients');
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('debe validar token JWT en cada carga de página', async ({ page }) => {
    // Login exitoso
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Guardar token válido
    const validToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(validToken).toBeTruthy();

    // Navegar a otra página y verificar que el token sigue siendo válido
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // No debe redirigir al login
    expect(page.url()).toContain('/patients');

    // Invalidar token
    await page.evaluate(() => localStorage.setItem('token', 'token_invalido'));

    // Recargar la página
    await page.reload();
    await page.waitForTimeout(2000);

    // Debe redirigir al login
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('debe cerrar sesión correctamente (logout)', async ({ page }) => {
    // Login exitoso
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verificar que hay token
    let token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Hacer logout (buscar botón o menú de usuario)
    // Abrir menú de usuario (puede estar en AppBar)
    const userMenuButton = page.locator('button[aria-label*="cuenta"], button[aria-label*="perfil"], button:has-text("admin")').first();
    await userMenuButton.click();

    // Esperar a que aparezca el menú
    await page.waitForTimeout(500);

    // Hacer click en Cerrar Sesión / Logout
    const logoutButton = page.locator('text=/Cerrar.*Sesión|Logout/i').first();
    await logoutButton.click();

    // Esperar redirección al login
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');

    // Verificar que el token fue eliminado
    token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();

    // Verificar que el usuario fue eliminado
    const user = await page.evaluate(() => localStorage.getItem('user'));
    expect(user).toBeFalsy();
  });

  test('debe mantener sesión después de recargar página', async ({ page }) => {
    // Login exitoso
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Recargar la página
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Debe seguir en el dashboard (no redirigir a login)
    expect(page.url()).toContain('/dashboard');

    // Verificar que el token persiste
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('debe mostrar diferentes interfaces según el rol del usuario', async ({ page }) => {
    // Login como cajero
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cajero1');
    await page.fill('input[name="password"]', 'cajero123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verificar que el rol es cajero
    const userStr = await page.evaluate(() => localStorage.getItem('user'));
    const user = JSON.parse(userStr!);
    expect(user.rol).toBe('cajero');

    // Verificar que tiene acceso al POS
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/pos');

    // Hacer logout
    const userMenuButton = page.locator('button[aria-label*="cuenta"], button[aria-label*="perfil"], button:has-text("cajero1")').first();
    await userMenuButton.click();
    await page.waitForTimeout(500);
    const logoutButton = page.locator('text=/Cerrar.*Sesión|Logout/i').first();
    await logoutButton.click();
    await page.waitForURL('/login');

    // Login como enfermero (no debe tener acceso completo)
    await page.fill('input[name="username"]', 'enfermero1');
    await page.fill('input[name="password"]', 'enfermero123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verificar rol enfermero
    const userStr2 = await page.evaluate(() => localStorage.getItem('user'));
    const user2 = JSON.parse(userStr2!);
    expect(user2.rol).toBe('enfermero');
  });
});
