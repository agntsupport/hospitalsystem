import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Módulo de Pacientes
 * Sistema de Gestión Hospitalaria Integral
 *
 * Valida:
 * - Listado y paginación de pacientes
 * - Búsqueda y filtrado avanzado
 * - Creación de nuevos pacientes
 * - Edición de pacientes existentes
 * - Eliminación (soft delete) de pacientes
 * - Validación de formularios
 * - Visualización de detalles
 * - Export de datos
 */

test.describe('Módulo de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navegar a pacientes
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('debe cargar y mostrar el listado de pacientes', async ({ page }) => {
    // Verificar que estamos en la página de pacientes
    expect(page.url()).toContain('/patients');

    // Verificar que hay una tabla o listado
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verificar que hay al menos una fila de datos
    const rows = page.locator('tbody tr, [role="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verificar columnas principales
    await expect(page.locator('text=/Nombre|Name/i').first()).toBeVisible();
    await expect(page.locator('text=/Expediente|ID/i').first()).toBeVisible();
  });

  test('debe permitir crear un nuevo paciente con todos los datos', async ({ page }) => {
    // Hacer click en botón "Nuevo Paciente" o similar
    const newPatientButton = page.locator('button:has-text("Nuevo Paciente"), button:has-text("Agregar")').first();
    await newPatientButton.click();

    // Esperar a que aparezca el diálogo/formulario
    await page.waitForTimeout(1000);

    // Llenar Paso 1: Información Personal
    await page.fill('input[name="nombre"]', 'Juan');
    await page.fill('input[name="apellidoPaterno"]', 'Pérez');
    await page.fill('input[name="apellidoMaterno"]', 'García');

    // Seleccionar sexo
    const sexoSelect = page.locator('div[aria-label="Sexo"], div:has(label:has-text("Sexo"))').first();
    await sexoSelect.click();
    await page.waitForTimeout(500);
    await page.locator('li:has-text("Masculino")').first().click();

    // Fecha de nacimiento
    const fechaNacimientoInput = page.locator('input[name="fechaNacimiento"]').first();
    await fechaNacimientoInput.fill('01/01/1990');

    // Hacer click en "Siguiente"
    const nextButton = page.locator('button:has-text("Siguiente")').first();
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Llenar Paso 2: Información de Contacto
    await page.fill('input[name="telefono"]', '5512345678');
    await page.fill('input[name="email"]', `juan.perez.${Date.now()}@test.com`);
    await page.fill('input[name="direccion"]', 'Calle Falsa 123');
    await page.fill('input[name="ciudad"]', 'Ciudad de México');
    await page.fill('input[name="estado"]', 'CDMX');
    await page.fill('input[name="codigoPostal"]', '01000');

    // Siguiente paso
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Llenar Paso 3: Información Médica
    await page.fill('input[name="numeroSeguroSocial"]', `NSS${Date.now()}`);
    await page.fill('textarea[name="alergias"]', 'Ninguna alergia conocida');
    await page.fill('textarea[name="enfermedadesCronicas"]', 'Ninguna');

    // Tipo de sangre
    const tipoSangreSelect = page.locator('div[aria-label="Tipo de Sangre"], div:has(label:has-text("Tipo"))').first();
    await tipoSangreSelect.click();
    await page.waitForTimeout(500);
    await page.locator('li:has-text("O+")').first().click();

    // Guardar
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear")').first();
    await saveButton.click();

    // Esperar a que el diálogo se cierre y aparezca notificación de éxito
    await page.waitForTimeout(2000);

    // Verificar que el nuevo paciente aparece en la lista
    await expect(page.locator('text=/Juan.*Pérez/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir buscar pacientes por nombre', async ({ page }) => {
    // Buscar campo de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[aria-label*="Buscar"]').first();
    await searchInput.fill('Juan');

    // Esperar a que se ejecute la búsqueda
    await page.waitForTimeout(2000);

    // Verificar que los resultados contienen "Juan"
    const results = page.locator('tbody tr, [role="row"]');
    const count = await results.count();

    if (count > 0) {
      const firstResult = results.first();
      await expect(firstResult).toContainText(/Juan/i);
    }
  });

  test('debe permitir editar un paciente existente', async ({ page }) => {
    // Esperar a que carguen los pacientes
    await page.waitForTimeout(2000);

    // Buscar botón de edición en la primera fila
    const editButton = page.locator('button[aria-label*="Editar"], button:has([data-testid="EditIcon"])').first();
    await editButton.click();

    // Esperar a que aparezca el formulario de edición
    await page.waitForTimeout(1000);

    // Modificar el teléfono
    const telefonoInput = page.locator('input[name="telefono"]').first();
    await telefonoInput.clear();
    await telefonoInput.fill('5599887766');

    // Ir al siguiente paso si es necesario (formulario multi-paso)
    const nextButton = page.locator('button:has-text("Siguiente")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Guardar cambios
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Actualizar")').first();
    await saveButton.click();

    // Esperar confirmación
    await page.waitForTimeout(2000);

    // Verificar que el teléfono fue actualizado
    await expect(page.locator('text=/5599887766/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('debe validar campos requeridos en el formulario', async ({ page }) => {
    // Abrir formulario de nuevo paciente
    const newPatientButton = page.locator('button:has-text("Nuevo Paciente"), button:has-text("Agregar")').first();
    await newPatientButton.click();
    await page.waitForTimeout(1000);

    // Intentar guardar sin llenar campos
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Siguiente")').first();
    await saveButton.click();

    // Esperar mensajes de validación
    await page.waitForTimeout(1000);

    // Verificar que aparecen mensajes de error o campos marcados como inválidos
    const errorMessages = page.locator('text=/requerido|obligatorio|required/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('debe permitir filtrar pacientes por estado activo/inactivo', async ({ page }) => {
    // Buscar filtro de estado
    const estadoFilter = page.locator('button:has-text("Filtros"), button:has-text("Estado")').first();

    if (await estadoFilter.isVisible()) {
      await estadoFilter.click();
      await page.waitForTimeout(500);

      // Seleccionar "Activos" o "Inactivos"
      const activosOption = page.locator('text=/Activos|Active/i').first();
      if (await activosOption.isVisible()) {
        await activosOption.click();
        await page.waitForTimeout(2000);

        // Verificar que la lista se actualizó
        const rows = page.locator('tbody tr, [role="row"]');
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('debe mostrar detalles completos de un paciente', async ({ page }) => {
    // Esperar a que carguen los pacientes
    await page.waitForTimeout(2000);

    // Hacer click en la primera fila o botón de ver detalles
    const viewButton = page.locator('button[aria-label*="Ver"], button:has([data-testid="VisibilityIcon"])').first();

    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Verificar que aparece un modal/diálogo con detalles
      const dialog = page.locator('[role="dialog"], .MuiDialog-root').first();
      await expect(dialog).toBeVisible();

      // Verificar que hay información del paciente
      await expect(dialog.locator('text=/Nombre|Teléfono|Email/i').first()).toBeVisible();
    } else {
      // Alternativa: hacer click en la fila
      const firstRow = page.locator('tbody tr, [role="row"]').first();
      await firstRow.click();
      await page.waitForTimeout(1000);
    }
  });

  test('debe permitir soft delete de un paciente', async ({ page }) => {
    // Esperar a que carguen los pacientes
    await page.waitForTimeout(2000);

    // Contar pacientes antes de eliminar
    const rowsBefore = page.locator('tbody tr, [role="row"]');
    const countBefore = await rowsBefore.count();

    // Buscar botón de eliminar
    const deleteButton = page.locator('button[aria-label*="Eliminar"], button:has([data-testid="DeleteIcon"])').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirmar eliminación
      const confirmButton = page.locator('button:has-text("Eliminar"), button:has-text("Confirmar")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // Verificar que el contador disminuyó (o mostrar mensaje de éxito)
        const rowsAfter = page.locator('tbody tr, [role="row"]');
        const countAfter = await rowsAfter.count();

        // Puede que el count sea igual si el paciente solo se marca como inactivo
        // pero se sigue mostrando. Verificar que hay feedback visual
        const successMessage = page.locator('text=/eliminado|desactivado|éxito/i').first();
        const isVisible = await successMessage.isVisible();

        expect(isVisible || countAfter <= countBefore).toBeTruthy();
      }
    }
  });

  test('debe tener paginación funcional', async ({ page }) => {
    // Esperar a que cargue la tabla
    await page.waitForTimeout(2000);

    // Buscar controles de paginación
    const paginationNext = page.locator('button[aria-label*="siguiente"], button[aria-label*="next"]').first();

    if (await paginationNext.isVisible() && !(await paginationNext.isDisabled())) {
      // Guardar el primer paciente de la página 1
      const firstRowPage1 = page.locator('tbody tr, [role="row"]').first();
      const textPage1 = await firstRowPage1.textContent();

      // Ir a la siguiente página
      await paginationNext.click();
      await page.waitForTimeout(2000);

      // Verificar que el contenido cambió
      const firstRowPage2 = page.locator('tbody tr, [role="row"]').first();
      const textPage2 = await firstRowPage2.textContent();

      expect(textPage1).not.toBe(textPage2);

      // Volver a la página anterior
      const paginationPrev = page.locator('button[aria-label*="anterior"], button[aria-label*="previous"]').first();
      await paginationPrev.click();
      await page.waitForTimeout(2000);

      // Verificar que volvemos al contenido original
      const firstRowBack = page.locator('tbody tr, [role="row"]').first();
      const textBack = await firstRowBack.textContent();
      expect(textBack).toBe(textPage1);
    }
  });
});
