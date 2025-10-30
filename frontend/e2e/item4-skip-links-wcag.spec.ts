import { test, expect } from '@playwright/test';

/**
 * ITEM 4: Skip Links WCAG 2.1 AA Compliance
 *
 * Valida que los Skip Links estén implementados correctamente según WCAG 2.1 AA
 * Fix aplicado en:
 * - frontend/src/components/common/Layout.tsx
 * - frontend/src/components/common/Sidebar.tsx
 *
 * Criterios WCAG 2.1 AA:
 * - 2.4.1 Bypass Blocks (Level A)
 * - Skip links deben ser el primer elemento focusable
 * - Deben ser visibles cuando reciben foco
 * - Deben funcionar correctamente (saltar al contenido/navegación)
 */

test.describe('ITEM 4: Skip Links WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Esperar redirección al dashboard
    await page.waitForURL('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('debe tener skip link "Saltar al contenido principal"', async ({ page }) => {
    // Verificar que existe el skip link
    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeAttached();

    // Verificar el texto
    await expect(skipToContent).toHaveText('Saltar al contenido principal');

    // Verificar que está posicionado fuera de la pantalla inicialmente
    const box = await skipToContent.boundingBox();
    if (box) {
      expect(box.x).toBeLessThan(0);
    }
  });

  test('debe tener skip link "Saltar a la navegación"', async ({ page }) => {
    // Verificar que existe el skip link
    const skipToNav = page.locator('a[href="#navigation"]');
    await expect(skipToNav).toBeAttached();

    // Verificar el texto
    await expect(skipToNav).toHaveText('Saltar a la navegación');

    // Verificar que está posicionado fuera de la pantalla inicialmente
    const box = await skipToNav.boundingBox();
    if (box) {
      expect(box.x).toBeLessThan(0);
    }
  });

  test('skip link debe ser visible cuando recibe foco con Tab', async ({ page }) => {
    // Presionar Tab para enfocar el primer elemento (skip link)
    await page.keyboard.press('Tab');

    // El skip link debe estar enfocado
    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeFocused();

    // Verificar que ahora ES visible (no está fuera de pantalla)
    const box = await skipToContent.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Debe estar en posición visible (left: 0 según el CSS)
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }

    // Verificar estilos cuando está enfocado
    const backgroundColor = await skipToContent.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy(); // Debe tener background color
  });

  test('skip link debe funcionar y saltar al contenido principal', async ({ page }) => {
    // Verificar que existe el elemento main-content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeAttached();

    // Verificar que tiene role="main"
    await expect(mainContent).toHaveAttribute('role', 'main');

    // Presionar Tab para enfocar skip link
    await page.keyboard.press('Tab');

    // Verificar que el skip link está enfocado
    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeFocused();

    // Hacer click en el skip link (o presionar Enter)
    await page.keyboard.press('Enter');

    // Esperar un momento para que el navegador procese el salto
    await page.waitForTimeout(300);

    // Verificar que el foco saltó al contenido principal
    // El navegador debe haber navegado al anchor #main-content
    expect(page.url()).toContain('#main-content');
  });

  test('skip link de navegación debe saltar al sidebar', async ({ page }) => {
    // Verificar que existe el elemento navigation
    const navigation = page.locator('#navigation');
    await expect(navigation).toBeAttached();

    // Verificar que tiene aria-label
    await expect(navigation).toHaveAttribute('aria-label', 'Main navigation');

    // Presionar Tab dos veces para llegar al segundo skip link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que el segundo skip link está enfocado
    const skipToNav = page.locator('a[href="#navigation"]');
    await expect(skipToNav).toBeFocused();

    // Hacer click en el skip link
    await page.keyboard.press('Enter');

    // Esperar que el navegador procese el salto
    await page.waitForTimeout(300);

    // Verificar que navegó al anchor #navigation
    expect(page.url()).toContain('#navigation');
  });

  test('skip links deben estar al inicio del orden de tabulación', async ({ page }) => {
    // El primer Tab debe enfocar el skip link de contenido principal
    await page.keyboard.press('Tab');
    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeFocused();

    // El segundo Tab debe enfocar el skip link de navegación
    await page.keyboard.press('Tab');
    const skipToNav = page.locator('a[href="#navigation"]');
    await expect(skipToNav).toBeFocused();

    // El tercer Tab debe enfocar otro elemento (no un skip link)
    await page.keyboard.press('Tab');
    await expect(skipToContent).not.toBeFocused();
    await expect(skipToNav).not.toBeFocused();
  });

  test('skip links deben tener z-index alto para estar sobre todo el contenido', async ({ page }) => {
    // Presionar Tab para enfocar skip link
    await page.keyboard.press('Tab');

    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeFocused();

    // Verificar z-index cuando está enfocado
    const zIndex = await skipToContent.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );

    // Debe tener z-index alto (9999 según implementación)
    expect(parseInt(zIndex)).toBeGreaterThan(1000);
  });

  test('skip links deben tener outline visible para accesibilidad', async ({ page }) => {
    // Presionar Tab para enfocar skip link
    await page.keyboard.press('Tab');

    const skipToContent = page.locator('a[href="#main-content"]');
    await expect(skipToContent).toBeFocused();

    // Verificar que tiene outline cuando está enfocado
    const outline = await skipToContent.evaluate((el) =>
      window.getComputedStyle(el).outline
    );

    // Debe tener outline (implementación usa outline naranja de 3px)
    expect(outline).toBeTruthy();
    expect(outline).not.toBe('none');
  });

  test('debe cumplir con navegación por teclado completa', async ({ page }) => {
    // Test de navegación completa por teclado
    let tabCount = 0;
    const maxTabs = 20; // Limitar para evitar loop infinito

    // Registrar todos los elementos enfocados
    const focusedElements: string[] = [];

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      tabCount++;

      // Obtener el elemento actualmente enfocado
      const focusedSelector = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return el.tagName + (el.id ? '#' + el.id : '') + (el.getAttribute('href') || '');
      });

      focusedElements.push(focusedSelector);

      // Si llegamos al final del formulario, romper el loop
      if (focusedSelector.includes('body') || focusedSelector === 'none') {
        break;
      }
    }

    // Verificar que los primeros dos elementos enfocados son los skip links
    expect(focusedElements[0]).toContain('#main-content');
    expect(focusedElements[1]).toContain('#navigation');

    // Verificar que pudimos navegar por al menos 5 elementos
    expect(tabCount).toBeGreaterThan(5);
  });

  test('main content debe tener atributos ARIA correctos', async ({ page }) => {
    const mainContent = page.locator('#main-content');

    // Verificar atributos ARIA
    await expect(mainContent).toHaveAttribute('role', 'main');
    await expect(mainContent).toHaveAttribute('aria-label', 'Main content');

    // Verificar que es un elemento <main> o tiene role="main"
    const tagName = await mainContent.evaluate((el) => el.tagName.toLowerCase());
    expect(['main', 'div']).toContain(tagName); // Puede ser <main> o <div role="main">
  });

  test('navigation debe tener atributos ARIA correctos', async ({ page }) => {
    const navigation = page.locator('#navigation');

    // Verificar atributos ARIA
    await expect(navigation).toHaveAttribute('aria-label', 'Main navigation');

    // Verificar que es un elemento <nav> o tiene role="navigation"
    const tagName = await navigation.evaluate((el) => el.tagName.toLowerCase());
    const role = await navigation.getAttribute('role');

    expect(['nav', 'navigation']).toContain(tagName.toLowerCase());
  });

  test('skip links deben funcionar en diferentes páginas', async ({ page }) => {
    // Probar en diferentes rutas
    const routes = ['/dashboard', '/patients', '/rooms', '/inventory'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Verificar que skip links existen en todas las páginas
      const skipToContent = page.locator('a[href="#main-content"]');
      const skipToNav = page.locator('a[href="#navigation"]');

      await expect(skipToContent).toBeAttached();
      await expect(skipToNav).toBeAttached();

      // Verificar que main-content y navigation existen
      await expect(page.locator('#main-content')).toBeAttached();
      await expect(page.locator('#navigation')).toBeAttached();
    }
  });
});
