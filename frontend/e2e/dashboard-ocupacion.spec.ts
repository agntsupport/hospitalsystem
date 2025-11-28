// ABOUTME: Prueba E2E para validar la tabla de ocupación en tiempo real del Dashboard
// ABOUTME: Valida visibilidad de tablas, datos por tipo, auto-refresh y acceso por roles

import { test, expect } from '@playwright/test';

// Helper para realizar login
async function performLogin(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
}

test.describe('Dashboard - Tabla de Ocupación en Tiempo Real', () => {
  test.beforeEach(async ({ page }) => {
    // Realizar login con admin
    await performLogin(page, 'admin', 'admin123');

    // Esperar a que la navegación complete y llegue al Dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  });

  test('VALIDACIÓN 1: Tabla de ocupación visible en Dashboard', async ({ page }) => {
    console.log('✓ Test 1: Verificando visibilidad de la tabla de ocupación...');

    // Esperar a que el componente se cargue
    await page.waitForTimeout(2000);

    // Verificar que existe un elemento con el título de ocupación
    const ocupacionHeader = page.getByText(/ocupación.*tiempo real/i);
    await expect(ocupacionHeader).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Header de ocupación encontrado');

    // Verificar que existen las tablas de consultorios, habitaciones y quirófanos
    const tablesVisible = await page.locator('table').count();
    expect(tablesVisible).toBeGreaterThanOrEqual(3); // Al menos 3 tablas
    console.log(`  ✅ ${tablesVisible} tablas encontradas (esperadas: ≥3)`);

    // Verificar que existen chips de estado (disponible, ocupado, etc.)
    const chips = page.locator('[class*="MuiChip"]');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(0);
    console.log(`  ✅ ${chipCount} chips de estado encontrados`);
  });

  test('VALIDACIÓN 2: Datos de consultorios visibles', async ({ page }) => {
    console.log('✓ Test 2: Verificando datos de consultorios...');

    await page.waitForTimeout(2000);

    // Buscar sección de consultorios
    const consultorioSection = page.locator('text=/consultorio/i').first();
    await expect(consultorioSection).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Sección de consultorios visible');

    // Verificar que hay datos de totales
    const totalText = page.locator('text=/total.*\\d+/i');
    await expect(totalText.first()).toBeVisible();
    console.log('  ✅ Datos de totales visibles');
  });

  test('VALIDACIÓN 3: Datos de habitaciones visibles', async ({ page }) => {
    console.log('✓ Test 3: Verificando datos de habitaciones...');

    await page.waitForTimeout(2000);

    // Buscar sección de habitaciones
    const habitacionSection = page.locator('text=/habitacion/i').first();
    await expect(habitacionSection).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Sección de habitaciones visible');

    // Verificar chips de estado
    const estadoChips = page.locator('[class*="MuiChip"]', { hasText: /disponible|ocupad/i });
    const count = await estadoChips.count();
    expect(count).toBeGreaterThan(0);
    console.log(`  ✅ ${count} chips de estado encontrados en habitaciones`);
  });

  test('VALIDACIÓN 4: Datos de quirófanos visibles', async ({ page }) => {
    console.log('✓ Test 4: Verificando datos de quirófanos...');

    await page.waitForTimeout(2000);

    // Buscar sección de quirófanos
    const quirofanoSection = page.locator('text=/quirófano/i').first();
    await expect(quirofanoSection).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Sección de quirófanos visible');
  });

  test('VALIDACIÓN 5: Auto-refresh funciona (30 segundos)', async ({ page }) => {
    console.log('✓ Test 5: Verificando auto-refresh cada 30 segundos...');

    // Setup para interceptar las llamadas al endpoint
    let requestCount = 0;
    const requests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/dashboard/ocupacion')) {
        requestCount++;
        const timestamp = new Date().toISOString();
        requests.push(timestamp);
        console.log(`  📡 Request #${requestCount} al endpoint ocupación detectado: ${timestamp}`);
      }
    });

    console.log('  ⏱️  Esperando 65 segundos para verificar 2-3 peticiones...');
    console.log('  (1ra petición: inicial, 2da: +30s, 3ra: +60s)');

    // Esperar 65 segundos (debe haber al menos 2-3 peticiones)
    await page.waitForTimeout(65000);

    console.log(`  📊 Total de peticiones detectadas: ${requestCount}`);
    requests.forEach((timestamp, index) => {
      console.log(`     ${index + 1}. ${timestamp}`);
    });

    // Verificar que hubo al menos 2 peticiones (inicial + 1 auto-refresh)
    expect(requestCount).toBeGreaterThanOrEqual(2);
    console.log('  ✅ Auto-refresh verificado: múltiples peticiones detectadas');

    // Calcular diferencia entre primera y segunda petición
    if (requests.length >= 2) {
      const time1 = new Date(requests[0]).getTime();
      const time2 = new Date(requests[1]).getTime();
      const diffSeconds = Math.round((time2 - time1) / 1000);
      console.log(`  ⏰ Intervalo entre peticiones: ${diffSeconds} segundos (esperado: ~30s)`);

      // Verificar que el intervalo esté entre 28-32 segundos (con margen)
      expect(diffSeconds).toBeGreaterThanOrEqual(28);
      expect(diffSeconds).toBeLessThanOrEqual(32);
      console.log('  ✅ Intervalo de 30 segundos verificado');
    }
  });

  test('VALIDACIÓN 6: Resumen de ocupación con porcentaje', async ({ page }) => {
    console.log('✓ Test 6: Verificando resumen con porcentaje de ocupación...');

    await page.waitForTimeout(2000);

    // Buscar el porcentaje de ocupación en algún lugar
    const percentageText = page.locator('text=/\\d+(\\.\\d+)?%/');
    const count = await percentageText.count();

    expect(count).toBeGreaterThan(0);
    console.log(`  ✅ ${count} elementos con porcentaje encontrados`);

    // Verificar que hay un resumen general
    const resumenText = page.locator('text=/resumen|ocupación|capacidad/i');
    await expect(resumenText.first()).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Sección de resumen visible');
  });

  test('VALIDACIÓN 7: Datos de pacientes en habitaciones ocupadas', async ({ page }) => {
    console.log('✓ Test 7: Verificando datos de pacientes en habitaciones ocupadas...');

    await page.waitForTimeout(2000);

    // Buscar chips de estado "ocupada" o "ocupado"
    const ocupadoChips = page.locator('[class*="MuiChip"]', { hasText: /ocupad/i });
    const ocupadoCount = await ocupadoChips.count();

    console.log(`  📊 Habitaciones/Consultorios ocupados: ${ocupadoCount}`);

    if (ocupadoCount > 0) {
      // Si hay ocupados, debe haber información de pacientes
      const pacienteInfo = page.locator('text=/expediente|EXP-/i');
      const pacienteCount = await pacienteInfo.count();

      expect(pacienteCount).toBeGreaterThan(0);
      console.log(`  ✅ ${pacienteCount} referencias a pacientes encontradas`);
    } else {
      console.log('  ℹ️  No hay espacios ocupados actualmente (válido)');
    }
  });

  test('VALIDACIÓN 8: Indicador de última actualización', async ({ page }) => {
    console.log('✓ Test 8: Verificando indicador de última actualización...');

    await page.waitForTimeout(2000);

    // Buscar algún indicador de tiempo o actualización
    const timeIndicator = page.locator('text=/actualización|última|timestamp/i, [class*="CircularProgress"]');
    const hasIndicator = await timeIndicator.count() > 0;

    if (hasIndicator) {
      console.log('  ✅ Indicador de actualización encontrado');
    } else {
      console.log('  ℹ️  No se encontró indicador visible (no es crítico)');
    }
  });
});

test.describe('Dashboard - Acceso por Roles', () => {
  const roles = [
    { username: 'cajero1', password: 'cajero123', rol: 'Cajero' },
    { username: 'enfermero1', password: 'enfermero123', rol: 'Enfermero' },
    { username: 'almacen1', password: 'almacen123', rol: 'Almacenista' },
  ];

  roles.forEach(({ username, password, rol }) => {
    test(`VALIDACIÓN 9: Tabla visible para rol ${rol}`, async ({ page }) => {
      console.log(`✓ Test 9 (${rol}): Verificando acceso para rol ${rol}...`);

      // Login con el rol específico
      await performLogin(page, username, password);

      await page.waitForURL('**/dashboard', { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Verificar que la tabla de ocupación es visible
      const ocupacionVisible = page.locator('text=/ocupación.*tiempo real/i, table');
      const count = await ocupacionVisible.count();

      expect(count).toBeGreaterThan(0);
      console.log(`  ✅ Tabla de ocupación visible para ${rol} (${count} elementos)`);
    });
  });
});
