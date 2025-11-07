// ABOUTME: Test simple para validar que la tabla de ocupación se renderiza correctamente

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Dashboard - Tabla de Ocupación (Simple)', () => {
  test('Login y verificar Dashboard carga', async ({ page }) => {
    // Navegar a la página de login (como los tests existentes)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    console.log('✓ Página de login cargada');

    // Tomar screenshot del login
    await page.screenshot({ path: '/tmp/playwright-01-login.png' });

    // Realizar login con admin
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    console.log('✓ Credenciales ingresadas');

    // Click en submit
    await page.click('button[type="submit"]');

    // Esperar navegación al dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log('✅ Navegación exitosa a /dashboard');

    // Esperar a que el contenido cargue
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Tomar screenshot del dashboard
    await page.screenshot({ path: '/tmp/playwright-03-dashboard.png', fullPage: true });

    console.log('✓ Screenshot del dashboard capturado');

    // Verificar que la página tiene contenido
    const bodyText = await page.textContent('body');
    console.log(`✓ Contenido del body (primeros 200 chars): ${bodyText?.substring(0, 200)}`);

    // Buscar el texto de ocupación
    const hasOcupacionText = bodyText?.includes('Ocupación') || bodyText?.includes('ocupación');
    console.log(`📊 ¿Contiene texto 'ocupación'?: ${hasOcupacionText}`);

    const hasTiempoRealText = bodyText?.includes('Tiempo Real') || bodyText?.includes('tiempo real');
    console.log(`⏱️  ¿Contiene texto 'tiempo real'?: ${hasTiempoRealText}`);

    const hasHospitalText = bodyText?.includes('Hospital') || bodyText?.includes('hospital');
    console.log(`🏥 ¿Contiene texto 'hospital'?: ${hasHospitalText}`);

    // Contar tablas
    const tableCount = await page.locator('table').count();
    console.log(`📋 Número de tablas en la página: ${tableCount}`);

    // Contar cards de Material-UI
    const cardCount = await page.locator('[class*="MuiCard"]').count();
    console.log(`🎴 Número de cards: ${cardCount}`);

    // Verificar si hay errores en consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console error: ${msg.text()}`);
      }
    });

    // Assertions básicas
    expect(tableCount).toBeGreaterThan(0);
    expect(cardCount).toBeGreaterThan(0);
    expect(hasOcupacionText || hasTiempoRealText).toBeTruthy();
  });
});
