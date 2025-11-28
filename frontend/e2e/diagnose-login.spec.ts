// ABOUTME: Test de diagnóstico para entender por qué el login no navega
// ABOUTME: Captura console logs y network requests para debugging

import { test, expect } from '@playwright/test';

test('Diagnose login behavior', async ({ page }) => {
  // Capturar errores y logs
  const consoleMessages: string[] = [];
  const networkRequests: Array<{url: string, status: number}> = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      networkRequests.push({
        url: response.url(),
        status: response.status()
      });
      try {
        const body = await response.json();
        console.log('Login response:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Could not parse response');
      }
    }
  });

  // Navegar a login
  await page.goto('http://localhost:3000/login');
  console.log('✓ Navegado a login');

  // Llenar campos usando data-testid
  await page.getByTestId('username-input').fill('cajero1');
  await page.getByTestId('password-input').fill('cajero123');
  console.log('✓ Campos llenados');

  // Click en login
  await page.getByTestId('login-button').click();
  console.log('✓ Click en login button');

  // Esperar un poco para ver qué pasa
  await page.waitForTimeout(5000);

  // URL actual
  const currentURL = page.url();
  console.log(`✓ URL actual: ${currentURL}`);

  // Console logs
  console.log('\n=== CONSOLE LOGS ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Network requests
  console.log('\n=== NETWORK REQUESTS ===');
  networkRequests.forEach(req => console.log(JSON.stringify(req)));

  // Screenshot
  await page.screenshot({ path: 'test-results/diagnose-login.png', fullPage: true });
  console.log('✓ Screenshot saved');
});
