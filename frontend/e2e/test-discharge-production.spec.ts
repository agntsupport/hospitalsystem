import { test, expect } from '@playwright/test';

test.describe('Test Alta Hospitalaria en Producción', () => {
  test('Login y dar de alta a paciente Alfredo', async ({ page }) => {
    // Navegar a la página de login de producción
    await page.goto('https://hospital-management-system-frontend.1nse3e.easypanel.host/login');

    // Esperar que la página cargue
    await page.waitForLoadState('networkidle');

    console.log('=== Página de login cargada ===');

    // Hacer login con especialista1
    await page.fill('input[name="username"]', 'especialista1');
    await page.fill('input[name="password"]', 'medico123');

    console.log('=== Credenciales ingresadas ===');

    // Click en botón de login
    await page.click('button[type="submit"]');

    // Esperar navegación después del login
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('=== Login exitoso, en dashboard ===');

    // Navegar a hospitalización
    await page.goto('https://hospital-management-system-frontend.1nse3e.easypanel.host/hospitalization');
    await page.waitForLoadState('networkidle');

    console.log('=== Página de hospitalización cargada ===');

    // Esperar que la página cargue completamente
    await page.waitForLoadState('networkidle');

    console.log('=== Buscando sección Pacientes Hospitalizados ===');

    // Tomar screenshot de la página completa
    await page.screenshot({ path: '/tmp/hospitalization-page.png', fullPage: true });
    console.log('=== Screenshot guardado en /tmp/hospitalization-page.png ===');

    // Buscar el paciente Alfredo en cualquier parte de la página
    const pacienteText = page.locator('text=Alfredo').first();
    await expect(pacienteText).toBeVisible({ timeout: 10000 });

    console.log('=== Paciente Alfredo encontrado en la página ===');

    // Buscar la fila del paciente en la tabla
    const pacienteRow = page.locator('tr:has-text("Alfredo")').first();
    await expect(pacienteRow).toBeVisible({ timeout: 10000 });

    console.log('=== Fila del paciente visible ===');

    // Escuchar eventos de consola del navegador
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // Listar TODOS los botones en la fila del paciente
    const buttonCount = await pacienteRow.locator('button').count();
    console.log(`=== Total de botones en la fila: ${buttonCount} ===`);

    for (let i = 0; i < buttonCount; i++) {
      const btn = pacienteRow.locator('button').nth(i);
      const isDisabled = await btn.isDisabled();
      const color = await btn.getAttribute('color') || 'sin color';
      const ariaLabel = await btn.getAttribute('aria-label') || 'sin aria-label';

      // Intentar obtener el tooltip
      await btn.hover();
      await page.waitForTimeout(500);
      const tooltip = await page.locator('[role="tooltip"]').textContent().catch(() => 'sin tooltip');

      console.log(`Botón ${i + 1}: disabled=${isDisabled}, color="${color}", aria-label="${ariaLabel}", tooltip="${tooltip}"`);
    }

    // Buscar específicamente el botón de "Dar de Alta" (color error = rojo)
    const altaButton = pacienteRow.locator('button[color="error"]').first();

    if (await altaButton.count() > 0) {
      console.log('=== ✅ Botón de alta encontrado (color error) ===');

      const isDisabled = await altaButton.isDisabled();
      console.log(`=== Botón disabled: ${isDisabled} ===`);

      if (!isDisabled) {
        console.log('=== Haciendo click en botón de alta ===');

        // Hacer click en el botón
        await altaButton.click();

        // Esperar que se ejecute el handler
        await page.waitForTimeout(2000);

        // Verificar si se abrió el diálogo de alta
        const dialog = page.locator('[role="dialog"]').first();
        const dialogVisible = await dialog.isVisible().catch(() => false);

        console.log(`=== Diálogo visible: ${dialogVisible} ===`);

        if (dialogVisible) {
          console.log('=== ✅ ÉXITO: Diálogo de alta se abrió correctamente ===');

          // Buscar el título del diálogo
          const dialogTitle = await dialog.locator('h2, h6').first().textContent().catch(() => 'sin título');
          console.log(`=== Título del diálogo: "${dialogTitle}" ===`);

          await page.screenshot({ path: '/tmp/discharge-dialog-open.png', fullPage: true });
          console.log('=== Screenshot del diálogo guardado ===');
        } else {
          console.log('=== ❌ PROBLEMA: Diálogo NO se abrió después del click ===');
          await page.screenshot({ path: '/tmp/no-dialog-after-click.png', fullPage: true });
          console.log('=== Screenshot del problema guardado ===');
        }
      } else {
        console.log('=== ❌ PROBLEMA: Botón está deshabilitado ===');
        await page.screenshot({ path: '/tmp/button-disabled.png', fullPage: true });
      }
    } else {
      console.log('=== ❌ PROBLEMA: No se encontró botón de alta con color="error" ===');
      await page.screenshot({ path: '/tmp/no-alta-button.png', fullPage: true });
    }

    // Mantener el navegador abierto por 10 segundos para inspeccionar
    console.log('=== Manteniendo navegador abierto 10 segundos ===');
    await page.waitForTimeout(10000);
  });
});
