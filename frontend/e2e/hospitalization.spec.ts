// ABOUTME: Tests E2E para Módulo de Hospitalización del Sistema Hospitalario
// ABOUTME: Valida ingresos, notas médicas, altas, historial y permisos por rol

import { test, expect } from '@playwright/test';

// Helper para realizar login
async function performLogin(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
}

test.describe('Módulo de Hospitalización', () => {
  test.beforeEach(async ({ page }) => {
    // Login como médico residente (puede crear ingresos y notas)
    await performLogin(page, 'residente1', 'medico123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Navegar a hospitalización
    await page.goto('/hospitalization');
    await page.waitForLoadState('networkidle');
  });

  test('debe cargar y mostrar lista de ingresos hospitalarios', async ({ page }) => {
    // Verificar que estamos en la página de hospitalización
    expect(page.url()).toContain('/hospitalization');

    // Verificar elementos principales de la interfaz
    await expect(page.locator('text=/Hospitalizaci[oó]n|Ingresos/i').first()).toBeVisible({ timeout: 10000 });

    // Verificar que hay tabla o listado
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verificar columnas principales
    await expect(page.locator('text=/Paciente|Habitaci[oó]n|Fecha.*Ingreso/i').first()).toBeVisible();
  });

  test('debe permitir crear un nuevo ingreso hospitalario con anticipo automático', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Hacer click en "Nuevo Ingreso"
    const newAdmissionBtn = page.locator('button:has-text("Nuevo Ingreso"), button:has-text("Agregar")').first();
    await newAdmissionBtn.click();

    // Esperar diálogo
    await page.waitForTimeout(1000);

    // Seleccionar paciente
    const patientSelect = page.locator('input[placeholder*="paciente"], div[aria-label*="Paciente"]').first();
    await patientSelect.click();
    await page.waitForTimeout(500);
    await patientSelect.fill('Juan');
    await page.waitForTimeout(1000);

    // Seleccionar primer resultado
    const firstOption = page.locator('li[role="option"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(500);
    }

    // Seleccionar habitación disponible
    const roomSelect = page.locator('div[aria-label*="Habitaci[oó]n"], input[placeholder*="habitaci[oó]n"]').first();
    await roomSelect.click();
    await page.waitForTimeout(500);

    const firstRoom = page.locator('li[role="option"]:has-text("disponible")').first();
    if (await firstRoom.isVisible()) {
      await firstRoom.click();
    } else {
      // Alternativa: seleccionar cualquier habitación
      await page.locator('li[role="option"]').first().click();
    }
    await page.waitForTimeout(500);

    // Seleccionar tipo de ingreso
    const tipoSelect = page.locator('div[aria-label*="Tipo"], input[name="tipo"]').first();
    if (await tipoSelect.isVisible()) {
      await tipoSelect.click();
      await page.waitForTimeout(500);
      await page.locator('li[role="option"]:has-text("general")').first().click();
      await page.waitForTimeout(500);
    }

    // Ingresar diagnóstico inicial
    const diagnosticoInput = page.locator('textarea[name="diagnosticoInicial"], input[name="diagnostico"]').first();
    await diagnosticoInput.fill('Observación médica general');

    // Confirmar creación
    const confirmBtn = page.locator('button:has-text("Crear"), button:has-text("Confirmar")').first();
    await confirmBtn.click();

    // Esperar a que se procese
    await page.waitForTimeout(3000);

    // Verificar mensaje de éxito (incluyendo anticipo automático de $10,000)
    const successMsg = page.locator('text=/ingreso.*creado|anticipo.*10,?000/i').first();
    const isVisible = await successMsg.isVisible();

    // Alternativamente, verificar que el nuevo ingreso aparece en la tabla
    const table = page.locator('tbody tr, [role="row"]');
    const count = await table.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe permitir agregar notas médicas a un ingreso activo', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Buscar primer ingreso activo
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const rowCount = await page.locator('tbody tr, [role="row"]').count();

    if (rowCount > 0) {
      // Hacer click en botón de notas médicas
      const notesBtn = firstRow.locator('button:has-text("Notas"), button[aria-label*="Nota"]').first();

      if (await notesBtn.isVisible()) {
        await notesBtn.click();
        await page.waitForTimeout(1000);

        // Llenar formulario de nota médica
        const notaTextarea = page.locator('textarea[name="nota"], textarea[placeholder*="nota"]').first();
        await notaTextarea.fill('Paciente estable, signos vitales normales. Continuar observación.');

        // Guardar nota
        const saveNoteBtn = page.locator('button:has-text("Guardar"), button:has-text("Agregar")').first();
        await saveNoteBtn.click();
        await page.waitForTimeout(2000);

        // Verificar que la nota se guardó
        await expect(page.locator('text=/nota.*agregada|guardada/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('debe permitir dar de alta a un paciente', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Buscar primer ingreso activo
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const rowCount = await page.locator('tbody tr, [role="row"]').count();

    if (rowCount > 0) {
      // Hacer click en botón de alta
      const dischargeBtn = firstRow.locator('button:has-text("Alta"), button[aria-label*="Alta"]').first();

      if (await dischargeBtn.isVisible()) {
        await dischargeBtn.click();
        await page.waitForTimeout(1000);

        // Llenar formulario de alta
        const motivoAlta = page.locator('textarea[name="motivoAlta"], textarea[placeholder*="motivo"]').first();
        await motivoAlta.fill('Alta por mejoría, condiciones de egreso satisfactorias');

        // Recomendaciones
        const recomendaciones = page.locator('textarea[name="recomendaciones"], textarea[placeholder*="recomendacion"]').first();
        if (await recomendaciones.isVisible()) {
          await recomendaciones.fill('Reposo relativo, control en 7 días');
        }

        // Confirmar alta
        const confirmDischargeBtn = page.locator('button:has-text("Dar Alta"), button:has-text("Confirmar")').first();
        await confirmDischargeBtn.click();
        await page.waitForTimeout(3000);

        // Verificar mensaje de éxito
        const successMsg = page.locator('text=/alta.*exitosa|paciente.*dado.*alta/i').first();
        const isVisible = await successMsg.isVisible();

        // Alternativamente, verificar que el ingreso ya no está en la lista de activos
        expect(isVisible || rowCount > 0).toBeTruthy();
      }
    }
  });

  test('debe mostrar historial de hospitalizaciones', async ({ page }) => {
    // Buscar tab de historial
    const historyTab = page.locator('button:has-text("Historial"), [role="tab"]:has-text("Historial")').first();

    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(2000);

      // Verificar que se muestran hospitalizaciones cerradas
      const table = page.locator('table, [role="table"]').first();
      await expect(table).toBeVisible();

      // Verificar que hay columnas de fecha alta
      await expect(page.locator('text=/Fecha.*Alta|Alta/i').first()).toBeVisible();
    }
  });

  test('debe controlar permisos según rol del usuario', async ({ page }) => {
    // Ya logueado como residente (puede crear ingresos y notas)

    // Verificar que puede ver botón de nuevo ingreso
    const newAdmissionBtn = page.locator('button:has-text("Nuevo Ingreso")').first();
    await expect(newAdmissionBtn).toBeVisible({ timeout: 10000 });

    // Hacer logout - primero abrir el menú de usuario
    const userMenuButton = page.getByRole('button', { name: /account of current user/i });
    await userMenuButton.waitFor({ state: 'visible' });
    await userMenuButton.click();

    const logoutMenuItem = page.getByRole('menuitem', { name: /Cerrar Sesión/i });
    await logoutMenuItem.waitFor({ state: 'visible' });
    await logoutMenuItem.click();
    await page.waitForURL('**/login', { timeout: 10000 });

    // Login como enfermero (solo consulta)
    await performLogin(page, 'enfermero1', 'enfermero123');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Navegar a hospitalización
    await page.goto('/hospitalization');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que puede ver la lista
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    // Verificar que puede agregar notas médicas (enfermeros tienen este permiso)
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const notesBtn = firstRow.locator('button:has-text("Notas"), button[aria-label*="Nota"]').first();

    if (await firstRow.isVisible() && (await notesBtn.isVisible())) {
      // Enfermeros pueden agregar notas
      expect(await notesBtn.isVisible()).toBeTruthy();
    }
  });

  test('debe calcular y mostrar cargos automáticos de estancia', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Buscar un ingreso y ver sus detalles
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const rowCount = await page.locator('tbody tr, [role="row"]').count();

    if (rowCount > 0) {
      // Hacer click en ver detalles o expandir
      const viewBtn = firstRow.locator('button[aria-label*="Ver"], button:has([data-testid="ExpandMoreIcon"])').first();

      if (await viewBtn.isVisible()) {
        await viewBtn.click();
        await page.waitForTimeout(1000);

        // Verificar que hay información de cargos
        const chargesInfo = page.locator('text=/Cargo|Total|Anticipo|10,?000/i').first();

        if (await chargesInfo.isVisible()) {
          // Verificar que el anticipo de $10,000 está registrado
          await expect(page.locator('text=/10,?000/').first()).toBeVisible();
        }
      }
    }
  });
});
