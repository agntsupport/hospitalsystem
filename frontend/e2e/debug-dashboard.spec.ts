// ABOUTME: Test de debugging para investigar por qué el dashboard no se renderiza después del login
// ABOUTME: Captura errores de consola, peticiones de red y screenshots del proceso

import { test, expect } from '@playwright/test';
import {
  fillTextField,
  fillPasswordField,
  clickButton
} from './helpers/selectors';

test('Debug: Login y Dashboard con monitoreo completo', async ({ page }) => {
  // Arrays para capturar eventos
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  const networkRequests: any[] = [];
  const networkResponses: any[] = [];

  // Capturar mensajes de consola
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Capturar errores de página
  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  // Capturar peticiones de red
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
  });

  // Capturar respuestas de red
  page.on('response', async response => {
    const request = response.request();
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      requestMethod: request.method()
    });
  });

  console.log('\n=== INICIANDO TEST DE DEBUG ===\n');

  // 1. Ir a login
  console.log('1. Navegando a /login...');
  await page.goto('http://localhost:3000/login');
  await page.screenshot({ path: '/tmp/debug-01-login-page.png', fullPage: true });

  // 2. Llenar formulario
  console.log('2. Llenando formulario de login...');
  await fillTextField(page, 'username-input', 'cajero1');
  await fillPasswordField(page, 'password-input', 'cajero123');
  await page.screenshot({ path: '/tmp/debug-02-form-filled.png', fullPage: true });

  // 3. Click en login
  console.log('3. Haciendo click en login...');
  await clickButton(page, 'login-button');

  // 4. Esperar navegación o error
  console.log('4. Esperando respuesta del servidor...');
  await page.waitForTimeout(3000); // Dar tiempo para que se complete el login
  await page.screenshot({ path: '/tmp/debug-03-after-login-click.png', fullPage: true });

  // 5. Verificar URL actual
  const currentUrl = page.url();
  console.log(`5. URL actual: ${currentUrl}`);

  // 6. Esperar más tiempo para ver si el dashboard carga
  console.log('6. Esperando 5 segundos adicionales para carga del dashboard...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/debug-04-after-wait.png', fullPage: true });

  // 7. Capturar estado del DOM
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log(`7. Longitud del HTML del body: ${bodyHTML.length} caracteres`);

  // Verificar si hay algún elemento visible
  const visibleElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    let visibleCount = 0;
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        visibleCount++;
      }
    });
    return visibleCount;
  });
  console.log(`   Elementos visibles en el DOM: ${visibleElements}`);

  // 8. Imprimir resumen de red
  console.log('\n=== PETICIONES DE RED ===');
  networkResponses
    .filter(r => r.url.includes('localhost:3001'))
    .forEach(r => {
      console.log(`${r.requestMethod} ${r.url} -> ${r.status} ${r.statusText}`);
    });

  // 9. Imprimir errores de consola
  console.log('\n=== ERRORES DE CONSOLA ===');
  if (consoleErrors.length === 0) {
    console.log('No hay errores de consola');
  } else {
    consoleErrors.forEach(err => console.log(err));
  }

  // 10. Imprimir mensajes de consola (últimos 20)
  console.log('\n=== ÚLTIMOS MENSAJES DE CONSOLA ===');
  consoleMessages.slice(-20).forEach(msg => console.log(msg));

  // 11. Verificar localStorage
  const localStorage = await page.evaluate(() => {
    return {
      token: window.localStorage.getItem('token'),
      user: window.localStorage.getItem('user')
    };
  });
  console.log('\n=== LOCALSTORAGE ===');
  console.log(`Token presente: ${localStorage.token ? 'SÍ' : 'NO'}`);
  console.log(`User presente: ${localStorage.user ? 'SÍ' : 'NO'}`);
  if (localStorage.user) {
    console.log(`User data: ${localStorage.user.substring(0, 100)}...`);
  }

  console.log('\n=== FIN DEL TEST DE DEBUG ===\n');

  // Assertion final para ver el estado
  expect(visibleElements).toBeGreaterThan(10); // Debe haber al menos 10 elementos visibles
});
